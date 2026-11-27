'use server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { updateTag } from 'next/cache'
import { createEvent, deleteEvent } from '@/lib/gcal'
import { requireOwner, today } from '@/lib/owner'
import { copyKeys, sections, type SiteData } from '@/lib/site'
import { sessionDb } from '@/lib/supabase'
import { recordSignIn } from '@/lib/device'
import { syncBankMail } from '@/lib/gmail'

const s = (f: FormData, k: string) => String(f.get(k) ?? '').trim()
const list = (v: string) => v.split(',').map((x) => x.trim()).filter(Boolean)
const slugify = (v: string) =>
  v.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)

function check(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

// ── Auth ────────────────────────────────────────────────────────────────

/** Sign-in link by email: works before Google is set up. Only the owner's address gets past the callback. */
export async function signInEmail(f: FormData) {
  const email = s(f, 'email')
  const h = await headers()
  if (!/^\S+@\S+\.\S+$/.test(email)) redirect('/admin/login?e=email')
  const origin = h.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL
  const db = await sessionDb()
  const { error } = await db.auth.signInWithOtp({ email, options: { emailRedirectTo: `${origin}/auth/callback` } })
  redirect(error ? `/admin/login?e=send&m=${encodeURIComponent(error.message)}` : '/admin/login?sent=1')
}

/** After a passkey sign-in in the browser: confirm it is the owner (or sign straight out) and note the device. */
export async function noteSignIn() {
  const db = await sessionDb()
  const { data: ok } = await db.rpc('is_owner')
  if (!ok) {
    await db.auth.signOut()
    return false
  }
  await recordSignIn(db, 'passkey')
  return true
}

export async function renamePasskey(f: FormData) {
  const db = await requireOwner()
  check((await db.auth.passkey.update({ passkeyId: s(f, 'id'), friendlyName: s(f, 'name').slice(0, 120) || 'Passkey' })).error)
  redirect('/admin/devices')
}

export async function deletePasskey(f: FormData) {
  const db = await requireOwner()
  check((await db.auth.passkey.delete({ passkeyId: s(f, 'id') })).error)
  redirect('/admin/devices')
}

/** Forget a device: its history goes, so its next sign-in shows up as a new device. */
export async function forgetDevice(f: FormData) {
  const db = await requireOwner()
  check((await db.from('sign_ins').delete().eq('device', s(f, 'device'))).error)
  redirect('/admin/devices')
}

export async function signOut() {
  const db = await sessionDb()
  await db.auth.signOut()
  redirect('/admin/login')
}

// ── Writing ─────────────────────────────────────────────────────────────

export async function saveEntry(f: FormData) {
  const db = await requireOwner()
  const id = s(f, 'id')
  const visibility = s(f, 'visibility')
  const shared = visibility === 'public' || visibility === 'unlisted'
  const row = {
    type: s(f, 'type'),
    visibility,
    idea_stage: s(f, 'idea_stage') || null,
    slug: slugify(s(f, 'slug')) || (shared ? slugify(s(f, 'title_id') || s(f, 'title_en')) || null : null),
    category: s(f, 'category') || null,
    tags: list(s(f, 'tags')),
    title_id: s(f, 'title_id'),
    title_en: s(f, 'title_en'),
    excerpt_id: s(f, 'excerpt_id'),
    excerpt_en: s(f, 'excerpt_en'),
    body_id: String(f.get('body_id') ?? ''),
    body_en: String(f.get('body_en') ?? ''),
    published_at: s(f, 'published_at') || (visibility === 'public' ? new Date().toISOString() : null),
    updated_at: new Date().toISOString(),
    cover_url: /^https?:\/\//.test(s(f, 'cover_url')) ? s(f, 'cover_url') : null, // only links, never script URLs
    featured: f.get('featured') === 'on',
  }
  const q = id ? db.from('entries').update(row).eq('id', id) : db.from('entries').insert(row)
  const { data, error } = await q.select('id').single()
  check(error)
  updateTag('content')
  redirect(`/admin/entries/${data!.id}?saved=1`)
}

export async function deleteEntry(f: FormData) {
  const db = await requireOwner()
  check((await db.from('entries').delete().eq('id', s(f, 'id'))).error)
  updateTag('content')
  redirect('/admin/entries')
}

/** One box on the dashboard: first line becomes the title, the rest the body. */
export async function quickCapture(f: FormData) {
  const db = await requireOwner()
  const text = s(f, 'text')
  if (!text) return
  const [title, ...rest] = text.split('\n')
  const type = s(f, 'type') === 'idea' ? 'idea' : 'note'
  const { error } = await db.from('entries').insert({
    type,
    visibility: 'private',
    idea_stage: type === 'idea' ? 'new' : null,
    title_id: title.slice(0, 200),
    // the editor stores HTML: one paragraph per non-empty line, escaped
    body_id: rest
      .filter((l) => l.trim())
      .map((l) => `<p>${l.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
      .join(''),
  })
  check(error)
  redirect('/admin?captured=1')
}

// ── Comments ────────────────────────────────────────────────────────────

/** The owner's answer under a visitor's comment; the database marks it as the author's. */
export async function replyComment(f: FormData) {
  const db = await requireOwner()
  const body = s(f, 'body')
  if (!body) return
  const { data: me } = await db.auth.getClaims()
  const entry = s(f, 'entry')
  check((await db.rpc('add_comment', {
    p_entry: entry, p_parent: s(f, 'parent'), p_name: s(f, 'name') || 'Penulis', p_email: String(me?.claims.email ?? ''), p_body: body,
  })).error)
  updateTag(`comments-${entry}`)
  redirect('/admin/comments?replied=1')
}

export async function deleteComment(f: FormData) {
  const db = await requireOwner()
  check((await db.from('comments').delete().eq('id', s(f, 'id'))).error)
  updateTag(`comments-${s(f, 'entry')}`)
  redirect('/admin/comments')
}

// ── Money ───────────────────────────────────────────────────────────────

// Forms can say where to land afterwards (the dashboard's quick forms do); only admin paths are accepted.
const back = (f: FormData) => {
  const to = s(f, 'to')
  redirect(/^\/admin(\/|\?|$)/.test(to) ? to : `/admin/finance${s(f, 'm') ? `?m=${s(f, 'm')}` : ''}`)
}

export async function addTransaction(f: FormData) {
  const db = await requireOwner()
  const amount = Number(s(f, 'amount').replace(/[^\d.]/g, ''))
  if (!(amount > 0)) throw new Error('Jumlah harus lebih dari 0.')
  check(
    (
      await db.from('transactions').insert({
        date: s(f, 'date') || today(),
        amount,
        account_id: s(f, 'account_id'),
        category_id: s(f, 'category_id'),
        note: s(f, 'note'),
      })
    ).error,
  )
  back(f)
}

export async function deleteTransaction(f: FormData) {
  const db = await requireOwner()
  check((await db.from('transactions').delete().eq('id', s(f, 'id'))).error)
  back(f)
}

export async function addAccount(f: FormData) {
  const db = await requireOwner()
  check(
    (await db.from('accounts').insert({ name: s(f, 'name'), kind: s(f, 'kind'), opening_balance: Number(s(f, 'opening_balance')) || 0 }))
      .error,
  )
  back(f)
}

export async function addCategory(f: FormData) {
  const db = await requireOwner()
  check((await db.from('categories').insert({ name: s(f, 'name'), kind: s(f, 'kind') })).error)
  back(f)
}

export async function setBudget(f: FormData) {
  const db = await requireOwner()
  const amount = Number(s(f, 'amount').replace(/[^\d.]/g, '')) || 0
  check(
    (await db.from('budgets').upsert({ month: `${s(f, 'm')}-01`, category_id: s(f, 'category_id'), amount })).error,
  )
  back(f)
}

const rupiah = (f: FormData, k: string) => {
  const n = Number(s(f, k).replace(/[^\d]/g, ''))
  if (!(n > 0)) throw new Error('Jumlah harus lebih dari 0.')
  return n
}
const day = (f: FormData, k: string) => (/^\d{4}-\d{2}-\d{2}$/.test(s(f, k)) ? s(f, k) : null)

export async function addIncome(f: FormData) {
  const db = await requireOwner()
  const d = Math.min(31, Math.max(1, Number(s(f, 'day')) || 25))
  check((await db.from('incomes').insert({ name: s(f, 'name'), amount: rupiah(f, 'amount'), day: d, starts: day(f, 'starts') ?? today(), ends: day(f, 'ends') })).error)
  back(f)
}

export async function deleteIncome(f: FormData) {
  const db = await requireOwner()
  check((await db.from('incomes').delete().eq('id', s(f, 'id'))).error)
  back(f)
}

export async function addGoal(f: FormData) {
  const db = await requireOwner()
  check((await db.from('goals').insert({ name: s(f, 'name'), price: rupiah(f, 'price'), deadline: day(f, 'deadline') })).error)
  back(f)
}

export async function deleteGoal(f: FormData) {
  const db = await requireOwner()
  check((await db.from('goals').delete().eq('id', s(f, 'id'))).error)
  back(f)
}

// ── Bank email import ───────────────────────────────────────────────────

/** Name and file one imported transaction; with "always", every later (and waiting) one from that merchant too. */
export async function reviewTx(f: FormData) {
  const db = await requireOwner()
  const note = s(f, 'note').slice(0, 300)
  const category_id = s(f, 'category_id')
  check((await db.from('transactions').update({ note, category_id, reviewed: true }).eq('id', s(f, 'id'))).error)
  const pattern = s(f, 'pattern').toLowerCase()
  if (f.get('always') === 'on' && pattern.length >= 2) {
    check((await db.from('tx_rules').upsert({ pattern, title: note.slice(0, 120), category_id }, { onConflict: 'pattern' })).error)
    // the ones already waiting from the same merchant get the same treatment
    check((await db.from('transactions').update({ note, category_id, reviewed: true }).eq('reviewed', false).ilike('merchant', `%${pattern.replace(/[%_]/g, '')}%`)).error)
  }
  redirect('/admin/finance/review')
}

export async function acceptAllTx() {
  const db = await requireOwner()
  check((await db.from('transactions').update({ reviewed: true }).eq('reviewed', false)).error)
  redirect('/admin/finance/review')
}

export async function deleteRule(f: FormData) {
  const db = await requireOwner()
  check((await db.from('tx_rules').delete().eq('id', s(f, 'id'))).error)
  redirect('/admin/finance/review')
}

export async function syncMailNow(f: FormData) {
  const db = await requireOwner()
  const r = await syncBankMail(db, { force: true })
  const to = /^\/admin(\/|\?|$)/.test(s(f, 'to')) ? s(f, 'to') : '/admin/finance/review' // admin paths only
  redirect(`${to}${to.includes('?') ? '&' : '?'}synced=${'added' in r ? r.added : r.skipped}`)
}

export async function disconnectGoogle() {
  const db = await requireOwner()
  check((await db.from('integrations').delete().eq('provider', 'google')).error)
  redirect('/admin/devices')
}

// ── Calendar ────────────────────────────────────────────────────────────

export async function addEvent(f: FormData) {
  const db = await requireOwner()
  await createEvent(db, { summary: s(f, 'summary'), date: s(f, 'date'), start: s(f, 'start'), end: s(f, 'end') })
  redirect(s(f, 'from') || '/admin/calendar')
}

export async function removeEvent(f: FormData) {
  const db = await requireOwner()
  await deleteEvent(db, s(f, 'id'))
  redirect('/admin/calendar')
}

// ── Site ────────────────────────────────────────────────────────────────

export async function saveSite(f: FormData) {
  const db = await requireOwner()
  const url = (k: string) => (/^https?:\/\/\S+$/.test(s(f, k)) ? s(f, k) : '')
  const copy = (l: 'id' | 'en') => ({
    ...Object.fromEntries(copyKeys.map((k) => [k, s(f, `${l}.${k}`)])),
    words: [0, 1, 2, 3].map((i): [string, string] => [s(f, `${l}.word${i}`), s(f, `${l}.wordline${i}`)]),
    steps: s(f, `${l}.steps`).split('\n').map((x) => x.trim()).filter(Boolean),
    about: String(f.get(`${l}.about`) ?? ''),
  })
  const show = f.getAll('show').map(String)
  const data: SiteData = {
    name: s(f, 'name'),
    email: /^\S+@\S+\.\S+$/.test(s(f, 'email')) ? s(f, 'email') : '',
    github: url('github'),
    linkedin: url('linkedin'),
    instagram: url('instagram'),
    whatsapp: url('whatsapp'),
    accent: f.get('accent_default') === 'on' ? '' : s(f, 'accent'),
    hide: sections.map(([id]) => id).filter((id) => !show.includes(id)),
    id: copy('id'),
    en: copy('en'),
  }
  check((await db.from('site').upsert({ id: 1, data, updated_at: new Date().toISOString() })).error)
  updateTag('content')
  redirect('/admin/site?saved=1')
}

// ── Messages ────────────────────────────────────────────────────────────

export async function deleteMessage(f: FormData) {
  const db = await requireOwner()
  check((await db.from('messages').delete().eq('id', s(f, 'id'))).error)
  redirect('/admin/messages')
}

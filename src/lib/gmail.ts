// Bank notification emails → transactions. Reads only mail from known bank senders, newer than the last sync.
import { htmlToText, matchRule, parseBankMail, SENDERS } from './bankmail'
import { accessToken } from './google'
import type { Db } from './owner'

const API = 'https://gmail.googleapis.com/gmail/v1/users/me/messages'
type Part = { mimeType: string; body?: { data?: string }; parts?: Part[] }
type Message = { id: string; internalDate: string; payload: Part & { headers: { name: string; value: string }[] } }

const decode = (b64: string) => Buffer.from(b64, 'base64url').toString('utf8')
/** Plain text if the email has it, otherwise its HTML flattened to text. */
function body(p: Part): string {
  const find = (part: Part, type: string): string | null =>
    part.mimeType === type && part.body?.data ? decode(part.body.data) : (part.parts ?? []).map((x) => find(x, type)).find(Boolean) ?? null
  const html = find(p, 'text/html')
  return html ? htmlToText(html) : find(p, 'text/plain') ?? ''
}

/**
 * Fetches new bank emails and records each as a transaction. One with a matching rule is filed and named by it;
 * the rest land unreviewed, for the "Perlu judul" list. Safe to run repeatedly: the email id is the external id.
 */
export async function syncBankMail(db: Db, opts: { force?: boolean } = {}) {
  const { data: g } = await db.from('integrations').select('scopes, synced_at').eq('provider', 'google').maybeSingle()
  if (!g || !g.scopes.includes('gmail.readonly')) return { skipped: 'not-connected' as const }
  if (!opts.force && g.synced_at && Date.now() - Date.parse(g.synced_at) < 10 * 60e3) return { skipped: 'recent' as const }
  const token = await accessToken(db)
  if (!token) return { skipped: 'not-connected' as const }
  const auth = { headers: { Authorization: `Bearer ${token}` } }
  const started = new Date()
  // first sync looks back 60 days; later ones from the last sync, with an hour of overlap
  const since = g.synced_at ? Math.floor(Date.parse(g.synced_at) / 1000) - 3600 : Math.floor(Date.now() / 1000) - 60 * 86400
  const q = encodeURIComponent(`${SENDERS} after:${since}`)

  const ids: string[] = []
  for (let page = ''; ids.length < 500; ) {
    const res = await fetch(`${API}?q=${q}&maxResults=100${page ? `&pageToken=${page}` : ''}`, auth)
    if (!res.ok) throw new Error(`Gmail ${res.status}: ${await res.text()}`)
    const j = (await res.json()) as { messages?: { id: string }[]; nextPageToken?: string }
    ids.push(...(j.messages ?? []).map((m) => m.id))
    if (!j.nextPageToken) break
    page = j.nextPageToken
  }
  const known = new Set(
    ids.length ? ((await db.from('transactions').select('external_id').in('external_id', ids.map((id) => `gmail:${id}`))).data ?? []).map((r) => r.external_id) : [],
  )
  const fresh = ids.filter((id) => !known.has(`gmail:${id}`))

  const [{ data: rules }, { data: cats }, { data: accounts }] = await Promise.all([
    db.from('tx_rules').select('pattern, title, category_id'),
    db.from('categories').select('id, name, kind'),
    db.from('accounts').select('id, name'),
  ])
  // unknown spending and income each wait in a catch-all category until named
  const fallback = async (kind: 'income' | 'expense') => {
    const name = kind === 'income' ? 'Pemasukan lain' : 'Belum dikategorikan'
    const hit = cats!.find((c) => c.kind === kind && c.name === name)
    if (hit) return hit.id
    const { data, error } = await db.from('categories').insert({ name, kind }).select('id').single()
    if (error) throw new Error(error.message)
    cats!.push({ id: data.id, name, kind })
    return data.id as string
  }
  const accountFor = async (bank: string) => {
    const hit = accounts!.find((a) => a.name.toLowerCase().includes(bank.toLowerCase()))
    if (hit) return hit.id
    const { data, error } = await db.from('accounts').insert({ name: bank, kind: /pay|ovo|dana/i.test(bank) ? 'ewallet' : 'bank' }).select('id').single()
    if (error) throw new Error(error.message)
    accounts!.push({ id: data.id, name: bank })
    return data.id as string
  }

  let added = 0, unclear = 0
  for (const id of fresh) {
    const res = await fetch(`${API}/${id}?format=full`, auth)
    if (!res.ok) continue
    const m = (await res.json()) as Message
    const h = (n: string) => m.payload.headers.find((x) => x.name.toLowerCase() === n)?.value ?? ''
    const p = parseBankMail({ from: h('from'), subject: h('subject'), text: body(m.payload) })
    if (!p) continue
    const rule = matchRule(rules ?? [], p)
    const ruleOk = rule && cats!.find((c) => c.id === rule.category_id)?.kind === p.kind
    const date = new Date(+m.internalDate).toLocaleDateString('en-CA', { timeZone: process.env.TIMEZONE ?? 'Asia/Jakarta' })
    const { error } = await db.from('transactions').insert({
      date,
      amount: p.amount,
      account_id: await accountFor(p.bank),
      category_id: ruleOk ? rule.category_id : await fallback(p.kind),
      note: ruleOk && rule.title ? rule.title : p.merchant || p.what,
      merchant: p.merchant || p.what,
      source: 'email',
      external_id: `gmail:${id}`,
      reviewed: !!ruleOk,
    })
    if (error && !/duplicate key/.test(error.message)) throw new Error(error.message)
    if (!error) (added++, ruleOk || unclear++)
  }
  await db.from('integrations').update({ synced_at: started.toISOString() }).eq('provider', 'google')
  return { added, unclear }
}

import Link from 'next/link'
import { after } from 'next/server'
import { syncBankMail } from '@/lib/gmail'
import { eventDay, eventTime, listEvents, type CalEvent } from '@/lib/gcal'
import { idr, requireOwner, today, TZ } from '@/lib/owner'
import { beforeNextPay, planFrom } from '@/lib/plan'
import { addTransaction, quickCapture } from './actions'

/**
 * The page opened every morning: the day's agenda, money so far, what is waiting for an answer, and the two things
 * done most often (jot something down, log a purchase) right here, without opening another page.
 */
export default async function Today({ searchParams }: PageProps<'/admin'>) {
  const db = await requireOwner()
  const { captured, logged } = await searchParams
  const d0 = today()
  const d1 = today(1)
  const month = d0.slice(0, 7)
  const nextMonth = new Date(Date.UTC(+month.slice(0, 4), +month.slice(5, 7), 1)).toISOString().slice(0, 10)

  const [events, tx, budgets, drafts, notes, comments, messages, accounts, categories, allTx, allAccounts, allCategories, incomes, goals, unclear] = await Promise.all([
    listEvents(db, d0, d1).catch((e: Error) => e),
    db.from('transactions').select('amount, date, account_id, categories!inner(kind)').eq('categories.kind', 'expense').gte('date', `${month}-01`).lt('date', nextMonth).order('created_at', { ascending: false }),
    db.from('budgets').select('amount').eq('month', `${month}-01`),
    db.from('entries').select('id, title_id, title_en, updated_at').eq('type', 'article').eq('visibility', 'draft').order('updated_at', { ascending: false }).limit(4),
    db.from('entries').select('id, title_id, title_en, type').in('type', ['note', 'idea', 'journal']).order('updated_at', { ascending: false }).limit(4),
    db.from('comments').select('id, parent_id, name, body, by_owner, created_at, entries(title_id)').order('created_at', { ascending: false }).limit(60),
    db.from('messages').select('id, name, body, created_at').order('created_at', { ascending: false }).limit(3),
    db.from('accounts').select('id, name').order('name'),
    db.from('categories').select('id, name').eq('kind', 'expense').order('name'),
    // for today's spending allowance
    db.from('transactions').select('amount, date, account_id, category_id'),
    db.from('accounts').select('id, opening_balance'),
    db.from('categories').select('id, kind'),
    db.from('incomes').select('amount, day, starts, ends'),
    db.from('goals').select('id, name, price, deadline'),
    db.from('transactions').select('id', { count: 'exact', head: true }).eq('reviewed', false),
  ])
  // new bank emails are read after this page is sent, so opening the app never waits on Gmail
  after(() => syncBankMail(db).catch((e: Error) => console.error('bank mail sync:', e.message)))

  const spent = (tx.data ?? []).reduce((a, t) => a + Number(t.amount), 0)
  const spentToday = (tx.data ?? []).filter((t) => t.date === d0).reduce((a, t) => a + Number(t.amount), 0)
  const budget = (budgets.data ?? []).reduce((a, b) => a + Number(b.amount), 0)
  const monthEnd = new Date(Date.UTC(+month.slice(0, 4), +month.slice(5, 7), 0)).toISOString().slice(0, 10)
  const P = planFrom({ tx: allTx.data ?? [], categories: allCategories.data ?? [], accounts: allAccounts.data ?? [], incomes: incomes.data ?? [], goals: goals.data ?? [], today: d0, until: beforeNextPay(incomes.data ?? [], d0) ?? monthEnd })
  const answered = new Set((comments.data ?? []).filter((c) => c.by_owner && c.parent_id).map((c) => c.parent_id))
  const waiting = (comments.data ?? []).filter((c) => !c.by_owner && !answered.has(c.id))
  // the quick expense form starts on the account used last
  const lastAccount = tx.data?.[0]?.account_id
  const hour = Number(new Date().toLocaleString('en-GB', { timeZone: TZ, hour: '2-digit', hour12: false }))
  const greeting = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 19 ? 'Selamat sore' : 'Selamat malam'
  const dateLabel = new Date().toLocaleDateString('id-ID', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="note">{dateLabel}</p>
          <h1>{greeting}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/entries/new?type=article" className="btn">+ Tulisan</Link>
          <Link href="/admin/finance" className="btn-quiet btn">Keuangan</Link>
          <span className="note hidden self-center sm:inline">Ctrl K untuk semua perintah</span>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <form action={quickCapture} className="card grid gap-2">
          <label htmlFor="capture" className="card-title">Catat cepat</label>
          <textarea id="capture" name="text" rows={2} className="field" placeholder="Baris pertama jadi judul…" required />
          <div className="flex items-center gap-2">
            <select name="type" className="field w-auto!" aria-label="Jenis">
              <option value="note">Catatan</option>
              <option value="idea">Ide</option>
            </select>
            <button className="btn ml-auto">Simpan</button>
          </div>
          {captured && <p role="status" className="note">Tersimpan di Catatan.</p>}
        </form>

        <form id="catat" action={addTransaction} className="card grid gap-2">
          <input type="hidden" name="to" value="/admin?logged=1" />
          <p className="card-title">Catat pengeluaran</p>
          <div className="grid grid-cols-2 gap-2">
            <input name="amount" inputMode="numeric" className="field" placeholder="Jumlah, mis. 25000" aria-label="Jumlah" required />
            <input name="note" className="field" placeholder="Untuk apa?" aria-label="Catatan" />
            <select name="category_id" className="field" aria-label="Kategori" required>
              {(categories.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select name="account_id" className="field" aria-label="Akun" defaultValue={lastAccount} required>
              {(accounts.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            {logged && <p role="status" className="note">Tercatat.</p>}
            <button className="btn ml-auto">Catat</button>
          </div>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="card">
          <CardHead title="Agenda" href="/admin/calendar" />
          <Agenda events={events} d0={d0} d1={d1} />
        </div>

        <div className="card">
          <CardHead title="Uang bulan ini" href="/admin/finance" />
          <p className="note mt-3">Sisa jatah jajan hari ini</p>
          <p className={`text-4xl tabular-nums ${P.leftToday < 0 ? 'text-accent' : ''}`}>{idr(P.leftToday)}</p>
          {(unclear.count ?? 0) > 0 && (
            <Link href="/admin/finance/review" className="mt-2 flex items-center gap-2 text-sm"><span className="badge">{unclear.count}</span> transaksi dari email perlu judul →</Link>
          )}
          <p className="note">dari {idr(P.perDay)}/hari sampai {P.until === monthEnd ? 'akhir bulan' : 'gajian berikutnya'}, target tetap aman</p>
          <dl className="mt-4 grid grid-cols-2 gap-4">
            <div><dt className="note">Hari ini</dt><dd className="text-2xl">{idr(spentToday)}</dd></div>
            <div><dt className="note">Bulan ini</dt><dd className="text-2xl">{idr(spent)}</dd></div>
          </dl>
          {budget > 0 && (
            <div className="mt-4">
              <p className="note">Sisa anggaran <span className={spent > budget ? 'text-accent' : 'text-[var(--fg)]'}>{idr(budget - spent)}</span></p>
              <div className="meter mt-2"><span style={{ width: `${Math.min(100, (spent / budget) * 100)}%` }} className={spent > budget ? 'is-over' : ''} /></div>
            </div>
          )}
        </div>

        <div className="card">
          <CardHead title="Menunggu balasan" href="/admin/comments" count={waiting.length} />
          <List
            empty="Semua komentar sudah dibalas."
            rows={waiting.slice(0, 3).map((c) => ({
              href: '/admin/comments',
              title: `${c.name}: ${c.body}`,
              meta: (c.entries as unknown as { title_id: string } | null)?.title_id ?? '',
            }))}
          />
        </div>

        <div className="card">
          <CardHead title="Lanjutkan menulis" href="/admin/entries?visibility=draft" />
          <List empty="Tidak ada draft." rows={(drafts.data ?? []).map((d) => ({ href: `/admin/entries/${d.id}`, title: d.title_id || d.title_en || '(tanpa judul)', meta: new Date(d.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) }))} />
        </div>

        <div className="card">
          <CardHead title="Catatan terbaru" href="/admin/entries?kind=notes" />
          <List empty="Belum ada catatan." rows={(notes.data ?? []).map((n) => ({ href: `/admin/entries/${n.id}`, title: n.title_id || n.title_en || '(tanpa judul)', meta: n.type === 'idea' ? 'Ide' : n.type === 'journal' ? 'Jurnal' : 'Catatan' }))} />
        </div>

        <div className="card">
          <CardHead title="Pesan" href="/admin/messages" />
          <List empty="Belum ada pesan." rows={(messages.data ?? []).map((m) => ({ href: '/admin/messages', title: `${m.name}: ${m.body}`, meta: new Date(m.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) }))} />
        </div>
      </section>
    </div>
  )
}

function CardHead({ title, href, count }: { title: string; href: string; count?: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="card-title">
        {title}
        {!!count && <span className="badge">{count}</span>}
      </h2>
      <Link href={href} className="note link">Buka →</Link>
    </div>
  )
}

function List({ rows, empty }: { rows: { href: string; title: string; meta: string }[]; empty: string }) {
  if (!rows.length) return <p className="mt-3 text-muted">{empty}</p>
  return (
    <ul className="mt-2 divide-y divide-[var(--line)]">
      {rows.map((r, i) => (
        <li key={i}>
          <Link href={r.href} className="flex items-baseline justify-between gap-3 py-2 hover:text-[var(--orange)]">
            <span className="min-w-0 truncate">{r.title}</span>
            <span className="note shrink-0">{r.meta}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function Agenda({ events, d0, d1 }: { events: CalEvent[] | null | Error; d0: string; d1: string }) {
  if (events instanceof Error) return <p className="mt-3 text-accent">{events.message}</p>
  if (!events) return <p className="mt-3 text-muted">Kalender belum terhubung (perlu pengaturan Google).</p>
  return (
    <div className="mt-3 grid gap-3">
      {[[d0, 'Hari ini'], [d1, 'Besok']].map(([day, label]) => {
        const list = events.filter((e) => eventDay(e) === day)
        return (
          <div key={day}>
            <p className="note">{label}</p>
            {list.length ? (
              <ul>
                {list.map((e) => (
                  <li key={e.id} className="flex gap-3 border-t border-[var(--line)] py-1.5">
                    <span className="note w-24 shrink-0 pt-0.5">{eventTime(e)}</span>
                    <span>{e.summary ?? '(tanpa judul)'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">Kosong</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Reads the session and the URL on every request; no instant-navigation shell for the back office.
export const instant = false

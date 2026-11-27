import Link from 'next/link'
import { summarize } from '@/lib/money'
import { beforeNextPay, planFrom } from '@/lib/plan'
import { idr, requireOwner, today } from '@/lib/owner'
import { addAccount, addCategory, addGoal, addIncome, addTransaction, deleteGoal, deleteIncome, deleteTransaction, setBudget } from '../actions'

const shift = (m: string, by: number) => {
  const d = new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7) - 1 + by, 1))
  return d.toISOString().slice(0, 7)
}
const dayLabel = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })
const longDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

/** The next pay days of every running income, soonest first. */
function nextPays(incomes: { name: string; amount: number | string; day: number; starts: string; ends: string | null }[], from: string, count = 3) {
  const out: { date: string; name: string; amount: number }[] = []
  for (const inc of incomes)
    for (let k = 0; k < 14; k++) {
      const last = new Date(Date.UTC(+from.slice(0, 4), +from.slice(5, 7) + k, 0)).toISOString().slice(0, 10)
      const pay = `${last.slice(0, 8)}${String(Math.min(inc.day, +last.slice(8))).padStart(2, '0')}`
      if (inc.ends && pay > inc.ends) break
      if (pay > from && pay >= inc.starts) out.push({ date: pay, name: inc.name || 'Pendapatan', amount: Number(inc.amount) })
    }
  return out.sort((a, b) => a.date.localeCompare(b.date)).slice(0, count)
}

/**
 * Money, laid out the way the owner's spreadsheet was: balances per account first, a quick way to log, this month's
 * totals and the daily allowance, the cash flow day by day, then the plans (goals, expected income). Budgets and the
 * account and category settings fold away at the bottom.
 */
export default async function Finance({ searchParams }: PageProps<'/admin/finance'>) {
  const db = await requireOwner()
  const { m: raw, until: rawUntil, want: rawWant } = await searchParams
  const m = typeof raw === 'string' && /^\d{4}-\d{2}$/.test(raw) ? raw : today().slice(0, 7)

  const [accounts, categories, budgets, tx, incomes, goals] = await Promise.all([
    db.from('accounts').select('*').order('name'),
    db.from('categories').select('*').order('kind').order('name'),
    db.from('budgets').select('*').eq('month', `${m}-01`),
    // shortcut: loads every transaction to compute balances; fine for years of personal use, page it past ~50k rows.
    db.from('transactions').select('*').order('date', { ascending: false }).order('created_at', { ascending: false }),
    db.from('incomes').select('*').order('starts'),
    db.from('goals').select('*').order('created_at'),
  ])
  for (const r of [accounts, categories, budgets, tx, incomes, goals]) if (r.error) throw new Error(r.error.message)
  const A = accounts.data!, C = categories.data!, T = tx.data!
  const { balance, byCategory, income, expense } = summarize(T, C, A, m)
  const total = [...balance.values()].reduce((a, b) => a + b, 0)
  const budgetOf = new Map(budgets.data!.map((b) => [b.category_id, Number(b.amount)]))
  const name = new Map([...A, ...C].map((x) => [x.id, x.name]))
  const kind = new Map(C.map((c) => [c.id, c.kind]))
  const monthTx = T.filter((t) => t.date.startsWith(m))
  const unclear = T.filter((t) => !t.reviewed).length
  const monthLabel = new Date(`${m}-01T00:00:00`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  const ready = A.length > 0 && C.length > 0
  // the log form starts on what is used most: the account and spending category of the last 60 entries
  const most = (ids: string[]) => [...ids.reduce((c, id) => c.set(id, (c.get(id) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1])[0]?.[0]
  const recent = T.slice(0, 60)
  const usualAccount = most(recent.map((t) => t.account_id)) ?? A[0]?.id
  const usualCategory = most(recent.filter((t) => kind.get(t.category_id) === 'expense' && t.reviewed).map((t) => t.category_id)) ?? C.find((c) => c.kind === 'expense')?.id

  // cash flow grouped by day, newest first, each day with its net
  const days = new Map<string, typeof monthTx>()
  for (const t of monthTx) days.set(t.date, [...(days.get(t.date) ?? []), t])

  // the plan: allowance until a chosen date (default: the day before the next pay day), goals, and recurring income
  const now = today()
  const monthEnd = new Date(Date.UTC(+now.slice(0, 4), +now.slice(5, 7), 0)).toISOString().slice(0, 10)
  const until = typeof rawUntil === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawUntil) && rawUntil >= now ? rawUntil : (beforeNextPay(incomes.data!, now) ?? monthEnd)
  const P = planFrom({ tx: T, categories: C, accounts: A, incomes: incomes.data!, goals: goals.data!, today: now, until })
  const want = Number(String(rawWant ?? '').replace(/[^\d]/g, '')) || 25000
  const need = P.need(want)
  const pays = nextPays(incomes.data!, now)

  const day = ([d, list]: [string, typeof monthTx]) => {
          const net = list.reduce((a, t) => a + (kind.get(t.category_id) === 'income' ? 1 : -1) * Number(t.amount), 0)
          return (
            <div key={d} className="fin-day">
              <p className="fin-day-head"><span className="capitalize">{dayLabel(d)}</span><span className={`tabular-nums ${net < 0 ? '' : 'fin-in'}`}>{net < 0 ? '−' : '+'}{idr(Math.abs(net))}</span></p>
              <ul>
                {list.map((t) => {
                  const inc = kind.get(t.category_id) === 'income'
                  return (
                    <li key={t.id} className="fin-row">
                      <span className="fin-row-main">
                        <span className="fin-row-title">{t.note || name.get(t.category_id)}{!t.reviewed && <span className="fin-flag">perlu judul</span>}</span>
                        <span className="note">{name.get(t.category_id)} · {name.get(t.account_id)}</span>
                      </span>
                      <span className={`tabular-nums fin-row-amount ${inc ? 'fin-in' : ''}`}>{inc ? '+' : '−'}{idr(Number(t.amount))}</span>
                      <form action={deleteTransaction}>
                        <input type="hidden" name="id" value={t.id} /><input type="hidden" name="m" value={m} />
                        <button className="fin-del" aria-label="Hapus transaksi" title="Hapus">×</button>
                      </form>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        }
  return (
    <div className="fin grid gap-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="note">Keuangan</p>
          <h1 className="text-5xl font-semibold tracking-tight">Uang</h1>
        </div>
      </header>

      {/* SALDO: what is in each account right now */}
      <section className="fin-balance">
        <p className="note">Saldo sekarang</p>
        <p className={`fin-total tabular-nums ${total < 0 ? 'text-accent' : ''}`}>{idr(total)}</p>
        <ul className="fin-accounts">
          {A.map((a) => (
            <li key={a.id}>
              <span className="note">{a.name}</span>
              <span className={`tabular-nums ${(balance.get(a.id) ?? 0) < 0 ? 'text-accent' : ''}`}>{idr(balance.get(a.id) ?? 0)}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* log one line, the way a row went into the sheet */}
      {ready ? (
        <form action={addTransaction} className="fin-log">
          <input type="hidden" name="m" value={m} />
          <div className="fin-log-row">
            <input name="amount" inputMode="numeric" className="field fin-amount" required placeholder="Rp 25.000" aria-label="Jumlah" />
            <input name="note" className="field" placeholder="Untuk apa? (kopi, bensin…)" aria-label="Judul" />
          </div>
          <div className="fin-log-row">
            <select name="category_id" className="field" required aria-label="Kategori" defaultValue={usualCategory}>
              <optgroup label="Keluar">{C.filter((c) => c.kind === 'expense').map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>
              <optgroup label="Masuk">{C.filter((c) => c.kind === 'income').map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>
            </select>
            <select name="account_id" className="field" required aria-label="Rekening" defaultValue={usualAccount}>
              {A.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <input type="date" name="date" defaultValue={now} className="field" required aria-label="Tanggal" />
            <button className="btn">Catat</button>
          </div>
        </form>
      ) : (
        <p className="bg-surface p-4">Mulai dengan menambah minimal satu rekening dan satu kategori di bagian Pengaturan di bawah.</p>
      )}

      {/* this month at a glance, and the daily allowance */}
      <section className="grid gap-4">
        <div className="fin-month">
          <Link className="fin-step" href={`?m=${shift(m, -1)}`} aria-label="Bulan sebelumnya">‹</Link>
          <span className="capitalize">{monthLabel}</span>
          <Link className="fin-step" href={`?m=${shift(m, 1)}`} aria-label="Bulan berikutnya">›</Link>
        </div>
        <dl className="fin-stats grid gap-6 sm:grid-cols-3">
          <div><dt className="note">Masuk</dt><dd className="text-3xl">{idr(income)}</dd></div>
          <div><dt className="note">Keluar</dt><dd className="text-3xl">{idr(expense)}</dd></div>
          <div><dt className="note">Selisih</dt><dd className={`text-3xl ${income - expense < 0 ? 'text-accent' : ''}`}>{idr(income - expense)}</dd></div>
        </dl>

        <div className="fin-allow">
          <div>
            <p className="note">Boleh jajan per hari sampai {longDate(until)}</p>
            <p className="text-5xl font-semibold tabular-nums">{idr(P.perDay)}</p>
            <p className="note mt-2">
              {idr(P.spendable)} untuk {P.days} hari · dana darurat {idr(P.reserve)} tidak disentuh
              {P.setAside > 0 && <> · sisihkan {idr(P.setAside)}/bulan untuk target</>}
            </p>
          </div>
          <form className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="m" value={m} />
            <label className="grid gap-1"><span className="note">Sampai tanggal</span><input type="date" name="until" defaultValue={until} min={now} className="field" /></label>
            <label className="grid gap-1"><span className="note">Mau jajan/hari</span><input name="want" inputMode="numeric" defaultValue={want} className="field w-32!" /></label>
            <button className="btn btn-quiet">Hitung</button>
          </form>
          <p className="fin-need">
            {need > 0 ? (
              <>Supaya bisa jajan <b>{idr(want)}/hari</b>, perlu tambahan <b className="text-accent">{idr(need)}</b> <span className="note">(± {idr(need / P.days)}/hari)</span></>
            ) : (
              <>Jajan <b>{idr(want)}/hari</b> sudah tertutup. <span className="note">Masih lebih {idr(P.spendable - want * P.days)}.</span></>
            )}
          </p>
        </div>
      </section>

      {/* CASHFLOW: day by day */}
      <section className="grid gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-2xl font-semibold">Arus kas</h2>
          {unclear > 0 && <Link href="/admin/finance/review" className="flex items-center gap-2 text-sm"><span className="badge">{unclear}</span> perlu judul →</Link>}
        </div>
        {/* the cash flow is an archive: the two latest days in view, the rest one tap away */}
        {[...days.entries()].slice(0, 2).map(day)}
        {days.size > 2 && (
          <details className="fin-archive">
            <summary>Lihat arsip · {days.size - 2} hari lagi di {monthLabel}</summary>
            <div className="mt-3 grid gap-3">{[...days.entries()].slice(2).map(day)}</div>
          </details>
        )}
        {monthTx.length === 0 && <p className="text-muted">Belum ada transaksi di bulan ini.</p>}
      </section>

      {/* PLANNING and RENCANA PENDAPATAN */}
      <section className="grid gap-8 md:grid-cols-2">
        <div className="card">
          <h2 className="text-xl font-semibold">Target</h2>
          <ul className="mt-3">
            {P.goals.map((g) => (
              <li key={g.id} className="grid gap-1 border-t border-ink/15 py-3">
                <div className="flex justify-between gap-3"><span>{g.name}</span><span className="tabular-nums">{idr(g.price)}</span></div>
                <p className={`note ${g.onTrack ? '' : 'text-accent'}`}>
                  {g.buy ? (g.buy === now ? 'Bisa dibeli sekarang' : `Paling cepat ${longDate(g.buy)}`) : 'Belum terjangkau dengan pola sekarang'}
                  {g.monthly > 0 && <> · sisihkan {idr(g.monthly)}/bln</>}
                  {g.deadline && <> · tenggat {longDate(g.deadline)}</>}
                </p>
                <form action={deleteGoal}>
                  <input type="hidden" name="id" value={g.id} /><input type="hidden" name="m" value={m} />
                  <button className="note lift">hapus</button>
                </form>
              </li>
            ))}
            {P.goals.length === 0 && <li className="note border-t border-ink/15 py-3">Belum ada target.</li>}
          </ul>
          <details className="fin-more">
            <summary>+ Tambah target</summary>
            <form action={addGoal} className="mt-3 grid grid-cols-[1fr_1fr_auto] items-end gap-2">
              <input type="hidden" name="m" value={m} />
              <label className="col-span-full grid gap-1"><span className="note">Nama</span><input name="name" placeholder="Printer 3D" className="field" required /></label>
              <label className="grid gap-1"><span className="note">Harga</span><input name="price" inputMode="numeric" placeholder="5000000" className="field" required /></label>
              <label className="grid gap-1"><span className="note">Tenggat</span><input type="date" name="deadline" className="field" /></label>
              <button className="btn btn-quiet">Tambah</button>
            </form>
          </details>
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold">Rencana pendapatan</h2>
          <ul className="mt-3">
            {pays.map((p) => (
              <li key={p.date + p.name} className="flex justify-between gap-3 border-t border-ink/15 py-3">
                <span>{p.name} <span className="note">{longDate(p.date)}</span></span>
                <span className="tabular-nums fin-in">+{idr(p.amount)}</span>
              </li>
            ))}
            {pays.length === 0 && <li className="note border-t border-ink/15 py-3">Tidak ada pendapatan rutin yang akan datang.</li>}
          </ul>
          <details className="fin-more">
            <summary>Atur pendapatan rutin ({incomes.data!.length})</summary>
            <ul className="mt-2">
              {incomes.data!.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-2">
                  <span>{i.name || 'Pendapatan'} <span className="note">tgl {i.day}{i.ends ? ` s.d. ${longDate(i.ends)}` : ''}</span></span>
                  <span className="flex items-center gap-3">
                    <span className="tabular-nums">{idr(Number(i.amount))}</span>
                    <form action={deleteIncome}><input type="hidden" name="id" value={i.id} /><input type="hidden" name="m" value={m} /><button className="note lift">hapus</button></form>
                  </span>
                </li>
              ))}
            </ul>
            <form action={addIncome} className="mt-3 grid grid-cols-[1fr_1fr_4.5rem] items-end gap-2">
              <input type="hidden" name="m" value={m} />
              <label className="grid gap-1"><span className="note">Nama</span><input name="name" placeholder="Gaji" className="field" /></label>
              <label className="grid gap-1"><span className="note">Jumlah</span><input name="amount" inputMode="numeric" placeholder="3500000" className="field" required /></label>
              <label className="grid gap-1"><span className="note">Tgl</span><input name="day" type="number" min={1} max={31} defaultValue={25} className="field" /></label>
              <label className="grid gap-1"><span className="note">Mulai</span><input type="date" name="starts" defaultValue={now} className="field" /></label>
              <label className="grid gap-1"><span className="note">Berakhir</span><input type="date" name="ends" className="field" /></label>
              <button className="btn btn-quiet">Tambah</button>
            </form>
          </details>
        </div>
      </section>

      {/* budgets and settings, out of the way */}
      <details className="fin-fold">
        <summary>Anggaran per kategori · {monthLabel}</summary>
        <ul className="mt-4 grid gap-4">
          {C.filter((c) => c.kind === 'expense').map((c) => {
            const spent = byCategory.get(c.id) ?? 0
            const limit = budgetOf.get(c.id) ?? 0
            return (
              <li key={c.id} className="grid gap-2 sm:grid-cols-[12rem_1fr_16rem] sm:items-center">
                <span>{c.name}</span>
                <div>
                  <div className="meter"><span style={{ width: `${limit ? Math.min(100, (spent / limit) * 100) : spent ? 100 : 0}%` }} className={limit && spent > limit ? 'is-over' : ''} /></div>
                  <p className="note mt-1">{idr(spent)}{limit ? ` dari ${idr(limit)}` : ' · tanpa anggaran'}</p>
                </div>
                <form action={setBudget} className="flex gap-2">
                  <input type="hidden" name="m" value={m} />
                  <input type="hidden" name="category_id" value={c.id} />
                  <input name="amount" inputMode="numeric" defaultValue={limit || ''} placeholder="Anggaran" className="field" aria-label={`Anggaran ${c.name}`} />
                  <button className="btn btn-quiet">Set</button>
                </form>
              </li>
            )
          })}
        </ul>
      </details>

      <details className="fin-fold" id="pengaturan">
        <summary>Pengaturan rekening & kategori</summary>
        <div className="mt-4 grid gap-10 md:grid-cols-2">
          <div>
            <h3 className="font-semibold">Rekening</h3>
            <form action={addAccount} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="m" value={m} />
              <input name="name" placeholder="Nama rekening" className="field flex-1" required />
              <select name="kind" className="field w-auto!"><option value="bank">Bank</option><option value="ewallet">E-wallet</option><option value="cash">Tunai</option></select>
              <input name="opening_balance" inputMode="numeric" placeholder="Saldo awal" className="field w-32!" />
              <button className="btn btn-quiet">Tambah</button>
            </form>
          </div>
          <div>
            <h3 className="font-semibold">Kategori</h3>
            <p className="note mt-2">{C.map((c) => `${c.kind === 'income' ? '+' : '−'} ${c.name}`).join(' · ') || 'Belum ada.'}</p>
            <form action={addCategory} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="m" value={m} />
              <input name="name" placeholder="Nama kategori" className="field flex-1" required />
              <select name="kind" className="field w-auto!"><option value="expense">Pengeluaran</option><option value="income">Pemasukan</option></select>
              <button className="btn btn-quiet">Tambah</button>
            </form>
          </div>
        </div>
      </details>
    </div>
  )
}

// Reads the session and the URL on every request; no instant-navigation shell for the back office.
export const instant = false

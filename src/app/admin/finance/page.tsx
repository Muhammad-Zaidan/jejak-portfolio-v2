import Link from 'next/link'
import { summarize } from '@/lib/money'
import { beforeNextPay, planFrom } from '@/lib/plan'
import { idr, requireOwner, today } from '@/lib/owner'
import { addAccount, addCategory, addGoal, addIncome, addTransaction, deleteGoal, deleteIncome, deleteTransaction, setBudget } from '../actions'

const shift = (m: string, by: number) => {
  const d = new Date(Date.UTC(+m.slice(0, 4), +m.slice(5, 7) - 1 + by, 1))
  return d.toISOString().slice(0, 7)
}

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
  const budgetOf = new Map(budgets.data!.map((b) => [b.category_id, Number(b.amount)]))
  const name = new Map([...A, ...C].map((x) => [x.id, x.name]))
  const monthTx = T.filter((t) => t.date.startsWith(m))
  const monthLabel = new Date(`${m}-01T00:00:00`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  const ready = A.length > 0 && C.length > 0

  // the plan: allowance until a chosen date (default: the day before the next pay day), goals, and recurring income
  const now = today()
  const monthEnd = new Date(Date.UTC(+now.slice(0, 4), +now.slice(5, 7), 0)).toISOString().slice(0, 10)
  const until = typeof rawUntil === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawUntil) && rawUntil >= now ? rawUntil : (beforeNextPay(incomes.data!, now) ?? monthEnd)
  const P = planFrom({ tx: T, categories: C, accounts: A, incomes: incomes.data!, goals: goals.data!, today: now, until })
  const spend = P.spend
  const want = Number(String(rawWant ?? '').replace(/[^\d]/g, '')) || 25000
  const need = P.need(want)
  const longDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="grid gap-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="note">Keuangan</p>
          <h1 className="text-5xl font-semibold tracking-tight capitalize">{monthLabel}</h1>
        </div>
        <nav className="flex gap-4">
          <Link className="lift" href={`?m=${shift(m, -1)}`}>← Sebelumnya</Link>
          <Link className="lift" href={`?m=${shift(m, 1)}`}>Berikutnya →</Link>
        </nav>
      </header>

      <dl className="fin-stats grid gap-6 sm:grid-cols-3">
        <div><dt className="note">Pemasukan</dt><dd className="text-3xl">{idr(income)}</dd></div>
        <div><dt className="note">Pengeluaran</dt><dd className="text-3xl">{idr(expense)}</dd></div>
        <div><dt className="note">Selisih</dt><dd className={`text-3xl ${income - expense < 0 ? 'text-accent' : ''}`}>{idr(income - expense)}</dd></div>
      </dl>

      <section className="grid gap-8">
        <div className="grid gap-6 bg-surface p-5 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="note">Boleh jajan per hari sampai {longDate(until)}</p>
            <p className="text-5xl font-semibold tabular-nums">{idr(P.perDay)}</p>
            <p className="note mt-2">
              {idr(P.spendable)} untuk {P.days} hari · dana darurat {idr(P.reserve)} tidak disentuh
              {P.setAside > 0 && <> · sisihkan {idr(P.setAside)}/bulan untuk target</>}
              {spend === 0 && <> · belum ada data pengeluaran 3 bulan terakhir, jadi dana darurat masih 0</>}
            </p>
          </div>
          <form className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="m" value={m} />
            <label className="grid gap-1"><span className="note">Sampai tanggal</span><input type="date" name="until" defaultValue={until} min={now} className="field" /></label>
            <label className="grid gap-1"><span className="note">Mau jajan/hari (Rp)</span><input name="want" inputMode="numeric" defaultValue={want} className="field w-32!" /></label>
            <button className="btn btn-quiet">Hitung</button>
          </form>
          <p className="sm:col-span-2 border-t border-ink/20 pt-4">
            {need > 0 ? (
              <>Supaya bisa jajan <b>{idr(want)}/hari</b> sampai {longDate(until)}, kamu perlu dapat tambahan <b className="text-accent">{idr(need)}</b> <span className="note">(sekitar {idr(need / P.days)}/hari), tanpa menyentuh dana darurat dan target.</span></>
            ) : (
              <>Jajan <b>{idr(want)}/hari</b> sampai {longDate(until)} sudah tertutup. <span className="note">Masih lebih {idr(P.spendable - want * P.days)}.</span></>
            )}
          </p>
        </div>

        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">Target</h2>
            <ul className="mt-4">
              {P.goals.map((g) => (
                <li key={g.id} className="grid gap-1 border-t border-ink/20 py-3">
                  <div className="flex justify-between gap-3"><span>{g.name}</span><span className="tabular-nums">{idr(g.price)}</span></div>
                  <p className={`note ${g.onTrack ? '' : 'text-accent'}`}>
                    {g.buy ? (g.buy === now ? 'Bisa dibeli sekarang' : `Paling cepat terbeli ${longDate(g.buy)}`) : 'Belum terjangkau dalam 3 tahun dengan pola sekarang'}
                    {g.monthly > 0 && <> · sisihkan {idr(g.monthly)}/bulan</>}
                    {g.deadline && <> · tenggat {longDate(g.deadline)}{!g.onTrack && ' (tidak terkejar)'}</>}
                  </p>
                  <form action={deleteGoal}>
                    <input type="hidden" name="id" value={g.id} /><input type="hidden" name="m" value={m} />
                    <button className="note lift">hapus</button>
                  </form>
                </li>
              ))}
            </ul>
            <form action={addGoal} className="mt-4 grid grid-cols-[1fr_1fr_auto] items-end gap-2">
              <input type="hidden" name="m" value={m} />
              <label className="col-span-full grid gap-1"><span className="note">Nama</span><input name="name" placeholder="Printer 3D" className="field" required /></label>
              <label className="grid gap-1"><span className="note">Harga (Rp)</span><input name="price" inputMode="numeric" placeholder="5000000" className="field" required /></label>
              <label className="grid gap-1"><span className="note">Tenggat (opsional)</span><input type="date" name="deadline" className="field" /></label>
              <button className="btn btn-quiet">Tambah</button>
            </form>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Pendapatan rutin</h2>
            <ul className="mt-4">
              {incomes.data!.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 border-t border-ink/20 py-3">
                  <span>{i.name || 'Pendapatan'} <span className="note">tiap tgl {i.day}{i.ends ? `, sampai ${longDate(i.ends)}` : ''}</span></span>
                  <span className="flex items-center gap-3">
                    <span className="tabular-nums">{idr(Number(i.amount))}</span>
                    <form action={deleteIncome}>
                      <input type="hidden" name="id" value={i.id} /><input type="hidden" name="m" value={m} />
                      <button className="note lift">hapus</button>
                    </form>
                  </span>
                </li>
              ))}
            </ul>
            <form action={addIncome} className="mt-4 grid grid-cols-[1fr_1fr_4.5rem] items-end gap-2">
              <input type="hidden" name="m" value={m} />
              <label className="grid gap-1"><span className="note">Nama</span><input name="name" placeholder="Uang saku" className="field" /></label>
              <label className="grid gap-1"><span className="note">Jumlah (Rp)</span><input name="amount" inputMode="numeric" placeholder="3500000" className="field" required /></label>
              <label className="grid gap-1"><span className="note">Tgl</span><input name="day" type="number" min={1} max={31} defaultValue={25} className="field" /></label>
              <label className="grid gap-1"><span className="note">Mulai</span><input type="date" name="starts" defaultValue={now} className="field" /></label>
              <label className="grid gap-1"><span className="note">Berakhir (opsional)</span><input type="date" name="ends" className="field" /></label>
              <button className="btn btn-quiet">Tambah</button>
            </form>
          </div>
        </div>
      </section>

      {ready ? (
        <form action={addTransaction} className="grid gap-3 bg-surface p-4 sm:grid-cols-[9rem_10rem_1fr_1fr_1.5fr_auto] sm:items-end">
          <input type="hidden" name="m" value={m} />
          <label className="grid gap-1"><span className="note">Tanggal</span><input type="date" name="date" defaultValue={today()} className="field" required /></label>
          <label className="grid gap-1"><span className="note">Jumlah (Rp)</span><input name="amount" inputMode="numeric" className="field" required placeholder="25000" /></label>
          <label className="grid gap-1"><span className="note">Kategori</span>
            <select name="category_id" className="field" required>
              {C.map((c) => <option key={c.id} value={c.id}>{c.kind === 'income' ? '+ ' : '− '}{c.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1"><span className="note">Akun</span>
            <select name="account_id" className="field" required>
              {A.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1"><span className="note">Catatan</span><input name="note" className="field" /></label>
          <button className="btn">Catat</button>
        </form>
      ) : (
        <p className="bg-surface p-4">Mulai dengan menambah minimal satu akun dan satu kategori di bawah.</p>
      )}

      <section>
        <h2 className="text-2xl font-semibold">Pengeluaran per kategori</h2>
        <ul className="mt-4 grid gap-4">
          {C.filter((c) => c.kind === 'expense').map((c) => {
            const spent = byCategory.get(c.id) ?? 0
            const limit = budgetOf.get(c.id) ?? 0
            return (
              <li key={c.id} className="grid gap-2 sm:grid-cols-[12rem_1fr_16rem] sm:items-center">
                <span>{c.name}</span>
                <div>
                  <div className="h-2.5 bg-surface">
                    <div className={`h-2.5 ${limit && spent > limit ? 'bg-accent' : 'bg-ink'}`} style={{ width: `${limit ? Math.min(100, (spent / limit) * 100) : spent ? 100 : 0}%` }} />
                  </div>
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
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Transaksi</h2>
        <table className="tx-table mt-4 w-full text-left">
          <thead className="note"><tr><th className="py-2 font-normal">Tanggal</th><th className="font-normal">Kategori</th><th className="font-normal">Akun</th><th className="font-normal">Catatan</th><th className="font-normal text-right">Jumlah</th><th /></tr></thead>
          <tbody>
            {monthTx.map((t) => {
              const inc = C.find((c) => c.id === t.category_id)?.kind === 'income'
              return (
                <tr key={t.id} className="border-t border-ink/20">
                  <td className="py-2 pr-3 note">{t.date}</td>
                  <td className="pr-3">{name.get(t.category_id)}</td>
                  <td className="pr-3">{name.get(t.account_id)}</td>
                  <td className="pr-3">{t.note}{t.source !== 'manual' && <span className="note"> · {t.source}</span>}</td>
                  <td className={`pr-3 text-right tabular-nums ${inc ? '' : 'text-muted'}`}>{inc ? '+' : '−'}{idr(Number(t.amount))}</td>
                  <td>
                    <form action={deleteTransaction}>
                      <input type="hidden" name="id" value={t.id} /><input type="hidden" name="m" value={m} />
                      <button className="note lift" aria-label="Hapus transaksi">hapus</button>
                    </form>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {monthTx.length === 0 && <p className="mt-4 text-muted">Belum ada transaksi bulan ini.</p>}
      </section>

      <section className="grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold">Akun</h2>
          <ul className="mt-4">
            {A.map((a) => (
              <li key={a.id} className="flex justify-between border-t border-ink/20 py-2"><span>{a.name} <span className="note">{a.kind}</span></span><span className="tabular-nums">{idr(balance.get(a.id) ?? 0)}</span></li>
            ))}
          </ul>
          <form action={addAccount} className="mt-4 flex flex-wrap gap-2">
            <input type="hidden" name="m" value={m} />
            <input name="name" placeholder="Nama akun" className="field flex-1" required />
            <select name="kind" className="field w-auto!"><option value="bank">Bank</option><option value="ewallet">E-wallet</option><option value="cash">Tunai</option></select>
            <input name="opening_balance" inputMode="numeric" placeholder="Saldo awal" className="field w-32!" />
            <button className="btn btn-quiet">Tambah</button>
          </form>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Kategori</h2>
          <p className="mt-4">{C.map((c) => `${c.kind === 'income' ? '+' : '−'} ${c.name}`).join(' · ') || 'Belum ada.'}</p>
          <form action={addCategory} className="mt-4 flex flex-wrap gap-2">
            <input type="hidden" name="m" value={m} />
            <input name="name" placeholder="Nama kategori" className="field flex-1" required />
            <select name="kind" className="field w-auto!"><option value="expense">Pengeluaran</option><option value="income">Pemasukan</option></select>
            <button className="btn btn-quiet">Tambah</button>
          </form>
        </div>
      </section>
    </div>
  )
}

// Reads the session and the URL on every request; no instant-navigation shell for the back office.
export const instant = false

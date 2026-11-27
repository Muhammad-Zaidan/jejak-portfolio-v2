import Link from 'next/link'
import { analyse, type MonthStat } from '@/lib/insights'
import { idr, requireOwner, today } from '@/lib/owner'
import { Bars, Compare, Line } from '../../charts'

const monthName = (m: string, style: 'short' | 'long' = 'short') => new Date(`${m}-01T00:00:00`).toLocaleDateString('id-ID', { month: style, ...(style === 'long' ? { year: 'numeric' } : {}) })
const dayName = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'short' })

/** How the money is going: overall, this month against the three before it, and this week. */
export default async function Insights() {
  const db = await requireOwner()
  const [tx, categories, accounts] = await Promise.all([
    db.from('transactions').select('amount, date, account_id, category_id, note'),
    db.from('categories').select('id, name, kind'),
    db.from('accounts').select('id, opening_balance'),
  ])
  for (const r of [tx, categories, accounts]) if (r.error) throw new Error(r.error.message)
  const now = today()
  const A = analyse({ tx: tx.data!, categories: categories.data!, accounts: accounts.data!, today: now })
  const order = [...A.months].reverse() // oldest first, for charts
  const tone = { good: 'border-l-ink', bad: 'border-l-accent', plain: 'border-l-ink/30' }
  const name = new Map(categories.data!.map((c) => [c.id, c.name]))

  return (
    <div className="grid gap-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="note">Keuangan</p>
          <h1 className="text-5xl font-semibold tracking-tight">Analisis</h1>
        </div>
        <Link className="lift" href="/admin/finance">← Catat & rencana</Link>
      </header>

      <section aria-label="Temuan" className="grid gap-3">
        {A.notes.length ? A.notes.map((n) => (
          <p key={n.text} className={`border-l-4 bg-surface px-4 py-3 ${tone[n.tone]}`}>{n.text}</p>
        )) : <p className="bg-surface px-4 py-3">Belum cukup data. Analisis muncul setelah ada beberapa transaksi.</p>}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-xl font-semibold">Bulan ini vs 3 bulan lalu</h2>
          <p className="note">Pemasukan dan pengeluaran per bulan</p>
          <div className="mt-4">
            <Bars labels={order.map((m) => monthName(m.month))} series={[{ name: 'Pemasukan', values: order.map((m) => m.income) }, { name: 'Pengeluaran', values: order.map((m) => m.expense), accent: true }]} />
          </div>
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold">Adil untuk bulan yang belum selesai</h2>
          <p className="note">Pengeluaran sampai tanggal {+now.slice(8)} di tiap bulan</p>
          <div className="mt-4">
            <Bars labels={order.map((m) => monthName(m.month))} series={[{ name: `Sampai tgl ${+now.slice(8)}`, values: order.map((m) => m.toDay), accent: true }]} />
          </div>
        </div>
      </section>

      <section className="card overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left">
          <thead className="note"><tr><th className="py-2 font-normal" />{A.months.map((m) => <th key={m.month} className="text-right font-normal capitalize">{monthName(m.month, 'long')}</th>)}</tr></thead>
          <tbody className="tabular-nums">
            {([['Pemasukan', (m: MonthStat) => m.income], ['Pengeluaran', (m: MonthStat) => m.expense], ['Sisa', (m: MonthStat) => m.net], ['Disisihkan', (m: MonthStat) => (m.income ? `${Math.round((m.net / m.income) * 100)}%` : '–')]] as const).map(([label, f]) => (
              <tr key={label} className="border-t border-ink/15">
                <td className="py-2">{label}</td>
                {A.months.map((m, i) => {
                  const v = f(m)
                  return <td key={m.month} className={`text-right ${i === 0 ? 'font-semibold' : ''} ${typeof v === 'number' && v < 0 ? 'text-accent' : ''}`}>{typeof v === 'number' ? idr(v) : v}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-xl font-semibold">Per kategori</h2>
          <p className="note">Batang: bulan ini · garis: rata-rata bulan sebelumnya</p>
          <div className="mt-4"><Compare rows={A.byCategory.slice(0, 10)} /></div>
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold">Minggu ini</h2>
          <p className="note">{idr(A.weekNow)} sejauh ini · minggu lalu di hari yang sama {idr(A.weekBefore)}</p>
          <div className="mt-4">
            <Bars labels={A.week.map((d) => dayName(d.date))} series={[{ name: 'Minggu lalu', values: A.week.map((d) => d.before), ghost: true }, { name: 'Minggu ini', values: A.week.map((d) => (d.future ? 0 : d.now)), accent: true }]} height={150} />
          </div>
          {A.biggest.length > 0 && (
            <ul className="mt-4 grid gap-1 text-sm">
              <li className="note">Terbesar minggu ini</li>
              {A.biggest.map((t, i) => <li key={i} className="flex justify-between gap-3"><span className="truncate">{t.note || name.get(t.category_id)}</span><span className="tabular-nums">{idr(Number(t.amount))}</span></li>)}
            </ul>
          )}
        </div>
      </section>

      <section className="card">
        <h2 className="text-xl font-semibold">Keseluruhan</h2>
        <p className="note">Total saldo di akhir tiap bulan · rata-rata pemasukan {idr(A.avgIncome)}/bln, pengeluaran {idr(A.avgExpense)}/bln</p>
        <div className="mt-4"><Line labels={A.ends.map((e) => monthName(e.month))} values={A.ends.map((e) => e.balance)} /></div>
      </section>
    </div>
  )
}

// Reads the session on every request; no instant-navigation shell for the back office.
export const instant = false

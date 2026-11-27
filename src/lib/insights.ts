import type { Account, Category, Tx } from './money'

type Row = Tx & { note?: string }
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const ym = (d: string, back: number) => {
  const t = new Date(Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1 - back, 1))
  return t.toISOString().slice(0, 7)
}
const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10)
const pct = (now: number, before: number) => (before ? (now - before) / before : now ? Infinity : 0)

export type MonthStat = { month: string; income: number; expense: number; net: number; toDay: number; byCategory: Map<string, number> }

/**
 * Everything the analysis page shows, from raw rows: this month against the three before it (in full and up to the
 * same day of the month, so a half-finished month is compared fairly), spending by category, this week day by day
 * against last week, balance at each month end, and plain-language findings.
 */
export function analyse({ tx, categories, accounts, today }: { tx: Row[]; categories: (Category & { name: string })[]; accounts: Account[]; today: string }) {
  const kind = new Map(categories.map((c) => [c.id, c.kind]))
  const name = new Map(categories.map((c) => [c.id, c.name]))
  const day = +today.slice(8)
  const months: MonthStat[] = [0, 1, 2, 3].map((back) => ({ month: ym(today, back), income: 0, expense: 0, net: 0, toDay: 0, byCategory: new Map() }))
  const at = new Map(months.map((m) => [m.month, m]))

  for (const t of tx) {
    const m = at.get(t.date.slice(0, 7))
    if (!m) continue
    const amt = Number(t.amount)
    if (kind.get(t.category_id) === 'income') m.income += amt
    else {
      m.expense += amt
      if (+t.date.slice(8) <= day) m.toDay += amt
      m.byCategory.set(t.category_id, (m.byCategory.get(t.category_id) ?? 0) + amt)
    }
  }
  for (const m of months) m.net = m.income - m.expense
  const [cur, ...prev] = months
  const past = prev.filter((m) => m.income || m.expense) // months with any records
  const avg = (f: (m: MonthStat) => number) => (past.length ? sum(past.map(f)) / past.length : 0)

  // categories: this month against the average of the earlier months
  const catIds = new Set(months.flatMap((m) => [...m.byCategory.keys()]))
  const byCategory = [...catIds]
    .map((id) => ({ id, name: name.get(id) ?? '?', now: cur.byCategory.get(id) ?? 0, before: avg((m) => m.byCategory.get(id) ?? 0) }))
    .sort((a, b) => b.now + b.before - (a.now + a.before))

  // this week (Monday first) and last week, day by day
  const dow = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7
  const monday = addDays(today, -dow)
  const daily = new Map<string, number>()
  for (const t of tx) if (kind.get(t.category_id) !== 'income') daily.set(t.date, (daily.get(t.date) ?? 0) + Number(t.amount))
  const week = [0, 1, 2, 3, 4, 5, 6].map((i) => ({ date: addDays(monday, i), now: daily.get(addDays(monday, i)) ?? 0, before: daily.get(addDays(monday, i - 7)) ?? 0, future: addDays(monday, i) > today }))
  const weekNow = sum(week.filter((d) => !d.future).map((d) => d.now))
  const weekBefore = sum(week.filter((d) => !d.future).map((d) => d.before)) // same days last week
  const biggest = tx
    .filter((t) => kind.get(t.category_id) !== 'income' && t.date >= monday && t.date <= today)
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 3)

  // balance at the end of each of the last six months
  const opening = sum(accounts.map((a) => Number(a.opening_balance)))
  const ends = [5, 4, 3, 2, 1, 0].map((back) => {
    const m = ym(today, back)
    const bal = opening + sum(tx.filter((t) => t.date.slice(0, 7) <= m).map((t) => (kind.get(t.category_id) === 'income' ? 1 : -1) * Number(t.amount)))
    return { month: m, balance: bal }
  })

  // findings, most telling first
  const notes: { tone: 'good' | 'bad' | 'plain'; text: string }[] = []
  const avgToDay = avg((m) => m.toDay)
  if (past.length && avgToDay) {
    const d = pct(cur.toDay, avgToDay)
    notes.push({
      tone: d > 0.1 ? 'bad' : d < -0.1 ? 'good' : 'plain',
      text: `Sampai tanggal ${day}, pengeluaranmu ${Math.abs(Math.round(d * 100))}% ${d >= 0 ? 'lebih tinggi' : 'lebih rendah'} dari rata-rata ${past.length} bulan lalu di tanggal yang sama.`,
    })
  }
  const rate = (m: MonthStat) => (m.income ? m.net / m.income : null)
  const r0 = rate(cur), rPast = past.map(rate).filter((r): r is number => r !== null)
  if (r0 !== null) {
    const before = rPast.length ? ` (rata-rata sebelumnya ${Math.round((sum(rPast) / rPast.length) * 100)}%)` : ''
    notes.push({
      tone: r0 >= 0.2 ? 'good' : r0 < 0 ? 'bad' : 'plain',
      text: r0 < 0 ? `Bulan ini pengeluaranmu ${Math.round(-r0 * 100)}% lebih besar dari pemasukan${before}.` : `Bulan ini kamu menyisakan ${Math.round(r0 * 100)}% dari pemasukan${before}.`,
    })
  }
  const movers = byCategory.filter((c) => c.before > 0 && c.now > 0).map((c) => ({ ...c, d: pct(c.now, c.before) })).sort((a, b) => Math.abs(b.d) - Math.abs(a.d))
  for (const c of movers.slice(0, 2))
    if (Math.abs(c.d) >= 0.25) notes.push({ tone: c.d > 0 ? 'bad' : 'good', text: `${c.name} ${c.d > 0 ? 'naik' : 'turun'} ${Math.round(Math.abs(c.d) * 100)}% dibanding rata-rata bulan sebelumnya.` })
  const top = [...cur.byCategory.entries()].sort((a, b) => b[1] - a[1])[0]
  if (top && cur.expense) notes.push({ tone: 'plain', text: `Pengeluaran terbesar bulan ini: ${name.get(top[0])}, ${Math.round((top[1] / cur.expense) * 100)}% dari semua pengeluaran.` })
  if (weekBefore || weekNow) {
    const d = pct(weekNow, weekBefore)
    notes.push({ tone: d > 0.15 ? 'bad' : d < -0.15 ? 'good' : 'plain', text: weekBefore ? `Minggu ini ${Math.abs(Math.round(d * 100))}% ${d >= 0 ? 'lebih boros' : 'lebih hemat'} dari hari yang sama minggu lalu.` : 'Minggu lalu belum ada catatan pengeluaran untuk dibandingkan.' })
  }

  return { months, cur, past, byCategory, week, weekNow, weekBefore, biggest, ends, notes, avgExpense: avg((m) => m.expense), avgIncome: avg((m) => m.income) }
}

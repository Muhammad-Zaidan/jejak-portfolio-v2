import type { Account, Category, Tx } from './money'

export type Income = { amount: number | string; day: number; starts: string; ends: string | null }
export type Goal = { id: string; name: string; price: number | string; deadline: string | null }

const MONTH = 30.44 // average days per month, for spreading monthly figures over days
const date = (s: string) => new Date(`${s}T00:00:00Z`)
const iso = (d: Date) => d.toISOString().slice(0, 10)
export const daysBetween = (a: string, b: string) => Math.round((+date(b) - +date(a)) / 864e5)
const endOfMonth = (s: string, ahead = 0) => iso(new Date(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) + ahead, 0)))

/** Everything recurring income pays on days after `from`, up to and including `to`. A pay day past the month's end falls on its last day. */
export function incomeBetween(incomes: Income[], from: string, to: string) {
  let sum = 0
  for (const inc of incomes)
    for (let k = 0; ; k++) {
      const last = endOfMonth(from, k)
      const pay = `${last.slice(0, 8)}${String(Math.min(inc.day, +last.slice(8))).padStart(2, '0')}`
      if (pay > to) break
      if (pay > from && pay >= inc.starts && (!inc.ends || pay <= inc.ends)) sum += Number(inc.amount)
    }
  return sum
}

/** Average spending per month over the last three full months, counting only months that have any spending. */
export function averageSpend(expenses: { amount: number | string; date: string }[], today: string) {
  const months = [1, 2, 3].map((k) => endOfMonth(today, -k).slice(0, 7))
  const per = new Map(months.map((m) => [m, 0]))
  for (const e of expenses) {
    const m = e.date.slice(0, 7)
    if (per.has(m)) per.set(m, per.get(m)! + Number(e.amount))
  }
  const used = [...per.values()].filter((v) => v > 0)
  return used.length ? used.reduce((a, b) => a + b, 0) / used.length : 0
}

export type GoalPlan = Goal & {
  price: number
  fromSavings: number // covered by money already in hand
  monthly: number // to set aside each month from now on
  buy: string | null // earliest date it is affordable at the current pace; null if not within three years
  onTrack: boolean
}

/**
 * The money plan. Keeps an emergency reserve untouched, funds goals in order of deadline from free savings plus what
 * income leaves after usual spending, and says how much may be spent per day until `until` so every goal still lands.
 */
export function plan({ today, balance, spend, incomes, goals, until, reserveMonths = 3 }: {
  today: string
  balance: number
  spend: number
  incomes: Income[]
  goals: Goal[]
  until: string
  reserveMonths?: number
}) {
  const reserve = spend * reserveMonths
  const free = balance - reserve
  const cashAt = (d: string) => free + incomeBetween(incomes, today, d) - (spend * daysBetween(today, d)) / MONTH
  const ordered = [...goals].sort((a, b) => (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999'))

  let savings = Math.max(0, free)
  let needed = 0
  const planned: GoalPlan[] = ordered.map((g) => {
    const price = Number(g.price)
    needed += price
    const fromSavings = Math.min(savings, price)
    savings -= fromSavings
    let buy: string | null = cashAt(today) >= needed ? today : null
    for (let k = 0; !buy && k < 36; k++) if (cashAt(endOfMonth(today, k)) >= needed) buy = endOfMonth(today, k)
    const by = g.deadline ?? buy
    const months = by ? Math.max(1, daysBetween(today, by) / MONTH) : 36
    return { ...g, price, fromSavings, monthly: (price - fromSavings) / months, buy, onTrack: !!buy && (!g.deadline || buy <= g.deadline) }
  })

  const days = Math.max(1, daysBetween(today, until) + 1) // today counts
  const setAside = planned.reduce((a, g) => a + g.monthly, 0)
  const left = Math.max(0, free) - planned.reduce((a, g) => a + g.fromSavings, 0) + incomeBetween(incomes, today, until) - (setAside * days) / MONTH
  const spendable = Math.max(0, left) // never a negative allowance
  return {
    reserve, free, setAside, goals: planned, until, days, spendable, perDay: spendable / days,
    /** Extra money needed to spend `perDay` every day until `until` and still keep the reserve and goals. */
    need: (perDay: number) => Math.max(0, perDay * days - left),
  }
}

/** The day before the next pay day of any running income, or null when none is coming. */
export function beforeNextPay(incomes: Income[], today: string) {
  let next: string | null = null
  for (const inc of incomes)
    for (let k = 0; k < 13; k++) {
      const last = endOfMonth(today, k)
      const pay = `${last.slice(0, 8)}${String(Math.min(inc.day, +last.slice(8))).padStart(2, '0')}`
      if (inc.ends && pay > inc.ends) break
      if (pay > today && pay >= inc.starts) {
        if (!next || pay < next) next = pay
        break
      }
    }
  return next && iso(new Date(+date(next) - 864e5))
}

/**
 * The plan from raw finance rows. The allowance is worked out from the balance as it stood this morning (today's
 * spending added back), so `leftToday` is what may still be spent today.
 */
export function planFrom({ tx, categories, accounts, incomes, goals, today, until }: {
  tx: Tx[]
  categories: Category[]
  accounts: Account[]
  incomes: Income[]
  goals: Goal[]
  today: string
  until: string
}) {
  const isExpense = new Set(categories.filter((c) => c.kind === 'expense').map((c) => c.id))
  const expenses = tx.filter((t) => isExpense.has(t.category_id))
  const total = accounts.reduce((a, x) => a + Number(x.opening_balance), 0) + tx.reduce((a, t) => a + (isExpense.has(t.category_id) ? -1 : 1) * Number(t.amount), 0)
  const spentToday = expenses.filter((t) => t.date === today).reduce((a, t) => a + Number(t.amount), 0)
  const spend = averageSpend(expenses, today)
  const p = plan({ today, balance: total + spentToday, spend, incomes, goals, until })
  return { ...p, spend, spentToday, leftToday: p.perDay - spentToday }
}

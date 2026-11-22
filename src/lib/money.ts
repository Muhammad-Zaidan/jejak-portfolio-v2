export type Tx = { amount: number | string; date: string; account_id: string; category_id: string }
export type Category = { id: string; kind: 'income' | 'expense' }
export type Account = { id: string; opening_balance: number | string }

/** Account balances over all time, and income/expense per category for one month (YYYY-MM). */
export function summarize(tx: Tx[], categories: Category[], accounts: Account[], month: string) {
  const kind = new Map(categories.map((c) => [c.id, c.kind]))
  const balance = new Map(accounts.map((a) => [a.id, Number(a.opening_balance)]))
  const byCategory = new Map<string, number>()
  let income = 0
  let expense = 0
  for (const t of tx) {
    const amt = Number(t.amount)
    const sign = kind.get(t.category_id) === 'income' ? 1 : -1
    balance.set(t.account_id, (balance.get(t.account_id) ?? 0) + sign * amt)
    if (!t.date.startsWith(month)) continue
    byCategory.set(t.category_id, (byCategory.get(t.category_id) ?? 0) + amt)
    if (sign > 0) income += amt
    else expense += amt
  }
  return { balance, byCategory, income, expense }
}

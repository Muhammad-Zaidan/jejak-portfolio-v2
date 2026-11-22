import { test } from 'node:test'
import assert from 'node:assert/strict'
import { summarize } from '../src/lib/money.ts'

test('balances span all time, totals only the chosen month', () => {
  const cats = [{ id: 'gaji', kind: 'income' }, { id: 'makan', kind: 'expense' }]
  const accts = [{ id: 'bca', opening_balance: '1000000.00' }, { id: 'tunai', opening_balance: 0 }]
  const tx = [
    { amount: '5000000', date: '2026-09-25', account_id: 'bca', category_id: 'gaji' },
    { amount: '25000', date: '2026-10-01', account_id: 'tunai', category_id: 'makan' },
    { amount: '40000.50', date: '2026-10-18', account_id: 'bca', category_id: 'makan' },
  ]
  const s = summarize(tx, cats, accts, '2026-10')
  assert.equal(s.balance.get('bca'), 1000000 + 5000000 - 40000.5)
  assert.equal(s.balance.get('tunai'), -25000)
  assert.equal(s.income, 0)
  assert.equal(s.expense, 65000.5)
  assert.equal(s.byCategory.get('makan'), 65000.5)
  assert.equal(s.byCategory.get('gaji'), undefined)
})

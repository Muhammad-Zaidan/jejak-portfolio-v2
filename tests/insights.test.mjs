import { test } from 'node:test'
import assert from 'node:assert/strict'
import { analyse } from '../src/lib/insights.ts'

const categories = [{ id: 'gaji', kind: 'income', name: 'Gaji' }, { id: 'rokok', kind: 'expense', name: 'Rokok' }, { id: 'makan', kind: 'expense', name: 'Makan' }]
const accounts = [{ id: 'a', opening_balance: 1000000 }]
const tx = (date, category_id, amount) => ({ date, category_id, amount, account_id: 'a' })

test('months compare in full and up to the same day; weeks start on Monday', () => {
  const r = analyse({
    today: '2026-11-27', // a Friday
    categories, accounts,
    tx: [
      tx('2026-08-25', 'gaji', 3500000), tx('2026-08-10', 'makan', 400000),
      tx('2026-09-25', 'gaji', 3500000), tx('2026-09-10', 'makan', 500000), tx('2026-09-28', 'rokok', 300000),
      tx('2026-10-25', 'gaji', 3500000), tx('2026-10-10', 'makan', 600000),
      tx('2026-11-25', 'gaji', 3500000), tx('2026-11-10', 'makan', 900000), tx('2026-11-24', 'rokok', 50000), tx('2026-11-27', 'rokok', 30000),
      tx('2026-11-17', 'rokok', 40000), // last week, Tuesday
    ],
  })
  assert.deepEqual(r.months.map((m) => m.month), ['2026-11', '2026-10', '2026-09', '2026-08'])
  assert.equal(r.cur.expense, 1020000)
  assert.equal(r.months[2].toDay, 500000) // the 28 Sep purchase is after day 27
  assert.equal(r.week[0].date, '2026-11-23')
  assert.equal(r.weekNow, 80000)
  assert.equal(r.weekBefore, 40000)
  assert.ok(r.week[5].future && !r.week[4].future)
  assert.equal(r.ends.at(-1).balance, 1000000 + 4 * 3500000 - (400000 + 800000 + 600000 + 1020000))
  assert.ok(r.notes.some((n) => n.text.includes('Makan naik')), JSON.stringify(r.notes))
})

test('no history yet still gives a usable result', () => {
  const r = analyse({ today: '2026-11-27', categories, accounts, tx: [] })
  assert.equal(r.past.length, 0)
  assert.equal(r.cur.expense, 0)
})

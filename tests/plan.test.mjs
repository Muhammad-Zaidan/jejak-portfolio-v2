import { test } from 'node:test'
import assert from 'node:assert/strict'
import { averageSpend, incomeBetween, plan, planFrom } from '../src/lib/plan.ts'

const stipend = { amount: 3500000, day: 25, starts: '2026-01-01', ends: '2027-02-25' }

test('income counts pay days after the start, through the end date, and stops when it ends', () => {
  assert.equal(incomeBetween([stipend], '2026-11-27', '2026-12-31'), 3500000) // 25 Nov already passed
  assert.equal(incomeBetween([stipend], '2026-11-24', '2027-06-30'), 3500000 * 4) // Nov, Dec, Jan, Feb; none after Feb
  assert.equal(incomeBetween([{ ...stipend, day: 31, ends: null }], '2027-02-01', '2027-02-28'), 3500000) // falls on 28 Feb
})

test('average spending skips months with no records', () => {
  const ex = [{ amount: 2000000, date: '2026-10-03' }, { amount: 1000000, date: '2026-10-20' }, { amount: 2000000, date: '2026-09-10' }]
  assert.equal(averageSpend(ex, '2026-11-27'), 2500000) // Oct 3jt, Sep 2jt, Aug none
})

test('a goal lands when savings plus surplus cover it, and the daily allowance keeps it on track', () => {
  const p = plan({
    today: '2026-11-27',
    balance: 8000000,
    spend: 2000000,
    incomes: [stipend],
    goals: [{ id: 'p', name: '3D printer', price: 5000000, deadline: null }],
    until: '2026-12-31',
  })
  assert.equal(p.reserve, 6000000)
  assert.equal(p.free, 2000000)
  const g = p.goals[0]
  assert.equal(g.fromSavings, 2000000)
  assert.ok(g.buy && g.buy > '2026-11-27' && g.buy <= '2027-02-28', g.buy)
  assert.ok(g.onTrack)
  assert.ok(g.monthly > 0)
  // spending exactly the allowance every day leaves what the goal needs
  assert.ok(p.perDay > 0 && p.perDay < 3500000 / 30)
})

test('a deadline the money cannot meet is flagged', () => {
  const p = plan({
    today: '2026-11-27', balance: 1000000, spend: 3000000, incomes: [stipend],
    goals: [{ id: 'x', name: 'Laptop', price: 20000000, deadline: '2027-01-31' }], until: '2026-12-31',
  })
  assert.equal(p.goals[0].onTrack, false)
  assert.equal(p.perDay, 0)
})

test('spending today comes out of today, not out of every remaining day', () => {
  const base = {
    categories: [{ id: 'makan', kind: 'expense' }], accounts: [{ id: 'a', opening_balance: 3100000 }],
    incomes: [], goals: [], today: '2026-11-27', until: '2026-11-30',
  }
  const before = planFrom({ ...base, tx: [] })
  const after = planFrom({ ...base, tx: [{ amount: 60000, date: '2026-11-27', account_id: 'a', category_id: 'makan' }] })
  assert.equal(after.perDay, before.perDay) // the daily figure holds
  assert.equal(after.leftToday, before.perDay - 60000)
})

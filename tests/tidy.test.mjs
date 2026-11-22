import { test } from 'node:test'
import assert from 'node:assert/strict'
import { compareOrder } from '../src/lib/tidy.ts'

test('reports where the visitor started and how many steps match', () => {
  assert.deepEqual(compareOrder([0, 1, 2, 3, 4]), { first: 0, sameStart: true, matches: 5 })
  assert.deepEqual(compareOrder([4, 1, 2, 3, 0]), { first: 4, sameStart: false, matches: 3 })
  assert.deepEqual(compareOrder([1, 0, 3, 4, 2]), { first: 1, sameStart: false, matches: 0 })
})

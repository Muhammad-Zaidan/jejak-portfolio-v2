import { test } from 'node:test'
import assert from 'node:assert/strict'
import { splitMarks } from '../src/lib/marks.ts'

const accents = (t) => splitMarks(t).filter((w) => w.accent).map((w) => w.word)

test('marks single words, phrases and words followed by punctuation', () => {
  assert.deepEqual(accents('Teknologi yang baik itu *tenang*.'), ['tenang.'])
  assert.deepEqual(accents('ruang untuk hal yang *benar-benar penting*. Itu saja'), ['benar-benar', 'penting.'])
  assert.deepEqual(accents('*A* b *c d*'), ['A', 'c', 'd'])
  assert.deepEqual(accents('tanpa tanda sama sekali'), [])
})

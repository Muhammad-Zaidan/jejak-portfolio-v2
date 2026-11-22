import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mergeSite as merge } from '../src/lib/site.ts'
import { dict, site } from '../src/lib/i18n.ts'

const mergeSite = (data, lang) => merge(data, lang, dict[lang], site)

test('empty settings fall back to the built-in copy', () => {
  const s = mergeSite({}, 'id')
  assert.equal(s.home.line, dict.id.home.line)
  assert.deepEqual(s.home.steps, dict.id.home.steps)
  assert.equal(s.accent, '')
})

test('filled fields win, blank ones do not, per language', () => {
  const s = mergeSite({ name: 'Zaidan', email: ' ', id: { line: 'Baris baru', whyText: '' } }, 'id')
  assert.equal(s.name, 'Zaidan')
  assert.notEqual(s.email, ' ')
  assert.equal(s.home.line, 'Baris baru')
  assert.equal(s.home.whyText, dict.id.home.whyText)
  assert.equal(mergeSite({ id: { line: 'Baris baru' } }, 'en').home.line, dict.en.home.line)
})

test('steps need all five, accent must be a hex colour', () => {
  assert.deepEqual(mergeSite({ id: { steps: ['a', 'b', ''] } }, 'id').home.steps, dict.id.home.steps)
  assert.deepEqual(mergeSite({ id: { steps: ['a', 'b', 'c', 'd', 'e'] } }, 'id').home.steps, ['a', 'b', 'c', 'd', 'e'])
  assert.equal(mergeSite({ accent: 'red;}' }, 'id').accent, '')
  assert.equal(mergeSite({ accent: '#ff3b30' }, 'id').accent, '#ff3b30')
})

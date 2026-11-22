import { test } from 'node:test'
import assert from 'node:assert/strict'
import { embedUrl } from '../src/lib/embed.ts'

test('turns YouTube links into embeds and keeps other https pages', () => {
  assert.equal(embedUrl('https://www.youtube.com/watch?v=abc123&t=4'), 'https://www.youtube-nocookie.com/embed/abc123')
  assert.equal(embedUrl(' https://youtu.be/abc123 '), 'https://www.youtube-nocookie.com/embed/abc123')
  assert.equal(embedUrl('https://codepen.io/x/embed/y'), 'https://codepen.io/x/embed/y')
})

test('refuses anything that is not https', () => {
  assert.equal(embedUrl('http://example.com'), null)
  assert.equal(embedUrl('javascript:alert(1)'), null)
  assert.equal(embedUrl('bukan url'), null)
})

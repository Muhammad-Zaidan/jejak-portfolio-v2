import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { encrypt, decrypt } from '../src/lib/crypto.ts'

const k = randomBytes(32).toString('base64')

test('round-trips and never stores the plain token', () => {
  const packed = encrypt('1//refresh-token', k)
  assert.ok(!packed.includes('refresh'))
  assert.equal(decrypt(packed, k), '1//refresh-token')
})

test('rejects a tampered value and a wrong key', () => {
  const packed = Buffer.from(encrypt('secret', k), 'base64')
  packed[packed.length - 1] ^= 1
  assert.throws(() => decrypt(packed.toString('base64'), k))
  assert.throws(() => decrypt(encrypt('secret', k), randomBytes(32).toString('base64')))
  assert.throws(() => encrypt('x', 'short'), /32 bytes/)
})

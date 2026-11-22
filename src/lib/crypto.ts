// AES-256-GCM for OAuth refresh tokens at rest. Key: TOKEN_ENCRYPTION_KEY, 32 bytes base64.
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

function key(raw = process.env.TOKEN_ENCRYPTION_KEY) {
  const k = Buffer.from(raw ?? '', 'base64')
  if (k.length !== 32) throw new Error('TOKEN_ENCRYPTION_KEY must be 32 bytes, base64-encoded')
  return k
}

export function encrypt(plain: string, rawKey?: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(rawKey), iv)
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64')
}

export function decrypt(packed: string, rawKey?: string) {
  const buf = Buffer.from(packed, 'base64')
  const decipher = createDecipheriv('aes-256-gcm', key(rawKey), buf.subarray(0, 12))
  decipher.setAuthTag(buf.subarray(12, 28))
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8')
}

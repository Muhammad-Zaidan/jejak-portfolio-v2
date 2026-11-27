import type { NextRequest } from 'next/server'
import { encrypt } from '@/lib/crypto'
import { exchange } from '@/lib/google'
import { requireOwner } from '@/lib/owner'
import { originOf, redirectTo } from '@/lib/url'

/** Google sends the owner back here: check the state, keep the refresh token (encrypted), return to settings. */
export async function GET(req: NextRequest) {
  const db = await requireOwner()
  const q = req.nextUrl.searchParams
  const state = req.cookies.get('google_state')?.value
  if (q.get('error') || !q.get('code') || !state || q.get('state') !== state) return redirectTo(req, '/admin/devices?google=failed')
  try {
    const t = await exchange(originOf(req), q.get('code')!)
    if (!t.refresh) return redirectTo(req, '/admin/devices?google=failed')
    const { error } = await db.from('integrations').upsert({ provider: 'google', refresh_token_enc: encrypt(t.refresh), email: t.email, scopes: t.scopes, updated_at: new Date().toISOString() })
    if (error) throw new Error(error.message)
  } catch (e) {
    console.error('Google connect failed:', (e as Error).message)
    return redirectTo(req, '/admin/devices?google=failed')
  }
  const res = redirectTo(req, '/admin/devices?google=ok')
  res.cookies.delete({ name: 'google_state', path: '/admin/google' })
  return res
}

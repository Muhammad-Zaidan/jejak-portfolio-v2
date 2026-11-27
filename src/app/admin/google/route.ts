import { randomBytes } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { consentUrl, googleConfigured } from '@/lib/google'
import { requireOwner } from '@/lib/owner'
import { originOf, redirectTo } from '@/lib/url'

/** "Hubungkan Google": off to Google's consent screen, with a one-time state the callback checks. */
export async function GET(req: NextRequest) {
  await requireOwner()
  if (!googleConfigured()) return redirectTo(req, '/admin/devices?google=setup')
  const state = randomBytes(18).toString('base64url')
  const res = redirectTo(req, consentUrl(originOf(req), state))
  res.cookies.set('google_state', state, { httpOnly: true, secure: req.nextUrl.protocol === 'https:', sameSite: 'lax', path: '/admin/google', maxAge: 600 })
  return res
}

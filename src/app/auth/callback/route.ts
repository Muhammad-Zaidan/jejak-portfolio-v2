import type { NextRequest } from 'next/server'
import { sessionDb } from '@/lib/supabase'
import { redirectTo } from '@/lib/url'
import { recordSignIn } from '@/lib/device'

export async function GET(req: NextRequest) {
  const to = (path: string) => redirectTo(req, path)
  const q = req.nextUrl.searchParams
  const code = q.get('code')
  const tokenHash = q.get('token_hash')
  if (!code && !tokenHash) return to('/admin/login?e=failed')

  const db = await sessionDb()
  // ?code= comes from OAuth and the email link (PKCE: same browser only);
  // ?token_hash= from a one-time link generated server-side, which works in any browser.
  const { data, error } = code
    ? await db.auth.exchangeCodeForSession(code)
    : await db.auth.verifyOtp({ token_hash: tokenHash!, type: 'magiclink' })
  if (error || !data.session) return to('/admin/login?e=failed')

  const { data: owner } = await db.rpc('is_owner')
  if (!owner) {
    await db.auth.signOut()
    return to('/admin/login?e=forbidden')
  }

  await recordSignIn(db, code && data.session.provider_token ? 'google' : 'email')

  return to('/admin')
}

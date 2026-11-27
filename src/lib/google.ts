// One Google connection for the back office, separate from signing in: Calendar events and read-only Gmail
// (for bank notifications). The refresh token is stored encrypted; access tokens are fetched as needed.
import { decrypt } from './crypto'
import type { Db } from './owner'

export const SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.readonly',
]
export const googleConfigured = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
export const callbackUrl = (origin: string) => `${origin}/admin/google/callback`

export function consentUrl(origin: string, state: string) {
  const q = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? '',
    redirect_uri: callbackUrl(origin),
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline', // a refresh token, so it keeps working without signing in again
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`
}

/** Trades the one-time code for tokens; returns the refresh token, the granted scopes and the Google address. */
export async function exchange(origin: string, code: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      redirect_uri: callbackUrl(origin),
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) throw new Error(`Google ${res.status}: ${await res.text()}`)
  const t = (await res.json()) as { refresh_token?: string; scope: string; id_token?: string }
  const email = t.id_token ? (JSON.parse(Buffer.from(t.id_token.split('.')[1], 'base64url').toString()).email as string) : ''
  return { refresh: t.refresh_token, scopes: t.scope, email }
}

/** A fresh access token, or null when Google is not connected. */
export async function accessToken(db: Db): Promise<string | null> {
  const { data } = await db.from('integrations').select('refresh_token_enc').eq('provider', 'google').maybeSingle()
  if (!data) return null
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      refresh_token: decrypt(data.refresh_token_enc),
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`Google token refresh failed (${res.status}). Hubungkan ulang Google di Perangkat & koneksi.`)
  return (await res.json()).access_token
}

import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { configured, sessionDb } from './supabase'

export const TZ = process.env.TIMEZONE ?? 'Asia/Jakarta'

/** Every admin page and action starts here. RLS enforces the same rule in the database. */
export async function requireOwner() {
  // admin pages are per request (session, today's date): never prerendered
  await connection()
  if (!configured) redirect('/admin/login')
  const db = await sessionDb()
  // both at once: one round trip to the database instead of two in a row on every admin page
  const [{ data: claims }, { data: ok }] = await Promise.all([db.auth.getClaims(), db.rpc('is_owner')])
  if (!claims) redirect('/admin/login')
  if (!ok) redirect('/admin/login?e=forbidden')
  return db
}

export type Db = Awaited<ReturnType<typeof requireOwner>>

/** YYYY-MM-DD in the owner's time zone. */
export const today = (offsetDays = 0) =>
  new Date(Date.now() + offsetDays * 864e5).toLocaleDateString('en-CA', { timeZone: TZ })

export const idr = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

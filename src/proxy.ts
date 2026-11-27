import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { redirectTo } from '@/lib/url'

export async function proxy(req: NextRequest) {
  if (req.nextUrl.pathname === '/') {
    const lang = /^en\b/i.test(req.headers.get('accept-language') ?? '') ? 'en' : 'id'
    return redirectTo(req, `/${lang}`)
  }

  // /admin: keep the Supabase session cookie fresh (the official @supabase/ssr pattern).
  let res = NextResponse.next({ request: req })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return res
  const db = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value))
        res = NextResponse.next({ request: req })
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      },
    },
  })
  // refreshes an expiring session; verifies the token locally where the project signs with asymmetric keys
  await db.auth.getClaims()
  // a long-lived random id per browser, so sign-ins can be told apart by device
  if (!req.cookies.get('os_device'))
    res.cookies.set('os_device', crypto.randomUUID(), { httpOnly: true, secure: req.nextUrl.protocol === 'https:', sameSite: 'lax', path: '/', maxAge: 400 * 86400 })
  return res
}

export const config = { matcher: ['/', '/admin/:path*'] }

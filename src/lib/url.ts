import { NextResponse, type NextRequest } from 'next/server'

/**
 * Redirect to a path on the address the visitor actually used. req.url is the server's own address
 * (localhost behind a tunnel or proxy), so redirects built from it send phones to their own localhost.
 */
export function redirectTo(req: NextRequest, path: string) {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  const proto = req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(':', '')
  return NextResponse.redirect(new URL(path, host ? `${proto}://${host}` : req.url))
}

import { NextResponse, type NextRequest } from 'next/server'

/**
 * Redirect to a path on the address the visitor actually used. req.url is the server's own address
 * (localhost behind a tunnel or proxy), so redirects built from it send phones to their own localhost.
 */
export function redirectTo(req: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, originOf(req)))
}

/** The scheme and host the visitor used, e.g. https://muhammadzaidan.vercel.app */
export function originOf(req: NextRequest) {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  const proto = req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(':', '')
  return host ? `${proto}://${host}` : req.nextUrl.origin
}

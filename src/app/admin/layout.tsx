import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import '../globals.css'
import { fontVars } from '../fonts'
import { Logo } from '@/components/logo'
import { signOut } from './actions'
import { AdminNav } from './nav'
import { CommandPalette } from './command'

export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } }
// Private and per-request anyway: skip instant-navigation shells for the back office.
export const instant = false

export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <html lang="id" className={fontVars}>
      <body className="v2 admin min-h-dvh">
        <CommandPalette />
        <div className="mx-auto grid max-w-[1320px] gap-8 px-4 py-6 sm:px-8 lg:grid-cols-[14rem_1fr] lg:gap-14">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <Link href="/admin" className="inline-flex" aria-label="Admin">
              <Logo className="h-7" />
            </Link>
            <p className="note mt-1">Personal OS</p>
            <Suspense>
              <AdminNav />
            </Suspense>
            <div className="mt-6 flex gap-4 lg:grid lg:gap-2">
              <Link href="/" className="note link w-fit">Lihat situs ↗</Link>
              <form action={signOut}><button className="note link">Keluar</button></form>
            </div>
          </aside>
          <main className="min-w-0">
            {/* Admin pages read the session cookie, so they render per request. */}
            <Suspense fallback={<div className="skeleton" aria-label="Memuat" />}>{children}</Suspense>
          </main>
        </div>
      </body>
    </html>
  )
}

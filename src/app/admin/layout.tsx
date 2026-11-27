import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import '../globals.css'
import { fontVars } from '../fonts'
import { Logo } from '@/components/logo'
import { signOut } from './actions'
import { AdminNav } from './nav'
import { CommandPalette } from './command'
import { TabBar } from './tabbar'
import { ThemeScript, ThemeToggle } from '@/components/theme'

export const metadata: Metadata = {
  title: { default: 'Personal OS', template: '%s · Personal OS' },
  robots: { index: false, follow: false },
  // installable from the browser's "Add to Home Screen", opening straight into the dashboard like an app
  manifest: '/os/manifest.webmanifest',
  icons: { icon: '/os/favicon-32.png', apple: '/os/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Personal OS', statusBarStyle: 'black-translucent' },
}
export const viewport: Viewport = { themeColor: '#0c0b0b', viewportFit: 'cover', width: 'device-width', initialScale: 1 }
// Private and per-request anyway: skip instant-navigation shells for the back office.
export const instant = false

export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <html lang="id" className={fontVars} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="v2 admin min-h-dvh">
        <CommandPalette />
        <div className="mx-auto grid max-w-[1320px] gap-8 px-4 py-6 sm:px-8 lg:grid-cols-[14rem_1fr] lg:gap-14">
          <aside className="admin-aside lg:sticky lg:top-6 lg:self-start">
            <Link href="/admin" className="inline-flex" aria-label="Admin">
              <Logo className="h-7" />
            </Link>
            <p className="note mt-1">Personal OS</p>
            <Suspense>
              <AdminNav />
            </Suspense>
            <div className="mt-6 hidden gap-2 lg:grid">
              <ThemeToggle className="mb-2" />
              <Link href="/" className="note link w-fit">Lihat situs ↗</Link>
              <form action={signOut}><button className="note link">Keluar</button></form>
            </div>
          </aside>
          <main className="min-w-0">
            {/* Admin pages read the session cookie, so they render per request. */}
            <Suspense fallback={<div className="skeleton" aria-label="Memuat" />}>{children}</Suspense>
          </main>
        </div>
        <TabBar signOut={signOut} />
      </body>
    </html>
  )
}

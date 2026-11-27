'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { items } from './nav'

const icon = {
  today: <path d="M4 7h16M4 7v12h16V7M8 3v4m8-4v4M8 12h3" />,
  money: <path d="M3 7h18v12H3zM3 11h18M7 15h3" />,
  chart: <path d="M4 20V10m6 10V4m6 16v-7m4 7H2" />,
  write: <path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4" />,
  more: <path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth={3} />,
}
const tabs = [
  ['/admin', 'Hari ini', icon.today],
  ['/admin/finance', 'Uang', icon.money],
  ['/admin/finance/insights', 'Analisis', icon.chart],
  ['/admin/entries', 'Tulisan', icon.write],
] as const

/** Phone navigation like an iOS app: four tabs at the bottom, everything else in a sheet behind "Lainnya". */
export function TabBar({ signOut }: { signOut: () => Promise<void> }) {
  const path = usePathname()
  const sheet = useRef<HTMLDetailsElement>(null)
  // close the sheet once a page from it opens
  useEffect(() => {
    if (sheet.current) sheet.current.open = false
  }, [path])
  const on = (href: string) => (href === '/admin' || href === '/admin/finance' ? path === href : path.startsWith(href))
  const rest = items.filter(([href]) => !tabs.some(([t]) => t === href))
  return (
    <nav className="tabbar lg:hidden" aria-label="Navigasi">
      {tabs.map(([href, label, svg]) => (
        <Link key={href} href={href} aria-current={on(href) ? 'page' : undefined}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>{svg}</svg>
          {label}
        </Link>
      ))}
      <details ref={sheet} className="tabbar-more">
        <summary>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden>{icon.more}</svg>
          Lainnya
        </summary>
        <div className="sheet">
          {rest.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
          <Link href="/">Lihat situs ↗</Link>
          <form action={signOut}><button>Keluar</button></form>
        </div>
      </details>
    </nav>
  )
}

'use client'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

// Ordered by how often a day needs them; the command palette lists the same places.
export const items = [
  ['/admin', 'Hari ini'],
  ['/admin/entries', 'Tulisan'],
  ['/admin/entries?category=project', 'Proyek'],
  ['/admin/entries?kind=notes', 'Catatan'],
  ['/admin/comments', 'Komentar'],
  ['/admin/finance', 'Keuangan'],
  ['/admin/calendar', 'Kalender'],
  ['/admin/messages', 'Pesan'],
  ['/admin/site', 'Situs'],
] as const

export function AdminNav() {
  const path = usePathname()
  const q = useSearchParams()
  const notes = q.get('kind') === 'notes' || q.get('type') === 'idea'
  const project = q.get('category') === 'project'
  const active = (href: string) => {
    if (href === '/admin') return path === '/admin'
    if (href.endsWith('kind=notes')) return path.startsWith('/admin/entries') && notes
    if (href.endsWith('category=project')) return path.startsWith('/admin/entries') && project
    if (href === '/admin/entries') return path.startsWith(href) && !notes && !project
    return path.startsWith(href)
  }
  return (
    <nav aria-label="Admin" className="admin-nav">
      {items.map(([href, label]) => (
        <Link key={href} href={href} aria-current={active(href) ? 'page' : undefined}>{label}</Link>
      ))}
    </nav>
  )
}

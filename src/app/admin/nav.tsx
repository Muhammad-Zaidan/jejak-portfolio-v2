'use client'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

// Grouped by what the place is for: the day, the owner's own life, the public site, the account.
// The command palette and the phone's "Lainnya" sheet read the same list.
export const groups = [
  { label: '', items: [['/admin', 'Hari ini']] },
  { label: 'Pribadi', items: [['/admin/finance', 'Keuangan'], ['/admin/finance/insights', 'Analisis'], ['/admin/calendar', 'Kalender'], ['/admin/entries?kind=notes', 'Catatan']] },
  { label: 'Situs publik', items: [['/admin/entries', 'Tulisan'], ['/admin/entries?category=project', 'Proyek'], ['/admin/comments', 'Komentar'], ['/admin/messages', 'Pesan'], ['/admin/site', 'Tampilan situs']] },
  { label: 'Akun', items: [['/admin/devices', 'Perangkat & koneksi']] },
] as const satisfies readonly { label: string; items: readonly (readonly [string, string])[] }[]

export const items = groups.flatMap((g): (readonly [string, string])[] => [...g.items])

/** Which nav entry the current address belongs to. */
export function useActive() {
  const path = usePathname()
  const q = useSearchParams()
  const notes = q.get('kind') === 'notes' || q.get('type') === 'idea'
  const project = q.get('category') === 'project'
  return (href: string) => {
    if (href === '/admin') return path === '/admin'
    if (href.endsWith('kind=notes')) return path.startsWith('/admin/entries') && notes
    if (href.endsWith('category=project')) return path.startsWith('/admin/entries') && project
    if (href === '/admin/entries') return path.startsWith(href) && !notes && !project
    if (href === '/admin/finance') return path === href || path.startsWith('/admin/finance/review')
    return path.startsWith(href)
  }
}

export function AdminNav() {
  const active = useActive()
  return (
    <nav aria-label="Admin" className="admin-nav">
      {groups.map((g) => (
        <div key={g.label || 'home'} className="admin-nav-group">
          {g.label && <p className="admin-nav-label">{g.label}</p>}
          {g.items.map(([href, label]) => (
            <Link key={href} href={href} aria-current={active(href) ? 'page' : undefined}>{label}</Link>
          ))}
        </div>
      ))}
    </nav>
  )
}

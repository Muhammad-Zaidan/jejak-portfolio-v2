import Link from 'next/link'
import { requireOwner } from '@/lib/owner'

const categoryLabel = { project: 'Proyek', work: 'Dikerjakan', learn: 'Dipelajari', thought: 'Pemikiran' }
const typeLabel = { note: 'Catatan', idea: 'Ide', journal: 'Jurnal', article: 'Artikel' }
const statusLabel = { draft: 'Draft', private: 'Privat', unlisted: 'Unlisted', public: 'Publik' }

/**
 * Two lists from one table: "Tulisan" (articles, what the site shows) and, with ?kind=notes, "Catatan"
 * (private notes, ideas and journal entries), so drafts for the site never drown in day-to-day notes.
 */
export default async function Entries({ searchParams }: PageProps<'/admin/entries'>) {
  const db = await requireOwner()
  const sp = await searchParams
  const one = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '')
  const notes = one('kind') === 'notes' || one('type') === 'idea' // old "Ide" links land in Catatan
  const type = one('type'), visibility = one('visibility'), category = one('category'), q = one('q')

  let query = db
    .from('entries')
    .select('id, type, visibility, idea_stage, slug, category, featured, title_id, title_en, updated_at')
    .order('updated_at', { ascending: false })
    .limit(200)
  query = notes ? query.in('type', type ? [type] : ['note', 'idea', 'journal']) : query.eq('type', 'article')
  if (visibility) query = query.eq('visibility', visibility)
  if (category) query = query.eq('category', category)
  if (q) query = query.or(`title_id.ilike.%${q.replace(/[%,()]/g, '')}%,title_en.ilike.%${q.replace(/[%,()]/g, '')}%`)
  const { data, error } = await query
  if (error) throw new Error(error.message)

  const base = notes ? '/admin/entries?kind=notes' : '/admin/entries'
  const tabs: [string, string][] = notes
    ? [['', 'Semua'], ['&type=note', 'Catatan'], ['&type=idea', 'Ide'], ['&type=journal', 'Jurnal']]
    : [['', 'Semua'], ['?visibility=draft', 'Draft'], ['?visibility=public', 'Publik'], ...Object.entries(categoryLabel).map(([k, v]) => [`?category=${k}`, v] as [string, string])]
  const current = notes ? (type ? `&type=${type}` : '') : visibility ? `?visibility=${visibility}` : category ? `?category=${category}` : ''
  const title = notes ? 'Catatan' : category === 'project' ? 'Proyek' : 'Tulisan'
  const newHref = notes ? `/admin/entries/new?type=${type || 'note'}` : `/admin/entries/new?type=article${category ? `&category=${category}` : ''}`

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1>{title}</h1>
        <Link href={newHref} className="btn">+ {notes ? 'Catatan baru' : 'Tulisan baru'}</Link>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {tabs.map(([v, label]) => (
          <Link key={v} href={`${base}${v}`} className="chip" aria-current={current === v ? 'page' : undefined}>
            {label}
          </Link>
        ))}
        <form className="ml-auto">
          {notes && <input type="hidden" name="kind" value="notes" />}
          <input name="q" defaultValue={q} placeholder="Cari judul…" className="field w-56!" aria-label="Cari" />
        </form>
      </div>
      <ul className="mt-6 divide-y divide-[var(--line)] border-y border-[var(--line)]">
        {data.map((e) => (
          <li key={e.id}>
            <Link href={`/admin/entries/${e.id}`} className="row">
              <span className="min-w-0 truncate font-medium">
                {e.title_id || e.title_en || '(tanpa judul)'}
                {e.featured && <span className="ml-2 text-accent" title="Selected">★</span>}
              </span>
              <span className="note hidden sm:block">
                {notes ? `${typeLabel[e.type as keyof typeof typeLabel]}${e.idea_stage ? ` · ${e.idea_stage}` : ''}` : e.category ? categoryLabel[e.category as keyof typeof categoryLabel] : '—'}
              </span>
              <span className={`note ${e.visibility === 'public' ? 'text-[var(--orange)]' : ''}`}>{statusLabel[e.visibility as keyof typeof statusLabel]}</span>
              <span className="note hidden sm:block">{new Date(e.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
            </Link>
          </li>
        ))}
      </ul>
      {data.length === 0 && <p className="mt-6 text-muted">Belum ada.</p>}
    </div>
  )
}

// Reads the session and the URL on every request; no instant-navigation shell for the back office.
export const instant = false

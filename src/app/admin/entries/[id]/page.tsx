import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Entry } from '@/lib/content'
import { requireOwner } from '@/lib/owner'
import { deleteEntry, saveEntry } from '../../actions'
import { Field, Select } from '@/components/fields'
import { RichEditor } from '@/components/rich-editor'
import { CoverField } from '@/components/cover-field'
import { SaveShortcut } from '../../command'

const blank = {
  id: '', type: 'note', visibility: 'draft', idea_stage: null, slug: null, category: null, tags: [],
  title_id: '', title_en: '', excerpt_id: '', excerpt_en: '', body_id: '', body_en: '', published_at: null, cover_url: null, featured: false,
} as unknown as Entry

export default async function EditEntry({ params, searchParams }: PageProps<'/admin/entries/[id]'>) {
  const db = await requireOwner()
  const { id } = await params
  const { saved, type, category } = await searchParams
  // "+ Baru" from the Proyek list starts a project article
  const project = category === 'project'
  const kind = (project ? 'article' : typeof type === 'string' ? type : 'note') as Entry['type']
  let e = { ...blank, type: kind, visibility: kind === 'article' ? 'draft' : 'private', category: project ? 'project' : null } as Entry
  if (id !== 'new') {
    const { data } = await db.from('entries').select('*').eq('id', id).maybeSingle()
    if (!data) notFound()
    e = data
  }
  const shared = e.slug && (e.visibility === 'public' || e.visibility === 'unlisted')
  // notes, ideas and journal entries are private jottings: only the fields they need
  const note = e.type !== 'article'
  const back = note ? ['/admin/entries?kind=notes', 'Catatan'] : e.category === 'project' ? ['/admin/entries?category=project', 'Proyek'] : ['/admin/entries', 'Tulisan']

  return (
    <div>
      <p className="note"><Link className="lift" href={back[0]}>{back[1]}</Link> / {id === 'new' ? 'baru' : e.slug || 'edit'}</p>
      <form action={saveEntry} className="mt-4 grid gap-6">
        <input type="hidden" name="id" value={e.id} />
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Select name="type" label="Jenis" value={e.type} options={[['note', 'Catatan'], ['idea', 'Ide'], ['article', 'Artikel'], ['journal', 'Jurnal']]} />
          <Select name="visibility" label="Status" value={e.visibility} options={[['draft', 'Draft'], ['private', 'Privat'], ['unlisted', 'Unlisted (via tautan)'], ['public', 'Publik']]} />
          {e.type === 'idea' && <Select name="idea_stage" label="Tahap ide" value={e.idea_stage ?? ''} options={[['', '—'], ['new', 'Baru'], ['exploring', 'Dieksplorasi'], ['converted', 'Jadi proyek/tulisan'], ['archived', 'Diarsipkan']]} />}
          {!note && (
            <>
              <Select name="category" label="Kategori" value={e.category ?? ''} options={[['', '—'], ['project', 'Proyek'], ['work', 'Yang saya kerjakan'], ['learn', 'Yang saya pelajari'], ['thought', 'Pemikiran & opini']]} />
              <Field name="slug" label="Slug" value={e.slug ?? ''} placeholder="otomatis dari judul" />
              <Field name="published_at" label="Terbit" value={e.published_at?.slice(0, 10) ?? ''} type="date" />
            </>
          )}
        </div>
        <Field name="tags" label="Tag (pisahkan koma)" value={e.tags.join(', ')} />
        {!note && (
          <>
            <CoverField value={e.cover_url} />
            <label className="check">
              <input type="checkbox" name="featured" defaultChecked={e.featured} />
              Tampilkan sebagai proyek pilihan (Selected) di beranda dan halaman Proyek
            </label>
          </>
        )}
        <div className="grid gap-12">
          {(['id', 'en'] as const).map((l) => (
            <fieldset key={l} className="grid gap-3">
              <legend className="note mb-2">{l === 'id' ? 'Bahasa Indonesia' : 'English'}</legend>
              <Field name={`title_${l}`} label="Judul" value={e[`title_${l}`]} />
              {!note && <Field name={`excerpt_${l}`} label="Ringkasan" value={e[`excerpt_${l}`]} />}
              <div className="grid gap-1">
                <span className="note">Isi · tarik file ke sini atau pakai tombol Unggah</span>
                <RichEditor name={`body_${l}`} initial={e[`body_${l}`]} />
              </div>
            </fieldset>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button className="btn">Simpan</button>
          <SaveShortcut />
          <span className="note">Ctrl S</span>
          {saved && <span role="status" className="note">Tersimpan.</span>}
          {shared && <Link className="note lift" href={`/id/writing/${e.slug}`} target="_blank">Lihat di situs ↗</Link>}
        </div>
      </form>
      {e.id && (
        <form action={deleteEntry} className="mt-10">
          <input type="hidden" name="id" value={e.id} />
          <button className="btn-quiet btn">Hapus permanen</button>
        </form>
      )}
    </div>
  )
}

// Reads the session and the URL on every request; no instant-navigation shell for the back office.
export const instant = false

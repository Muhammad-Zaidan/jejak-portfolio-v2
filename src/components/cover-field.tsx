'use client'
import { useState } from 'react'
import { upload } from './rich-editor'

/** Thumbnail picker for a post: upload a picture or paste a link; empty means the generated default cover. */
export function CoverField({ value }: { value: string | null }) {
  const [url, setUrl] = useState(value ?? '')
  const [busy, setBusy] = useState('')
  async function pick(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) return setBusy('Pilih file gambar.')
    setBusy('Mengunggah…')
    try {
      setUrl(await upload(file))
      setBusy('')
    } catch (e) {
      setBusy(`Gagal: ${(e as Error).message}`)
    }
  }
  return (
    <div className="grid gap-2">
      <span className="note">Thumbnail</span>
      <div className="flex flex-wrap items-start gap-4">
        <div className="grid aspect-[4/3] w-48 place-items-center overflow-hidden bg-surface text-center text-sm text-muted">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="px-3">Kosong: pakai cover otomatis</span>
          )}
        </div>
        <div className="grid min-w-[16rem] flex-1 gap-2">
          <input name="cover_url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… atau unggah" className="field" aria-label="URL thumbnail" />
          <div className="flex flex-wrap items-center gap-3">
            <label className="btn-quiet btn cursor-pointer">
              Unggah gambar
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
            </label>
            {url && (
              <button type="button" className="btn-quiet btn" onClick={() => setUrl('')}>Hapus</button>
            )}
            {busy && <span role="status" className="note">{busy}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

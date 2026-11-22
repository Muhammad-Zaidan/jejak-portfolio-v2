'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { items } from './nav'

const actions = [
  ['/admin/entries/new?type=article', 'Tulisan baru'],
  ['/admin/entries/new?type=article&category=project', 'Proyek baru'],
  ['/admin/entries/new?type=note', 'Catatan baru'],
  ['/admin/finance', 'Catat pengeluaran'],
  ['/', 'Lihat situs'],
] as const

/** Ctrl/Cmd+K: go anywhere, start something, or search posts by title, without touching the mouse. */
export function CommandPalette() {
  const router = useRouter()
  const dialog = useRef<HTMLDialogElement>(null)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)

  const list = useMemo(() => {
    const all = [...actions, ...items.map(([h, l]) => [h, `Buka ${l}`] as const)]
    const hit = all.filter(([, l]) => l.toLowerCase().includes(q.toLowerCase()))
    return q.trim() ? [...hit, [`/admin/entries?q=${encodeURIComponent(q.trim())}`, `Cari “${q.trim()}” di tulisan`] as const] : hit
  }, [q])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setQ('')
        setSel(0)
        dialog.current?.showModal()
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  const go = (href: string) => {
    dialog.current?.close()
    router.push(href)
  }
  return (
    <dialog ref={dialog} className="palette" onClick={(e) => e.target === dialog.current && dialog.current?.close()}>
      <input
        autoFocus
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setSel(0)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') (e.preventDefault(), setSel((s) => Math.min(s + 1, list.length - 1)))
          if (e.key === 'ArrowUp') (e.preventDefault(), setSel((s) => Math.max(s - 1, 0)))
          if (e.key === 'Enter' && list[sel]) go(list[sel][0])
        }}
        placeholder="Ketik perintah atau judul tulisan…"
        aria-label="Perintah"
        className="palette-input"
      />
      <ul role="listbox" aria-label="Hasil">
        {list.map(([href, label], i) => (
          <li key={href + label} role="option" aria-selected={i === sel}>
            <button type="button" onMouseEnter={() => setSel(i)} onClick={() => go(href)}>{label}</button>
          </li>
        ))}
      </ul>
      <p className="note">↑ ↓ pilih · Enter buka · Esc tutup</p>
    </dialog>
  )
}

/** Ctrl/Cmd+S submits the form it sits in, so an editor saves the way every other editor does. */
export function SaveShortcut() {
  const here = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        here.current?.closest('form')?.requestSubmit()
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])
  return <span ref={here} hidden />
}

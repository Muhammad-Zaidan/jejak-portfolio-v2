'use client'
import { EditorContent, Node, mergeAttributes, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useId, useRef, useState } from 'react'
import { embedUrl } from '@/lib/embed'

const Video = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  addAttributes: () => ({ src: { default: null } }),
  parseHTML: () => [{ tag: 'video[src]' }],
  renderHTML: ({ HTMLAttributes }) => ['video', mergeAttributes(HTMLAttributes, { controls: '', playsinline: '', preload: 'metadata' })],
})

// Any https page that allows framing: YouTube, CodePen, Figma, Maps…
const Embed = Node.create({
  name: 'embed',
  group: 'block',
  atom: true,
  addAttributes: () => ({ src: { default: null } }),
  parseHTML: () => [{ tag: 'div.embed', getAttrs: (el) => ({ src: (el as HTMLElement).querySelector('iframe')?.getAttribute('src') }) }],
  renderHTML: ({ HTMLAttributes }) => [
    'div',
    { class: 'embed' },
    ['iframe', { src: HTMLAttributes.src, loading: 'lazy', allowfullscreen: 'true', allow: 'autoplay; encrypted-media; picture-in-picture', referrerpolicy: 'strict-origin-when-cross-origin' }],
  ],
})

const size = (b: number) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.ceil(b / 1e3)} KB`)

export async function upload(file: File) {
  const db = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-')
  const path = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID().slice(0, 8)}-${safe}`
  const { error } = await db.storage.from('media').upload(path, file, { contentType: file.type })
  if (error) throw new Error(error.message)
  return db.storage.from('media').getPublicUrl(path).data.publicUrl
}

/** Puts an uploaded file into the document in the form that fits its type. */
function insertFile(editor: Editor, file: File, url: string) {
  const chain = editor.chain().focus()
  if (file.type.startsWith('image/')) return chain.setImage({ src: url, alt: file.name }).run()
  if (file.type.startsWith('video/')) return chain.insertContent({ type: 'video', attrs: { src: url } }).run()
  return chain
    .insertContent({ type: 'paragraph', content: [{ type: 'text', text: `${file.name} (${size(file.size)})`, marks: [{ type: 'link', attrs: { href: url } }] }] })
    .run()
}

export function RichEditor({ name, initial }: { name: string; initial: string }) {
  const [html, setHtml] = useState(initial)
  const [busy, setBusy] = useState<string | null>(null)
  const fileId = useId()

  async function addFiles(editor: Editor, files: File[]) {
    for (const f of files) {
      setBusy(`Mengunggah ${f.name}…`)
      try {
        insertFile(editor, f, await upload(f))
      } catch (e) {
        alert(`Gagal mengunggah ${f.name}: ${(e as Error).message}`)
      }
    }
    setBusy(null)
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({ link: { openOnClick: false } }), Image, Video, Embed],
    content: initial,
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    editorProps: {
      attributes: { class: 'article min-h-[24rem] p-4 focus:outline-none', 'aria-label': 'Isi tulisan' },
      // Drop or paste files straight into the text.
      handleDrop: (_view, event) => {
        const files = [...(event.dataTransfer?.files ?? [])]
        if (!files.length || !editorRef.current) return false
        event.preventDefault()
        addFiles(editorRef.current, files)
        return true
      },
      handlePaste: (_view, event) => {
        const files = [...(event.clipboardData?.files ?? [])]
        if (!files.length || !editorRef.current) return false
        addFiles(editorRef.current, files)
        return true
      },
    },
  })
  const editorRef = useRef<Editor | null>(null)
  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  if (!editor) return <textarea name={name} defaultValue={initial} rows={20} className="field" />

  const is = (n: string, a?: object) => editor.isActive(n, a)
  const tools: [string, string, () => void, boolean?][] = [
    ['B', 'Tebal', () => editor.chain().focus().toggleBold().run(), is('bold')],
    ['I', 'Miring', () => editor.chain().focus().toggleItalic().run(), is('italic')],
    ['H2', 'Judul bagian', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), is('heading', { level: 2 })],
    ['H3', 'Subjudul', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), is('heading', { level: 3 })],
    ['• List', 'Daftar', () => editor.chain().focus().toggleBulletList().run(), is('bulletList')],
    ['1. List', 'Daftar bernomor', () => editor.chain().focus().toggleOrderedList().run(), is('orderedList')],
    ['“ ”', 'Kutipan', () => editor.chain().focus().toggleBlockquote().run(), is('blockquote')],
    ['</>', 'Blok kode', () => editor.chain().focus().toggleCodeBlock().run(), is('codeBlock')],
    ['Tautan', 'Tambah tautan', () => {
      const href = prompt('URL tautan', editor.getAttributes('link').href ?? 'https://')
      if (href === null) return
      const c = editor.chain().focus().extendMarkRange('link')
      ;(href ? c.setLink({ href }) : c.unsetLink()).run()
    }, is('link')],
    ['Embed', 'YouTube, CodePen, Figma, peta…', () => {
      const src = embedUrl(prompt('URL yang mau disematkan (https)') ?? '')
      if (src) editor.chain().focus().insertContent({ type: 'embed', attrs: { src } }).run()
    }],
    ['—', 'Garis pemisah', () => editor.chain().focus().setHorizontalRule().run()],
    ['↶', 'Urungkan', () => editor.chain().focus().undo().run()],
    ['↷', 'Ulangi', () => editor.chain().focus().redo().run()],
  ]

  return (
    <div className="border border-muted bg-paper">
      <div role="toolbar" aria-label="Format" className="sticky top-0 z-10 flex flex-wrap gap-1 border-b border-muted bg-surface p-1.5">
        {tools.map(([label, title, run, active]) => (
          <button
            key={title}
            type="button"
            title={title}
            aria-label={title}
            aria-pressed={active}
            onClick={run}
            className={`px-2 py-1 text-sm ${active ? 'bg-ink text-paper' : 'hover:bg-paper'}`}
          >
            {label}
          </button>
        ))}
        <input
          id={fileId}
          type="file"
          multiple
          className="peer sr-only"
          onChange={(e) => {
            addFiles(editor, [...(e.target.files ?? [])])
            e.target.value = ''
          }}
        />
        <label htmlFor={fileId} title="Foto, video, atau file apa pun" className="cursor-pointer px-2 py-1 text-sm hover:bg-paper peer-focus-visible:outline-2 peer-focus-visible:outline-accent">Unggah</label>
        {busy && <span role="status" className="note ml-auto self-center">{busy}</span>}
      </div>
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={html} />
    </div>
  )
}

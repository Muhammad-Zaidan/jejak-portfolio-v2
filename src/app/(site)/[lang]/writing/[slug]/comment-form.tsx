'use client'
import { useActionState, useState, useSyncExternalStore } from 'react'
import { addComment, type CommentState } from './actions'

export type CommentText = { name: string; email: string; body: string; send: string; reply: string; cancel: string; error: string; replyTo: string }

const KEY = 'jejak-commenter' // remembered on this device so a second comment is just the text
const read = () => {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}
const noSubscribe = () => () => {}

/** The comment box. With `parent` it starts folded behind a "Reply" link and folds again once sent. */
export function CommentForm({ entry, parent, parentName, t }: { entry: string; parent?: string; parentName?: string; t: CommentText }) {
  const [state, action, pending] = useActionState<CommentState, FormData>(addComment, {})
  // a reply box is open from the moment "Reply" is clicked until the next successful send
  const [openedAt, setOpenedAt] = useState<number | null>(parent ? null : 0)
  const sent = state.ok ?? 0
  const saved = useSyncExternalStore(noSubscribe, read, () => null)
  const who = saved ? (JSON.parse(saved) as { name?: string; email?: string }) : {}

  if (openedAt === null || (parent && sent > openedAt))
    return (
      <button type="button" onClick={() => setOpenedAt(sent)} className="link text-sm text-[var(--soft)]">
        {t.reply}
      </button>
    )

  const remember = (e: React.FormEvent<HTMLFormElement>) => {
    const f = new FormData(e.currentTarget)
    try {
      localStorage.setItem(KEY, JSON.stringify({ name: f.get('name'), email: f.get('email') }))
    } catch {}
  }
  return (
    // key: after a send React resets the form; re-keying refills name and email from what was remembered
    <form key={sent} action={action} onSubmit={remember} className={`comment-form ${parent ? 'is-reply' : ''}`}>
      <input type="hidden" name="entry" value={entry} />
      {parent && <input type="hidden" name="parent" value={parent} />}
      {parentName && <p className="text-sm text-[var(--soft)]">{t.replyTo} <span className="text-[var(--fg)]">{parentName}</span></p>}
      <textarea name="body" required maxLength={3000} rows={parent ? 2 : 3} placeholder={t.body} className="comment-input" autoFocus={!!parent} />
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input name="name" required maxLength={80} autoComplete="name" placeholder={t.name} aria-label={t.name} className="comment-input" defaultValue={who.name ?? ''} />
        <input name="email" type="email" required maxLength={200} autoComplete="email" placeholder={t.email} aria-label={t.email} className="comment-input" defaultValue={who.email ?? ''} />
        <div className="flex gap-2">
          {parent && <button type="button" onClick={() => setOpenedAt(null)} className="comment-btn is-quiet">{t.cancel}</button>}
          <button className="comment-btn" disabled={pending}>{pending ? '…' : t.send}</button>
        </div>
      </div>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {state.error && <p role="alert" className="text-sm text-[var(--orange)]">{t.error}</p>}
    </form>
  )
}

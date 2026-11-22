import Link from 'next/link'
import { requireOwner } from '@/lib/owner'
import { getSite } from '@/lib/content'
import { deleteComment, replyComment } from '../actions'

/** Every comment, newest first, each with its post, who wrote it, and a box to answer right there. */
export default async function Comments({ searchParams }: PageProps<'/admin/comments'>) {
  const db = await requireOwner()
  const { replied } = await searchParams
  const [{ data, error }, emails, site] = await Promise.all([
    db.from('comments').select('id, entry_id, parent_id, name, body, by_owner, created_at, entries(title_id, title_en, slug)').order('created_at', { ascending: false }).limit(200),
    db.from('comment_emails').select('comment_id, email'),
    getSite('id'),
  ])
  if (error) throw new Error(error.message)
  const emailOf = new Map((emails.data ?? []).map((e) => [e.comment_id, e.email]))
  const nameOf = new Map(data.map((c) => [c.id, c.name]))
  // a visitor comment is "answered" once the owner has replied under it
  const answered = new Set(data.filter((c) => c.by_owner && c.parent_id).map((c) => c.parent_id))

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1>Komentar</h1>
        {replied && <p role="status" className="note">Balasan terkirim.</p>}
      </div>
      <ul className="mt-6 grid gap-4">
        {data.map((c) => {
          const post = c.entries as unknown as { title_id: string; title_en: string; slug: string } | null
          const waiting = !c.by_owner && !answered.has(c.id)
          return (
            <li key={c.id} className={`card ${waiting ? 'is-waiting' : ''}`}>
              <p className="note flex flex-wrap gap-x-3">
                <span className="font-medium text-[var(--fg)]">{c.name}</span>
                {c.by_owner ? <span className="text-accent">Anda</span> : emailOf.get(c.id) && <a className="link" href={`mailto:${emailOf.get(c.id)}`}>{emailOf.get(c.id)}</a>}
                <span>{new Date(c.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                {waiting && <span className="text-accent">● belum dibalas</span>}
              </p>
              <p className="note mt-1">
                di <Link className="link" href={`/id/writing/${post?.slug}#komentar`} target="_blank">{post?.title_id || post?.title_en}</Link>
                {c.parent_id && <> · membalas {nameOf.get(c.parent_id) ?? 'komentar'}</>}
              </p>
              <p className="mt-3 whitespace-pre-line">{c.body}</p>
              <div className="mt-3 flex flex-wrap items-start gap-3">
                {!c.by_owner && (
                  <form action={replyComment} className="flex min-w-[16rem] flex-1 gap-2">
                    <input type="hidden" name="entry" value={c.entry_id} />
                    <input type="hidden" name="parent" value={c.id} />
                    <input type="hidden" name="name" value={site.name} />
                    <input name="body" required className="field" placeholder={`Balas ${c.name}…`} aria-label={`Balas ${c.name}`} />
                    <button className="btn">Balas</button>
                  </form>
                )}
                <form action={deleteComment}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="entry" value={c.entry_id} />
                  <button className="btn-quiet btn">Hapus</button>
                </form>
              </div>
            </li>
          )
        })}
      </ul>
      {data.length === 0 && <p className="mt-6 text-muted">Belum ada komentar.</p>}
    </div>
  )
}

// Reads the session and the URL on every request; no instant-navigation shell for the back office.
export const instant = false

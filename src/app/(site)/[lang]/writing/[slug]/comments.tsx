import { listComments, type Comment } from '@/lib/content'
import { dict, type Locale } from '@/lib/i18n'
import { CommentForm } from './comment-form'

const MAX_DEPTH = 3 // deeper replies stay at this indent so threads remain readable on a phone

/** A post's discussion: the box to start one, then threads with replies under each comment. */
export async function Comments({ entry, lang }: { entry: string; lang: Locale }) {
  const t = dict[lang].comments
  const all = await listComments(entry)
  const kids = Map.groupBy(all, (c) => c.parent_id ?? 'root')
  const when = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const thread = (c: Comment, depth: number): React.ReactNode => (
    <li key={c.id} className="comment">
      <div className={`comment-body ${c.by_owner ? 'is-owner' : ''}`}>
        <p className="flex flex-wrap items-baseline gap-x-3 text-sm">
          <span className="font-medium text-[var(--fg)]">{c.name}</span>
          {c.by_owner && <span className="rounded-full bg-[var(--orange)] px-2 py-0.5 text-xs text-white">{t.author}</span>}
          <span className="text-[var(--soft)]">{when(c.created_at)}</span>
        </p>
        <p className="mt-2 whitespace-pre-line">{c.body}</p>
        <div className="mt-2">
          <CommentForm entry={entry} parent={c.id} parentName={c.name} t={t} />
        </div>
      </div>
      {(kids.get(c.id)?.length ?? 0) > 0 && (
        <ul className={depth < MAX_DEPTH ? 'comment-replies' : 'grid gap-4'}>
          {kids.get(c.id)!.map((r) => thread(r, depth + 1))}
        </ul>
      )}
    </li>
  )

  return (
    <section id="komentar" aria-labelledby="komentar-t" className="mx-auto mt-24 max-w-[68ch]">
      <h2 id="komentar-t" className="display-font text-4xl">
        {t.title} <span className="text-[var(--orange)]">{all.length || ''}</span>
      </h2>
      <div className="mt-6">
        <CommentForm entry={entry} t={t} />
      </div>
      {all.length === 0 ? (
        <p className="mt-8 text-[var(--soft)]">{t.empty}</p>
      ) : (
        <ul className="mt-10 grid gap-6">{(kids.get('root') ?? []).map((c) => thread(c, 1))}</ul>
      )}
    </section>
  )
}

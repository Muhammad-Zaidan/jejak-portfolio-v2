import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense, ViewTransition } from 'react'
import { Cover } from '@/components/cover'
import { Comments } from './comments'
import { wrap } from '@/components/site'
import { getSharedEntry, getSite, hasLang, readMinutes, tr } from '@/lib/content'
import { dict, hasLocale, type Locale } from '@/lib/i18n'

type Props = PageProps<'/[lang]/writing/[slug]'>

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params
  const e = await getSharedEntry(slug)
  if (!e) return {}
  const l: Locale = hasLocale(lang) ? lang : 'id'
  return {
    title: tr(e, 'title', l),
    description: tr(e, 'excerpt', l),
    robots: e.visibility === 'unlisted' ? { index: false, follow: false } : undefined,
    alternates: { languages: { id: `/id/writing/${slug}`, en: `/en/writing/${slug}` } },
    openGraph: { type: 'article', publishedTime: e.published_at ?? undefined, authors: [(await getSite(l)).name] },
  }
}

async function ArticleView({ params }: Props) {
  const { lang: raw, slug } = await params
  const lang: Locale = hasLocale(raw) ? raw : 'id'
  const t = dict[lang]
  const [e, site] = await Promise.all([getSharedEntry(slug), getSite(lang)])
  if (!e) notFound()
  const body = tr(e, 'body', lang)
  const other = lang === 'id' ? 'en' : 'id'
  const date = e.published_at
    ? new Date(e.published_at).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  const cat = e.category ? t.categories[e.category] : ''
  return (
    <article className="pt-10 sm:pt-16">
      <header className={`${wrap} max-w-[1200px]`}>
        <p className="text-sm text-[var(--soft)]">
          <Link href={`/${lang}/${e.category === 'project' ? 'projects' : 'writing'}`} className="link">
            {e.category === 'project' ? t.nav.projects : t.nav.writing}
          </Link>
          {cat && e.category !== 'project' && <> / {cat}</>}
        </p>
        <h1 className="display-font mt-5 text-[clamp(2.8rem,7.5vw,7rem)] leading-[0.9]!">{tr(e, 'title', lang)}</h1>
        {tr(e, 'excerpt', lang) && (
          <p className="mt-8 max-w-[34ch] text-[clamp(1.25rem,2.2vw,1.75rem)] leading-snug text-[var(--soft)]">{tr(e, 'excerpt', lang)}</p>
        )}
        <p className="mt-8 flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--soft)]">
          <span>{site.name}</span>
          <span>{date}</span>
          <span className="text-[var(--orange)]">{readMinutes(body)} {t.readMin}</span>
        </p>
      </header>
      <div className={`${wrap} mt-12 max-w-[1200px]`}>
        <ViewTransition name={`cover-${e.slug}`} share="morph" default="none">
          <div className="aspect-[16/8] overflow-hidden bg-[var(--tint)]">
            <Cover e={e} label={cat} />
          </div>
        </ViewTransition>
      </div>
      <div className={`${wrap} max-w-[1200px]`}>
        {!hasLang(e, lang) && (
          <p className="mt-10 max-w-[66ch] bg-[var(--tint)] p-4">
            {t.onlyIn} {t.langName[other]}.
          </p>
        )}
        <div className="article mx-auto mt-14 max-w-[68ch]" dangerouslySetInnerHTML={{ __html: body }} />
        {e.tags.filter((x) => x !== 'contoh').length > 0 && (
          <p className="mx-auto mt-16 flex max-w-[68ch] flex-wrap gap-2">
            {e.tags.filter((x) => x !== 'contoh').map((x) => (
              <span key={x} className="rounded-full border border-[var(--line)] px-3 py-1 text-sm">#{x}</span>
            ))}
          </p>
        )}
        {/* comments load on their own, so the article never waits for them */}
        <Suspense fallback={null}>
          <Comments entry={e.id} lang={lang} />
        </Suspense>
      </div>
    </article>
  )
}

export default function ArticlePage(props: Props) {
  return (
    <Suspense fallback={<div className={`${wrap} pt-24 note`}>…</div>}>
      <ArticleView {...props} />
    </Suspense>
  )
}

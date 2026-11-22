import type { Metadata } from 'next'
import Link from 'next/link'
import { ViewTransition } from 'react'
import { Cover } from '@/components/cover'
import { PageHead, PostCard, dateFmt, wrap } from '@/components/site'
import { categories, listPublicEntries, readMinutes, tr } from '@/lib/content'
import { dict, hasLocale, type Locale } from '@/lib/i18n'

export async function generateMetadata({ params }: PageProps<'/[lang]/writing'>): Promise<Metadata> {
  const { lang } = await params
  return { title: dict[hasLocale(lang) ? lang : 'id'].nav.writing }
}

/** Newest post up top, then every post in a tidy grid; the category tabs stay in reach while you scroll. */
export default async function Writing({ params }: PageProps<'/[lang]/writing'>) {
  const { lang: raw } = await params
  const lang: Locale = hasLocale(raw) ? raw : 'id'
  const t = dict[lang]
  const entries = await listPublicEntries()
  const count = (c: string) => (c === 'all' ? entries.length : entries.filter((e) => e.category === c).length)
  const [lead] = entries
  return (
    <>
      <PageHead index={`${entries.length} ${t.nav.writing.toLowerCase()}`} title={t.nav.writing}>{t.writingIntro}</PageHead>
      {/* The filter is CSS (:has on the radios), so the page stays static and works without JS. */}
      <section className={`${wrap} writing mt-14 pb-28`}>
        <div className="tabs-bar">
          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">{lang === 'id' ? 'Kategori' : 'Category'}</legend>
            {(['all', ...categories] as const).filter((c) => count(c) > 0).map((c) => (
              <label key={c} className="cat-tab">
                <input type="radio" name="cat" value={c} defaultChecked={c === 'all'} className="sr-only" />
                {c === 'all' ? t.all : t.categories[c]}
                <span className="count">{count(c)}</span>
              </label>
            ))}
          </fieldset>
        </div>

        {entries.length === 0 && <p className="mt-10 text-[var(--soft)]">{t.empty}</p>}

        {lead && (
          <Link href={`/${lang}/writing/${lead.slug}`} className="lead group">
            <ViewTransition name={`cover-${lead.slug}`} share="morph" default="none">
              <span className="lead-art"><Cover e={lead} /></span>
            </ViewTransition>
            <span className="flex flex-col justify-end">
              <span className="text-sm text-[var(--soft)]">
                <span className="text-[var(--orange)]">{t.latest}</span>
                {lead.category && <> · {t.categories[lead.category]}</>}
              </span>
              <span className="display-font mt-4 text-[clamp(2.4rem,5vw,4.6rem)] leading-[0.92]! transition-colors group-hover:text-[var(--orange)]">
                {tr(lead, 'title', lang)}
              </span>
              {tr(lead, 'excerpt', lang) && <span className="mt-5 max-w-[42ch] text-lg text-[var(--soft)]">{tr(lead, 'excerpt', lang)}</span>}
              <span className="mt-8 flex gap-6 text-sm">
                <span className="text-[var(--soft)]">{dateFmt(lead.published_at, lang)}</span>
                <span className="text-[var(--orange)]">{readMinutes(tr(lead, 'body', lang))} {t.readMin}</span>
              </span>
            </span>
          </Link>
        )}

        {entries.length > 0 && (
          <ul className="post-grid mt-14">
            {entries.map((e, i) => (
              // the newest is already shown large; its card only appears once a category is picked
              <PostCard key={e.id} e={e} lang={lang} n={entries.length - i} className={i === 0 ? 'is-lead' : ''} />
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

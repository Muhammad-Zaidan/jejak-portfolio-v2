import type { Metadata } from 'next'
import Link from 'next/link'
import { ViewTransition } from 'react'
import { Cover } from '@/components/cover'
import { PageHead, PostCard, wrap } from '@/components/site'
import { listProjects, tr } from '@/lib/content'
import { dict, hasLocale, type Locale } from '@/lib/i18n'

export async function generateMetadata({ params }: PageProps<'/[lang]/projects'>): Promise<Metadata> {
  const { lang } = await params
  return { title: dict[hasLocale(lang) ? lang : 'id'].nav.projects }
}

/** Projects are writing in the 'project' category: the selected ones large, the rest as cards. */
export default async function Projects({ params }: PageProps<'/[lang]/projects'>) {
  const { lang: raw } = await params
  const lang: Locale = hasLocale(raw) ? raw : 'id'
  const t = dict[lang]
  const projects = await listProjects()
  const selected = projects.filter((p) => p.featured)
  const rest = projects.filter((p) => !p.featured)
  return (
    <>
      <PageHead index={`${projects.length} ${t.nav.projects.toLowerCase()}`} title={t.nav.projects}>{t.projectsIntro}</PageHead>
      <section className={`${wrap} mt-20 pb-24`}>
        {projects.length === 0 && <p className="text-[var(--soft)]">{t.empty}</p>}
        {selected.length > 0 && (
          <>
            <h2 className="mb-6 text-sm text-[var(--soft)]">{t.featured}</h2>
            <ol>
              {selected.map((p, i) => (
                <li key={p.id} className="feature">
                  <ViewTransition name={`cover-${p.slug}`} share="morph" default="none">
                    <Link href={`/${lang}/writing/${p.slug}`} className="feature-art" tabIndex={-1} aria-hidden>
                      <Cover e={p} label={t.categories.project} />
                    </Link>
                  </ViewTransition>
                  <div>
                    <p className="text-sm text-[var(--soft)]">
                      <span className="text-[var(--orange)] tabular-nums">{String(i + 1).padStart(2, '0')}</span> · {p.published_at?.slice(0, 4)}
                    </p>
                    <h3 className="display-font mt-3 text-[clamp(2.4rem,5vw,4.5rem)] leading-[0.92]!">
                      <Link href={`/${lang}/writing/${p.slug}`} className="transition-colors hover:text-[var(--orange)]">{tr(p, 'title', lang)}</Link>
                    </h3>
                    {tr(p, 'excerpt', lang) && <p className="mt-5 max-w-[40ch] text-lg text-[var(--soft)]">{tr(p, 'excerpt', lang)}</p>}
                    {p.tags.filter((x) => x !== 'contoh').length > 0 && (
                      <p className="mt-6 flex flex-wrap gap-2">
                        {p.tags.filter((x) => x !== 'contoh').map((x) => (
                          <span key={x} className="rounded-full border border-[var(--line)] px-3 py-1 text-sm">{x}</span>
                        ))}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}
        {rest.length > 0 && (
          <>
            <h2 className="mt-24 mb-6 text-sm text-[var(--soft)]">{t.allProjects}</h2>
            <ul className="post-grid">
              {rest.map((p, i) => (
                <PostCard key={p.id} e={p} lang={lang} n={selected.length + i + 1} />
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  )
}

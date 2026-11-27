import Link from 'next/link'
import { ViewTransition, type CSSProperties } from 'react'
import { Cover } from '@/components/cover'
import { Marquee } from '@/components/marquee'
import { Hologram } from '@/components/hologram'
import { Rail } from '@/components/rail'
import { Scope } from '@/components/scope'
import { Preloader } from '@/components/preloader'
import { Scrub } from '@/components/scrub'
import { Process } from '@/components/process'
import { categories, getSite, listProjects, listPublicEntries, readMinutes, tr, type Entry } from '@/lib/content'
import { dict, hasLocale, type Locale } from '@/lib/i18n'
import { configured } from '@/lib/supabase'
import { pad, socials } from '@/components/site'

type Row = { href: string; title: string; meta: string; entry?: Entry }

export default async function Home({ params }: PageProps<'/[lang]'>) {
  const { lang: raw } = await params
  const lang: Locale = hasLocale(raw) ? raw : 'id'
  const t = dict[lang]
  const [site, projects, entries] = await Promise.all([getSite(lang), listProjects(), listPublicEntries()])
  const h = site.home
  const shown = (id: string) => !site.hide.includes(id)
  // selected work: project articles the owner featured, or all of them if none is picked yet
  const picked = projects.some((p) => p.featured) ? projects.filter((p) => p.featured) : projects

  // Until Supabase is connected the page shows labelled samples, so the design can be judged full.
  const demo = !configured
  const projectRows: Row[] = demo
    ? [
        { href: '#', title: 'Monitor panel surya', meta: 'Hardware' },
        { href: '#', title: 'HMI lini produksi', meta: 'Industri' },
        { href: '#', title: 'Personal OS', meta: 'Software' },
        { href: '#', title: 'Pengendali motor STM32', meta: 'Embedded' },
        { href: '#', title: 'Dashboard energi gedung', meta: 'Software' },
        { href: '#', title: 'Sensor kualitas udara', meta: 'Hardware' },
      ]
    : picked.slice(0, 8).map((p) => ({
        href: `/${lang}/writing/${p.slug}`,
        title: tr(p, 'title', lang),
        meta: p.tags.find((x) => x !== 'contoh') ?? p.published_at?.slice(0, 4) ?? '',
        entry: p,
      }))
  const posts = entries.filter((e) => e.category !== 'project').slice(0, 8)
  const now = site.now || (demo ? 'Personal OS' : picked[0] ? tr(picked[0], 'title', lang) : null)

  return (
    <div className="home">
      <Preloader name={site.name} />

      <div id="home-main">
        {/* Hero: giant type drifting behind the figure; the pointer turns the 3D figure into a hologram. */}
        <section className="hero relative h-[100svh] min-h-[620px] overflow-hidden">
          <h1 className="sr-only">{site.name}. {h.line}</h1>
          <Hologram hint={h.hint} />
          <div className="hero-name">
            <Marquee rows={[`${site.name} — `]} />
          </div>
          <p className="hero-locate">
            <span className="max-w-[6.5em]">{h.located}</span>
            <span className="hero-globe" aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.6 3 2.6 15 0 18M12 3c-2.6 3-2.6 15 0 18" />
              </svg>
            </span>
          </p>
          <p className="hero-role">{h.roles}</p>
        </section>

        {shown('siapa') && (
        <Chapter id="siapa" label={h.who}>
          {/* who I am in one line, then how I work, drawn as signals on an oscilloscope */}
          <p className="rise display-font max-w-[24ch] text-[clamp(2rem,4vw,3.8rem)] leading-[1.08]!">{h.whoBody}</p>
          {now && (
            <p className="mt-8 flex items-center gap-3 text-[var(--soft)]">
              <span className="live-led" aria-hidden />
              {h.now}: <span className="text-[var(--fg)]">{now}</span>
            </p>
          )}
          <div className="rise mt-14">
            <Scope words={h.words as [string, string][]} />
          </div>
        </Chapter>
        )}

        {shown('apa') && (
        <Chapter id="apa" label={h.what}>
          <p className="rise max-w-[30ch] text-[clamp(1.35rem,2.4vw,2rem)] leading-[1.25]">{h.whatIntro}</p>
          {demo && <p className="mt-3 text-sm text-[var(--soft)]">{h.sample}</p>}
          {/* Project titles float at different speeds; the field disappears when there are no projects. */}
          {projectRows.length > 0 && (
            <ul className="mt-16 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3" aria-label={h.projects}>
              {projectRows.map((r, i) => (
                <li key={r.title} className="float peek" style={{ '--d': 30 + ((i * 47) % 110), marginTop: `${(i % 3) * 3}rem` } as CSSProperties}>
                  {r.entry && (
                    <span className="peek-img" aria-hidden>
                      <Cover e={r.entry} label={t.categories.project} />
                    </span>
                  )}
                  <Link href={r.href} className="group block">
                    <span className="text-sm text-[var(--soft)]">{r.meta}</span>
                    <span className="display-font mt-1 block text-[clamp(1.9rem,3.2vw,3rem)] leading-[1]! transition-colors group-hover:text-[var(--orange)]">
                      {r.title}
                      <span className="ml-2 inline-block opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">→</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Chapter>
        )}

        {/* Writing on show: the section pins while big cards glide past sideways. */}
        {shown('tulisan') && posts.length > 0 && (
          <Rail label={h.writing}>
            <div className="rail-intro">
              <h2 className="display-font text-[clamp(3.4rem,8vw,7.5rem)] leading-[0.88]!">{h.writing}</h2>
              <p className="mt-6 max-w-[26ch] text-[clamp(1.15rem,1.7vw,1.45rem)] leading-snug text-[var(--soft)]">{h.writingLine}</p>
              <p className="mt-8 flex flex-wrap gap-2">
                {categories.filter((c) => c !== 'project' && entries.some((e) => e.category === c)).map((c) => (
                  <span key={c} className="rounded-full border border-[var(--line)] px-3 py-1 text-sm">
                    {t.categories[c]} <span className="text-[var(--orange)]">{entries.filter((e) => e.category === c).length}</span>
                  </span>
                ))}
              </p>
            </div>
            {posts.map((e, i) => (
              <Link key={e.id} href={`/${lang}/writing/${e.slug}`} className="rail-card group" style={{ '--i': i } as CSSProperties}>
                <ViewTransition name={`cover-${e.slug}`} share="morph" default="none">
                  <span className="rail-thumb"><Cover e={e} /></span>
                </ViewTransition>
                <span className="mt-4 flex justify-between gap-4 text-sm text-[var(--soft)]">
                  <span>{e.category ? t.categories[e.category] : ''}</span>
                  <span className="text-[var(--orange)]">{readMinutes(tr(e, 'body', lang))} {t.readMin}</span>
                </span>
                <span className="display-font mt-2 block text-[clamp(1.7rem,2.4vw,2.4rem)] leading-[1]! transition-colors group-hover:text-[var(--orange)]">{tr(e, 'title', lang)}</span>
                {tr(e, 'excerpt', lang) && <span className="mt-3 line-clamp-2 text-[var(--soft)]">{tr(e, 'excerpt', lang)}</span>}
              </Link>
            ))}
            <Link href={`/${lang}/writing`} className="rail-end group">
              <span className="rail-end-circle">→</span>
              <span className="display-font mt-6 text-3xl transition-colors group-hover:text-[var(--orange)]">{h.allWriting}</span>
            </Link>
          </Rail>
        )}

        {/* How I work, acted out by the page as the visitor scrolls. */}
        {shown('bagaimana') && (
        <Chapter id="bagaimana" label={h.how}>
          <p className="max-w-[34ch] text-[clamp(1.35rem,2.4vw,2rem)] leading-[1.25]">{h.howIntro}</p>
          <Process steps={h.steps} />
        </Chapter>
        )}

        {shown('kenapa') && (
        <Chapter id="kenapa" label={h.why}>
          <Scrub
            text={`${h.whyText} ${h.whyAccent}`}
            className="display-font max-w-[22ch] text-[clamp(2.2rem,5.4vw,5rem)] leading-[1.02]!"
          />
        </Chapter>
        )}

        {shown('bicara') && (
        <section id="bicara" className={`${pad} talk py-28 sm:py-40`}>
          <p className="text-[var(--soft)]">{h.talkLine}</p>
          <a href={`mailto:${site.email}`} className="display-font group mt-4 block text-[clamp(3.4rem,12vw,12rem)]">
            {h.talk}
            <span className="inline-block text-[var(--orange)] transition-transform duration-300 group-hover:translate-x-3">→</span>
          </a>
          <div className="mt-10 flex flex-wrap gap-x-10 gap-y-3 text-lg">
            <a className="link" href={`mailto:${site.email}`}>{site.email}</a>
            {socials(site).map(([label, href]) => (
              <a key={label} className="link" href={href} target="_blank" rel="noopener noreferrer">{label}</a>
            ))}
            <Link className="link" href={`/${lang}/contact`}>{h.talkForm}</Link>
          </div>
        </section>
        )}
      </div>
    </div>
  )
}

/** One chapter of the story: its name stays pinned on the left with a bar that fills as you read. */
function Chapter({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className={`chapter ${pad} grid gap-8 py-24 sm:py-36 lg:grid-cols-[16rem_1fr]`}>
      <div className="lg:sticky lg:top-10 lg:self-start">
        <h2 id={`${id}-t`} className="display-font text-4xl sm:text-5xl">{label}</h2>
        <div className="mt-6 hidden h-40 w-[3px] bg-[var(--line)] lg:block" aria-hidden>
          <div className="chapter-bar h-full w-full bg-[var(--orange)]" />
        </div>
      </div>
      <div>{children}</div>
    </section>
  )
}

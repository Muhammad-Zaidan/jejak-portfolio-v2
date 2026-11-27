import Link from 'next/link'
import { Suspense, ViewTransition } from 'react'
import { dict, type Locale } from '@/lib/i18n'
import type { Site } from '@/lib/site'
import { readMinutes, tr, type Entry } from '@/lib/content'
import { Cover } from './cover'
import { LangSwitch } from './lang-switch'
import { Logo, LogoMark } from './logo'

export const pad = 'px-5 sm:px-10'
export const wrap = `mx-auto w-full max-w-[1440px] ${pad}`

/** Shared header. On the home page it floats over the hero (see `.home` in globals.css). */
export function Header({ lang, name }: { lang: Locale; name: string }) {
  const t = dict[lang]
  const links = [['projects', t.nav.projects], ['writing', t.nav.writing], ['about', t.nav.about], ['contact', t.nav.contact]] as const
  return (
    <header className={`site-header ${pad} z-30 flex items-center justify-between gap-6 py-6`}>
      <Link href={`/${lang}`} className="flex items-center">
        <Logo className="h-7 sm:h-8" />
        <span className="sr-only">{name}</span>
      </Link>
      <nav aria-label="Utama" className="flex items-center gap-5 sm:gap-8 text-[0.95rem]">
        {links.map(([href, label]) => (
          <Link key={href} className="link hidden sm:inline" href={`/${lang}/${href}`}>{label}</Link>
        ))}
        <Suspense fallback={<span>{lang.toUpperCase()}</span>}>
          <LangSwitch lang={lang} />
        </Suspense>
        {/* phones: the same links in a menu that opens without JavaScript */}
        <details className="mobile-menu sm:hidden">
          <summary>Menu</summary>
          <div className="mobile-menu-panel">
            {links.map(([href, label]) => (
              <Link key={href} href={`/${lang}/${href}`} className="display-font text-4xl">{label}</Link>
            ))}
          </div>
        </details>
      </nav>
    </header>
  )
}

/** Profile links that are filled in, in display order. */
export const socials = (site: Site) =>
  ([['LinkedIn', site.linkedin], ['WhatsApp', site.whatsapp], ['Instagram', site.instagram], ['GitHub', site.github]] as const).filter(([, href]) => href)

export function Footer({ lang, site }: { lang: Locale; site: Site }) {
  return (
    <footer className={`${pad} flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] py-8 text-sm text-[var(--soft)]`}>
      <span className="flex items-center gap-3">
        <LogoMark className="size-6" />
        {site.name} · {site.footer}
      </span>
      <span className="flex flex-wrap gap-x-6 gap-y-2">
        <a className="link" href={`mailto:${site.email}`}>{site.email}</a>
        {socials(site).map(([label, href]) => (
          <a key={label} className="link" href={href} target="_blank" rel="noopener noreferrer">{label}</a>
        ))}
        <a className="link" href={`/${lang}/rss.xml`}>RSS</a>
        <Link className="link" href={`/${lang}/privacy`}>{lang === 'id' ? 'Privasi' : 'Privacy'}</Link>
      </span>
    </footer>
  )
}

/** A page's opening: a small index line, then the title as large as the page allows. */
export function PageHead({ index, title, children }: { index: string; title: string; children?: React.ReactNode }) {
  return (
    <div className={`${wrap} page-head pt-10 sm:pt-16`}>
      <p className="text-sm text-[var(--soft)]">{index}</p>
      <h1 className="display-font mt-3 text-[clamp(3.6rem,13vw,12rem)] leading-[0.86]!">{title}</h1>
      {children && <p className="mt-8 max-w-[34ch] text-[clamp(1.2rem,2vw,1.6rem)] leading-snug">{children}</p>}
    </div>
  )
}

export const dateFmt = (iso: string | null, lang: Locale, month: 'short' | 'long' = 'short') =>
  iso ? new Date(iso).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month, year: 'numeric' }) : ''

/** A post as a card: thumbnail (photo or generated), category, title, then date and length. */
export function PostCard({ e, lang, n, className = '' }: { e: Entry; lang: Locale; n?: number; className?: string }) {
  const t = dict[lang]
  const cat = e.category ? t.categories[e.category] : ''
  return (
    <li data-cat={e.category ?? 'none'} className={`post ${className}`}>
      <Link href={`/${lang}/writing/${e.slug}`} className="post-card group">
        {/* the cover flies into the article's hero on navigation; the card already names the category, so no label */}
        <ViewTransition name={`cover-${e.slug}`} share="morph" default="none">
          <span className="post-thumb">
            <Cover e={e} />
          </span>
        </ViewTransition>
        <span className="flex items-baseline justify-between gap-4 text-sm text-[var(--soft)]">
          <span>{cat}</span>
          {n !== undefined && <span className="tabular-nums">{String(n).padStart(2, '0')}</span>}
        </span>
        <span className="display-font text-[clamp(1.5rem,2.2vw,2rem)] leading-[1.02]! transition-colors group-hover:text-[var(--orange)]">
          {tr(e, 'title', lang)}
        </span>
        {tr(e, 'excerpt', lang) && <span className="line-clamp-2 text-[var(--soft)]">{tr(e, 'excerpt', lang)}</span>}
        <span className="mt-auto flex justify-between gap-4 border-t border-[var(--line)] pt-3 text-sm">
          <span className="text-[var(--soft)]">{dateFmt(e.published_at, lang)}</span>
          <span className="text-[var(--orange)]">{readMinutes(tr(e, 'body', lang))} {t.readMin}</span>
        </span>
      </Link>
    </li>
  )
}

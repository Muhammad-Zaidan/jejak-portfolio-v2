import type { Metadata } from 'next'
import { ViewTransition, type CSSProperties } from 'react'
import { notFound } from 'next/navigation'
import '../../globals.css'
import { fontVars } from '../../fonts'
import { Footer, Header } from '@/components/site'
import { SmoothScroll } from '@/components/smooth-scroll'
import { getSite } from '@/lib/content'
import { dict, hasLocale, locales, site as env } from '@/lib/i18n'
import { ThemeScript } from '@/components/theme'

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

export async function generateMetadata({ params }: LayoutProps<'/[lang]'>): Promise<Metadata> {
  const { lang } = await params
  const t = dict[hasLocale(lang) ? lang : 'id']
  const site = await getSite(hasLocale(lang) ? lang : 'id')
  return {
    metadataBase: new URL(env.url),
    title: { default: `${site.name} · ${t.role}`, template: `%s · ${site.name}` },
    description: t.intro,
    alternates: { languages: { id: '/id', en: '/en' }, types: { 'application/rss+xml': `/${lang}/rss.xml` } },
  }
}

export default async function SiteLayout({ children, params }: LayoutProps<'/[lang]'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const site = await getSite(lang)
  return (
    <html lang={lang} className={fontVars} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="v2 min-h-dvh overflow-x-clip" style={site.accent ? ({ '--orange': site.accent } as CSSProperties) : undefined}>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-3 focus:bg-[var(--bg)]">
          {lang === 'id' ? 'Lompat ke isi' : 'Skip to content'}
        </a>
        <Header lang={lang} name={site.name} />
        <SmoothScroll />
        {/* each page fades and rises in on navigation; the header and footer stay put */}
        <ViewTransition default="page">
          <main id="main">{children}</main>
        </ViewTransition>
        <Footer lang={lang} site={site} />
      </body>
    </html>
  )
}

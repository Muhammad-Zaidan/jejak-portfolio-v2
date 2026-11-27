import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHead, socials, wrap } from '@/components/site'
import { getSite } from '@/lib/content'
import { dict, hasLocale, type Locale } from '@/lib/i18n'

export async function generateMetadata({ params }: PageProps<'/[lang]/about'>): Promise<Metadata> {
  const { lang } = await params
  return { title: dict[hasLocale(lang) ? lang : 'id'].nav.about }
}

export default async function About({ params }: PageProps<'/[lang]/about'>) {
  const { lang: raw } = await params
  const lang: Locale = hasLocale(raw) ? raw : 'id'
  const t = dict[lang]
  const site = await getSite(lang)
  const links = socials(site)
  return (
    <>
      <PageHead index={t.nav.about} title={t.aboutTitle} />
      <section className={`${wrap} mt-20 grid gap-12 lg:grid-cols-[1fr_20rem]`}>
        {/* written by the owner in the admin editor */}
        <div className="article" dangerouslySetInnerHTML={{ __html: site.about }} />
        <table className="spec self-start">
          <tbody>
            <tr><th scope="row">Email</th><td><a className="lift" href={`mailto:${site.email}`}>{site.email}</a></td></tr>
            {links.map(([label, url]) => (
              <tr key={label}><th scope="row">{label}</th><td><a className="lift" href={url}>{url.replace(/^https?:\/\/(www\.)?/, '')}</a></td></tr>
            ))}
            <tr><th scope="row">{t.nav.contact}</th><td><Link className="lift" href={`/${lang}/contact`}>{t.contactTitle} →</Link></td></tr>
          </tbody>
        </table>
      </section>
    </>
  )
}

import type { Metadata } from 'next'
import { PageHead, wrap } from '@/components/site'
import { getSite } from '@/lib/content'
import { dict, hasLocale, type Locale } from '@/lib/i18n'
import { ContactForm } from './form'

export async function generateMetadata({ params }: PageProps<'/[lang]/contact'>): Promise<Metadata> {
  const { lang } = await params
  return { title: dict[hasLocale(lang) ? lang : 'id'].nav.contact }
}

export default async function Contact({ params }: PageProps<'/[lang]/contact'>) {
  const { lang: raw } = await params
  const lang: Locale = hasLocale(raw) ? raw : 'id'
  const t = dict[lang]
  const site = await getSite(lang)
  return (
    <>
      <PageHead index={t.nav.contact} title={t.contactTitle}>{t.contactIntro}</PageHead>
      <section className={`${wrap} mt-20 grid gap-12 lg:grid-cols-[1fr_20rem]`}>
        <ContactForm t={t.form} />
        <p className="note">
          {lang === 'id' ? 'Atau langsung ke' : 'Or straight to'}{' '}
          <a className="lift text-ink" href={`mailto:${site.email}`}>{site.email}</a>
        </p>
      </section>
    </>
  )
}

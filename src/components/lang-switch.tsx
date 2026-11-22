'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function LangSwitch({ lang }: { lang: 'id' | 'en' }) {
  const other = lang === 'id' ? 'en' : 'id'
  const path = usePathname().replace(/^\/(id|en)/, `/${other}`)
  return (
    <Link href={path} hrefLang={other} className="note lift" aria-label={other === 'en' ? 'English' : 'Bahasa Indonesia'}>
      {lang.toUpperCase()} / <span className="text-ink">{other.toUpperCase()}</span>
    </Link>
  )
}

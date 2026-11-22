import type { MetadataRoute } from 'next'
import { listPublicEntries } from '@/lib/content'
import { locales, site } from '@/lib/i18n'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await listPublicEntries()
  const paths = ['', '/projects', '/writing', '/about', '/contact', ...entries.map((e) => `/writing/${e.slug}`)]
  return paths.flatMap((p) => locales.map((l) => ({ url: `${site.url}/${l}${p}` })))
}

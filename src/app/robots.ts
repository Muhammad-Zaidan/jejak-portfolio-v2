import type { MetadataRoute } from 'next'
import { site } from '@/lib/i18n'

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/auth'] }, sitemap: `${site.url}/sitemap.xml` }
}

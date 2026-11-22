import { listPublicEntries, tr } from '@/lib/content'
import { hasLocale, site } from '@/lib/i18n'

const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`)

export async function GET(_: Request, { params }: RouteContext<'/[lang]/rss.xml'>) {
  const { lang: raw } = await params
  const lang = hasLocale(raw) ? raw : 'id'
  const entries = (await listPublicEntries()).filter((e) => e[`title_${lang}`])
  const items = entries
    .map((e) => {
      const url = `${site.url}/${lang}/writing/${e.slug}`
      return `<item><title>${esc(tr(e, 'title', lang))}</title><link>${url}</link><guid>${url}</guid>${
        e.published_at ? `<pubDate>${new Date(e.published_at).toUTCString()}</pubDate>` : ''
      }<description>${esc(tr(e, 'excerpt', lang))}</description></item>`
    })
    .join('')
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(site.name)}</title><link>${site.url}/${lang}</link><description>${esc(site.name)}</description><language>${lang}</language>${items}</channel></rss>`
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } })
}

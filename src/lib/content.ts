// Public content reads. Cached for everyone; admin writes call updateTag('content').
import { cacheLife, cacheTag } from 'next/cache'
import { configured, publicDb } from './supabase'
import { dict, site, type Locale } from './i18n'
import { mergeSite, type SiteData } from './site'

export type Entry = {
  id: string
  type: 'note' | 'idea' | 'article' | 'journal'
  visibility: 'draft' | 'private' | 'unlisted' | 'public'
  idea_stage: string | null
  slug: string | null
  category: Category | null
  tags: string[]
  title_id: string
  title_en: string
  excerpt_id: string
  excerpt_en: string
  body_id: string
  body_en: string
  published_at: string | null
  updated_at: string
  cover_url: string | null
  /** a project article picked for the home page's selected work */
  featured: boolean
}

export const categories = ['project', 'work', 'learn', 'thought'] as const
export type Category = (typeof categories)[number]

type Field = 'title' | 'excerpt' | 'body'
// The requested language, falling back to the other one.
export function tr(row: object, field: Field, lang: Locale): string {
  const r = row as Record<string, string>
  return r[`${field}_${lang}`] || r[`${field}_${lang === 'id' ? 'en' : 'id'}`] || ''
}

export const hasLang = (row: object, lang: Locale) => Boolean((row as Record<string, string>)[`title_${lang}`])

// Bodies are HTML written by the owner in the admin editor; count words, not tags.
export const readMinutes = (html: string) => Math.max(1, Math.ceil(html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 200))


function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message)
  return data as T
}

export async function listPublicEntries(): Promise<Entry[]> {
  'use cache'
  cacheLife('hours')
  cacheTag('content')
  if (!configured) return []
  return unwrap(
    await publicDb().from('entries').select('*').eq('visibility', 'public').order('published_at', { ascending: false }),
  )
}

export async function getSharedEntry(slug: string): Promise<Entry | null> {
  'use cache'
  cacheLife('hours')
  cacheTag('content')
  if (!configured) return null
  return unwrap(await publicDb().from('entries').select('*').eq('slug', slug).maybeSingle())
}

export type Comment = { id: string; parent_id: string | null; name: string; body: string; by_owner: boolean; created_at: string }

/** A post's comments, oldest first. Cached per post; posting one refreshes just that post's list. */
export async function listComments(entryId: string): Promise<Comment[]> {
  'use cache'
  cacheLife('hours')
  cacheTag(`comments-${entryId}`)
  if (!configured) return []
  return unwrap(
    await publicDb().from('comments').select('id, parent_id, name, body, by_owner, created_at').eq('entry_id', entryId).order('created_at'),
  )
}

/** Project articles, the featured (selected) ones first. */
export async function listProjects(): Promise<Entry[]> {
  const entries = await listPublicEntries()
  const projects = entries.filter((e) => e.category === 'project')
  return [...projects.filter((e) => e.featured), ...projects.filter((e) => !e.featured)]
}

async function getSiteData(): Promise<SiteData> {
  'use cache'
  cacheLife('hours')
  cacheTag('content')
  if (!configured) return {}
  const row = unwrap<{ data: SiteData } | null>(await publicDb().from('site').select('data').eq('id', 1).maybeSingle())
  return row?.data ?? {}
}

/** The public site's copy and settings for one language: owner's edits over the defaults. */
export const getSite = async (lang: Locale) => mergeSite(await getSiteData(), lang, dict[lang], site)

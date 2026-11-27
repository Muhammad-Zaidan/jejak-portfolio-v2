// Site settings edited in /admin/site. Anything left empty there falls back to the defaults in i18n.ts.
// Pure on purpose (no runtime imports) so the merge rules can be tested directly; loading lives in content.ts.
import type { dict, site } from './i18n'

/** Home-page chapters the owner can switch off. */
export const sections = [
  ['siapa', 'Siapa'],
  ['apa', 'Apa'],
  ['tulisan', 'Tulisan'],
  ['bagaimana', 'Bagaimana'],
  ['kenapa', 'Kenapa'],
  ['bicara', 'Mari bicara'],
] as const

/** Per-language copy the owner can override. */
export const copyKeys = ['line', 'roles', 'now', 'whoBody', 'whatIntro', 'howIntro', 'whyText', 'whyAccent', 'talkLine', 'footer'] as const
type CopyKey = (typeof copyKeys)[number]

export type Copy = Partial<Record<CopyKey, string>> & {
  words?: [string, string][]
  steps?: string[]
  about?: string // HTML from the editor
}

export type SiteData = {
  name?: string
  email?: string
  github?: string
  linkedin?: string
  instagram?: string
  whatsapp?: string
  accent?: string
  hide?: string[]
  id?: Copy
  en?: Copy
}

const filled = (v: unknown) => (Array.isArray(v) ? v.length > 0 : typeof v === 'string' ? v.trim() !== '' : v != null)

/** Stored settings over the built-in defaults; empty fields keep the default. */
export function mergeSite(data: SiteData, lang: 'id' | 'en', t: (typeof dict)['id'], env: typeof site) {
  const copy = data[lang] ?? {}
  const pick = <T,>(v: T | undefined, fallback: T): T => (filled(v) ? (v as T) : fallback)
  return {
    name: pick(data.name, env.name),
    email: pick(data.email, env.email),
    github: pick(data.github, env.github),
    linkedin: pick(data.linkedin, env.linkedin),
    instagram: pick(data.instagram, env.instagram),
    whatsapp: pick(data.whatsapp, env.whatsapp),
    accent: /^#[0-9a-f]{6}$/i.test(data.accent ?? '') ? data.accent! : '',
    hide: data.hide ?? [],
    now: copy.now?.trim() ?? '',
    footer: pick(copy.footer, t.footer),
    about: copy.about?.trim() ? copy.about : t.about.map((p) => `<p>${p}</p>`).join(''),
    home: {
      ...t.home,
      ...Object.fromEntries(copyKeys.filter((k) => k in t.home && filled(copy[k])).map((k) => [k, copy[k]])),
      words: pick(copy.words?.filter(([w]) => w.trim()), t.home.words),
      steps: copy.steps?.filter((s) => s.trim()).length === 5 ? copy.steps : t.home.steps, // the process scene has exactly five phases
    },
  }
}

export type Site = ReturnType<typeof mergeSite>

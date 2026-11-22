'use server'
import { updateTag } from 'next/cache'
import { configured, sessionDb } from '@/lib/supabase'

export type CommentState = { ok?: number; error?: boolean }

/** A visitor's comment or reply. The database function re-checks that the post is shared and the reply stays on it. */
export async function addComment(prev: CommentState, form: FormData): Promise<CommentState> {
  // Bots fill every field; people never see this one.
  if (form.get('website')) return { ok: (prev.ok ?? 0) + 1 }
  const entry = String(form.get('entry') ?? '')
  const parent = String(form.get('parent') ?? '') || null
  const name = String(form.get('name') ?? '').trim()
  const email = String(form.get('email') ?? '').trim()
  const body = String(form.get('body') ?? '').trim()
  const uuid = /^[0-9a-f-]{36}$/
  if (!configured || !uuid.test(entry) || (parent && !uuid.test(parent)) || !name || name.length > 80
    || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 200 || !body || body.length > 3000) {
    return { error: true }
  }
  // shortcut: no rate limit beyond the honeypot and these limits; add one if comment spam shows up.
  // The session client, so a reply written while the owner is signed in is marked as the author's.
  const db = await sessionDb()
  const { error } = await db.rpc('add_comment', { p_entry: entry, p_parent: parent, p_name: name, p_email: email, p_body: body })
  if (error) return { error: true }
  updateTag(`comments-${entry}`)
  return { ok: (prev.ok ?? 0) + 1 }
}

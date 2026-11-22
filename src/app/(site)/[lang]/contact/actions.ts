'use server'
import { configured, publicDb } from '@/lib/supabase'

export type SendState = { ok?: boolean; error?: boolean }

export async function sendMessage(_: SendState, form: FormData): Promise<SendState> {
  // Bots fill every field; people never see this one.
  if (form.get('website')) return { ok: true }
  const name = String(form.get('name') ?? '').trim()
  const email = String(form.get('email') ?? '').trim()
  const body = String(form.get('body') ?? '').trim()
  if (!configured || !name || name.length > 120 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !body || body.length > 5000) {
    return { error: true }
  }
  // shortcut: no rate limit beyond the honeypot and DB length checks; add one if spam shows up.
  const { error } = await publicDb().from('messages').insert({ name, email, body })
  return error ? { error: true } : { ok: true }
}

'use client'
import { useActionState } from 'react'
import { sendMessage, type SendState } from './actions'

type Labels = { name: string; email: string; body: string; send: string; sent: string; error: string }

export function ContactForm({ t }: { t: Labels }) {
  const [state, action, pending] = useActionState<SendState, FormData>(sendMessage, {})
  if (state.ok) return <p className="text-3xl font-medium tracking-tight" role="status">{t.sent}</p>
  return (
    <form action={action} className="grid gap-5 max-w-[40rem]">
      <label className="grid gap-1">
        <span className="note">{t.name}</span>
        <input name="name" required maxLength={120} autoComplete="name" className="field text-lg" />
      </label>
      <label className="grid gap-1">
        <span className="note">{t.email}</span>
        <input name="email" type="email" required maxLength={200} autoComplete="email" className="field text-lg" />
      </label>
      <label className="grid gap-1">
        <span className="note">{t.body}</span>
        <textarea name="body" required maxLength={5000} rows={6} className="field text-lg font-sans!" />
      </label>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {state.error && <p role="alert" className="text-accent">{t.error}</p>}
      <button className="btn justify-self-start text-lg" disabled={pending}>{pending ? '…' : t.send}</button>
    </form>
  )
}

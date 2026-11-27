'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { noteSignIn } from './actions'

const client = () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const say = (e: { message?: string; code?: string }) => {
  const s = `${e.code} ${e.message}`
  if (/abort|cancel|NotAllowed/i.test(s)) return 'Dibatalkan.'
  if (/disabled/i.test(s)) return 'Passkey belum aktif di server.'
  if (/not found|no credential|unknown/i.test(s)) return 'Belum ada passkey di perangkat ini. Masuk lewat email dulu.'
  return e.message ?? 'Gagal.'
}

/** One tap with the fingerprint, face or device PIN: the passkey saved on this device signs the owner in. */
export function PasskeySignIn() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  return (
    <div className="grid gap-2">
      <button
        type="button"
        className="login-passkey"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          setError('')
          const { error } = await client().auth.signInWithPasskey()
          if (error) {
            setError(say(error))
            setBusy(false)
            return
          }
          const ok = await noteSignIn()
          if (!ok) setError('Perangkat ini bukan milik pemilik situs.')
          else router.replace('/admin')
          setBusy(false)
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" aria-hidden>
          <path d="M12 11v3m-4-3a4 4 0 0 1 8 0v1.5M6.5 8.5A7 7 0 0 1 19 11v2M5 12.5V11m3.5 6.5c.5-1.5.5-3 .5-4.5m6 0c0 2-.3 3.8-1 5.5M12 17v3" />
        </svg>
        {busy ? 'Menunggu sidik jari / wajah…' : 'Masuk dengan passkey'}
      </button>
      {error && <p role="alert" className="login-msg is-error">{error}</p>}
    </div>
  )
}

/** Saves a passkey on this device, so next time it signs in with one tap. */
export function AddPasskey({ label = 'Simpan passkey di perangkat ini' }: { label?: string }) {
  const router = useRouter()
  const [state, setState] = useState<'' | 'busy' | 'done' | string>('')
  return (
    <div className="grid gap-2">
      <button
        type="button"
        className="btn justify-self-start"
        disabled={state === 'busy'}
        onClick={async () => {
          setState('busy')
          const { error } = await client().auth.registerPasskey()
          setState(error ? say(error) : 'done')
          if (!error) router.refresh()
        }}
      >
        {state === 'busy' ? 'Menunggu…' : label}
      </button>
      {state === 'done' && <p role="status" className="note">Tersimpan. Lain kali cukup sentuh sidik jari atau wajah.</p>}
      {state && !['busy', 'done'].includes(state) && <p role="alert" className="note text-accent">{state}</p>}
    </div>
  )
}

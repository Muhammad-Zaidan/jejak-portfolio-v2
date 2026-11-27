'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { noteSignIn } from './actions'

const client = () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const say = (e: { message?: string; code?: string }) =>
  /abort|cancel|NotAllowed/i.test(`${e.code} ${e.message}`) ? 'Dibatalkan.' : e.message ?? 'Gagal.'

/** One tap with the fingerprint, face or device PIN: the passkey saved on this device signs the owner in. */
export function PasskeySignIn() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  return (
    <div className="grid gap-2">
      <button
        type="button"
        className="btn justify-self-start"
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
        {busy ? 'Menunggu…' : 'Masuk dengan passkey'}
      </button>
      {error && <p role="alert" className="note text-accent">{error}</p>}
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

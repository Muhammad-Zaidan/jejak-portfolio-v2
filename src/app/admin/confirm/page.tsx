'use client'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LogoMark } from '@/components/logo'
import { noteSignIn } from '../actions'

/**
 * Where the email sign-in link lands. The session arrives in the address's #fragment (never sent to a server);
 * it is stored as the usual cookies, checked to be the owner, and the device is noted before opening the dashboard.
 */
export default function Confirm() {
  const router = useRouter()
  const [state, setState] = useState<'wait' | 'fail' | 'forbidden'>('wait')
  useEffect(() => {
    // read once on arrival; every state change happens after an await, never synchronously in the effect
    const run = async () => {
      const hash = new URLSearchParams(location.hash.slice(1))
      const access_token = hash.get('access_token'), refresh_token = hash.get('refresh_token')
      history.replaceState(null, '', location.pathname) // keep tokens out of history
      const db = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { error } = access_token && refresh_token ? await db.auth.setSession({ access_token, refresh_token }) : { error: true }
      if (error) setState('fail')
      else if (!(await noteSignIn('email'))) setState('forbidden')
      else router.replace('/admin')
    }
    run()
  }, [router])
  return (
    <div className="login">
      <div className="login-card">
        <LogoMark className="login-mark" />
        <h1 className="login-title">{state === 'wait' ? 'Masuk…' : 'Tidak bisa masuk'}</h1>
        <p className="login-sub">
          {state === 'wait' && 'Sebentar, memeriksa link dari email.'}
          {state === 'fail' && 'Link ini sudah dipakai atau kedaluwarsa. Minta link baru, lalu buka link terbarunya saja.'}
          {state === 'forbidden' && 'Akun itu bukan pemilik situs ini.'}
        </p>
        {state !== 'wait' && <Link href="/admin/login" className="login-passkey">Kembali ke halaman masuk</Link>}
      </div>
    </div>
  )
}

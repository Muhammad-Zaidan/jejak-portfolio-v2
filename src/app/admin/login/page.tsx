import Link from 'next/link'
import { LogoMark } from '@/components/logo'
import { configured } from '@/lib/supabase'
import { signInEmail } from '../actions'
import { PasskeySignIn } from '../passkey'

export const instant = false

const errors: Record<string, string> = {
  forbidden: 'Akun itu bukan pemilik situs ini.',
  failed: 'Login gagal atau link sudah kedaluwarsa. Coba lagi.',
  email: 'Alamat email tidak valid.',
}

/** A screen of its own, over the admin chrome: the passkey first, the email link as the way in on a new device. */
export default async function Login({ searchParams }: PageProps<'/admin/login'>) {
  const { e, m, sent } = await searchParams
  const error = typeof e === 'string' ? (e === 'send' ? `Gagal mengirim link${typeof m === 'string' ? `: ${m}` : '.'}` : errors[e]) : null
  return (
    <div className="login">
      <div className="login-card">
        <LogoMark className="login-mark" />
        <h1 className="login-title">Personal OS</h1>
        <p className="login-sub">Masuk untuk melanjutkan. Hanya pemilik.</p>

        {error && <p role="alert" className="login-msg is-error">{error}</p>}
        {sent && <p role="status" className="login-msg">Link masuk sudah dikirim. Buka email di perangkat ini.</p>}

        {configured ? (
          <>
            <PasskeySignIn />
            <div className="login-or"><span>atau lewat email</span></div>
            <form action={signInEmail} className="login-email">
              <input name="email" type="email" required autoComplete="email webauthn" placeholder="Email pemilik" aria-label="Email pemilik" className="field" />
              <button className="btn btn-quiet">Kirim link</button>
            </form>
            <p className="login-hint">Perangkat baru? Masuk sekali lewat email, lalu simpan passkey di menu Perangkat.</p>
          </>
        ) : (
          <p className="login-msg">Supabase belum dikonfigurasi. Isi <code>.env.local</code> sesuai README.</p>
        )}
      </div>
      <Link href="/" className="login-back">← Kembali ke situs</Link>
    </div>
  )
}

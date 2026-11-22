import { configured } from '@/lib/supabase'
import { signIn, signInEmail } from '../actions'

export const instant = false

export default async function Login({ searchParams }: PageProps<'/admin/login'>) {
  const { e, m, sent } = await searchParams
  return (
    <div className="panel max-w-md">
      <h1>Masuk</h1>
      <p className="mt-3 text-[var(--soft)]">Hanya pemilik yang bisa masuk.</p>
      {e === 'forbidden' && <p role="alert" className="mt-4 text-accent">Akun itu bukan pemilik situs ini.</p>}
      {e === 'failed' && <p role="alert" className="mt-4 text-accent">Login gagal atau link sudah kedaluwarsa. Coba lagi.</p>}
      {e === 'email' && <p role="alert" className="mt-4 text-accent">Alamat email tidak valid.</p>}
      {e === 'send' && <p role="alert" className="mt-4 text-accent">Gagal mengirim link{typeof m === 'string' ? `: ${m}` : '.'}</p>}
      {sent && <p role="status" className="mt-4">Link masuk sudah dikirim. Buka email Anda di perangkat ini.</p>}
      {configured ? (
        <div className="mt-8 grid gap-6">
          <form action={signInEmail} className="grid gap-3">
            <label className="grid gap-1">
              <span className="note">Email pemilik</span>
              <input name="email" type="email" required autoComplete="email" className="field" />
            </label>
            <button className="btn justify-self-start">Kirim link masuk</button>
          </form>
          <form action={signIn}>
            <button className="btn btn-quiet">Masuk dengan Google</button>
            <p className="note mt-2">Google juga menyambungkan Kalender. Butuh pengaturan Google di Supabase.</p>
          </form>
        </div>
      ) : (
        <p className="mt-8">Supabase belum dikonfigurasi. Isi <code>.env.local</code> sesuai README.</p>
      )}
    </div>
  )
}

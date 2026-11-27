import { cookies } from 'next/headers'
import { DEVICE_COOKIE, deviceName } from '@/lib/device'
import { requireOwner } from '@/lib/owner'
import Link from 'next/link'
import { googleConfigured } from '@/lib/google'
import { deletePasskey, disconnectGoogle, forgetDevice, renamePasskey, syncMailNow } from '../actions'
import { AddPasskey } from '../passkey'

const when = (iso: string) => new Date(iso).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
// per request anyway (requireOwner opts out of prerendering), so reading the clock here is fine
const isRecent = (iso: string) => Date.now() - Date.parse(iso) < 3 * 864e5
const how = { passkey: 'passkey', email: 'link email', google: 'Google' } as Record<string, string>

/** Which devices can get in (passkeys) and which ones did (sign-in history, grouped by device). */
export default async function Devices({ searchParams }: PageProps<'/admin/devices'>) {
  const db = await requireOwner()
  const { google: gState, synced } = await searchParams
  const here = (await cookies()).get(DEVICE_COOKIE)?.value
  const [passkeys, signIns, google] = await Promise.all([
    db.auth.passkey.list(),
    db.from('sign_ins').select('*').order('at', { ascending: false }).limit(200),
    db.from('integrations').select('email, scopes, synced_at, updated_at').eq('provider', 'google').maybeSingle(),
  ])
  const g = google.data
  if (signIns.error) throw new Error(signIns.error.message)

  // one row per device, newest first; a device is "new" if its first sign-in was in the last 3 days
  const byDevice = new Map<string, { device: string; first: string; last: string; count: number; ua: string; method: string; ip: string }>()
  for (const s of signIns.data!) {
    const d = byDevice.get(s.device)
    if (!d) byDevice.set(s.device, { device: s.device, first: s.at, last: s.at, count: 1, ua: s.user_agent, method: s.method, ip: s.ip })
    else ((d.first = s.at), d.count++)
  }
  const devices = [...byDevice.values()]
  const fresh = (d: { first: string }) => isRecent(d.first)

  return (
    <div className="grid max-w-3xl gap-12">
      <header>
        <p className="note">Keamanan & koneksi</p>
        <h1 className="text-5xl font-semibold tracking-tight">Perangkat</h1>
        <p className="mt-3 text-muted">Passkey menggantikan kata sandi: masuk cukup dengan sidik jari, wajah, atau PIN perangkat, dan tidak bisa dicuri lewat phishing.</p>
      </header>

      <section className="grid gap-4">
        <h2 className="text-2xl font-semibold">Google</h2>
        {gState === 'ok' && <p role="status" className="bg-surface p-4">Google terhubung. Kalender dan email transaksi bank sudah bisa dipakai.</p>}
        {gState === 'failed' && <p role="alert" className="bg-surface p-4 text-accent">Gagal menghubungkan Google. Coba lagi, dan izinkan semua akses yang diminta.</p>}
        {gState === 'setup' && <p role="alert" className="bg-surface p-4">GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET belum diisi di server.</p>}
        {typeof synced === 'string' && <p role="status" className="bg-surface p-4">{synced === 'not-connected' ? 'Google belum terhubung.' : `${synced} transaksi baru dari email.`}</p>}
        <div className="card grid gap-3">
          {g ? (
            <>
              <p>Terhubung sebagai <b>{g.email || 'akun Google'}</b></p>
              <p className="note">
                {g.scopes.includes('calendar') ? '✓ Kalender' : '✗ Kalender'} · {g.scopes.includes('gmail.readonly') ? '✓ Email transaksi bank (hanya baca)' : '✗ Email transaksi bank'}
                {g.synced_at && <> · email terakhir dicek {when(g.synced_at)}</>}
              </p>
              <div className="flex flex-wrap gap-3">
                {g.scopes.includes('gmail.readonly') && <form action={syncMailNow}><input type="hidden" name="to" value="/admin/devices" /><button className="btn btn-quiet">Cek email sekarang</button></form>}
                <Link className="btn btn-quiet" href="/admin/google" prefetch={false}>Hubungkan ulang</Link>
                <form action={disconnectGoogle}><button className="note lift">putuskan</button></form>
              </div>
            </>
          ) : (
            <>
              <p>Satu kali izin untuk Kalender dan membaca email notifikasi bank (Mandiri, BCA, dan lainnya) supaya transaksi tercatat otomatis.</p>
              {googleConfigured() ? <Link className="btn justify-self-start" href="/admin/google" prefetch={false}>Hubungkan Google</Link> : <p className="note">Server belum punya GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET.</p>}
            </>
          )}
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-2xl font-semibold">Passkey</h2>
        {passkeys.error ? (
          <p className="bg-surface p-4">Passkey belum aktif di Supabase ({passkeys.error.message}).</p>
        ) : (
          <ul className="grid gap-2">
            {passkeys.data!.map((p) => (
              <li key={p.id} className="card grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                <form action={renamePasskey} className="flex gap-2">
                  <input type="hidden" name="id" value={p.id} />
                  <input name="name" defaultValue={p.friendly_name ?? 'Passkey'} className="field" aria-label="Nama passkey" />
                  <button className="btn btn-quiet">Simpan</button>
                </form>
                <div className="flex items-center gap-3">
                  <span className="note">dibuat {when(p.created_at)}{p.last_used_at ? ` · terakhir ${when(p.last_used_at)}` : ''}</span>
                  <form action={deletePasskey}><input type="hidden" name="id" value={p.id} /><button className="note lift text-accent">hapus</button></form>
                </div>
              </li>
            ))}
            {passkeys.data!.length === 0 && <li className="bg-surface p-4">Belum ada passkey. Simpan satu di perangkat ini.</li>}
          </ul>
        )}
        <AddPasskey />
      </section>

      <section className="grid gap-4">
        <h2 className="text-2xl font-semibold">Riwayat masuk</h2>
        <ul className="grid gap-2">
          {devices.map((d) => (
            <li key={d.device} className={`card grid gap-1 ${fresh(d) && d.device !== here ? 'is-waiting' : ''}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold">
                  {deviceName(d.ua)}
                  {d.device === here && <span className="badge ml-2">perangkat ini</span>}
                  {fresh(d) && d.device !== here && <span className="ml-2 text-sm text-accent">baru</span>}
                </span>
                <span className="note">{d.count}× masuk</span>
              </div>
              <p className="note">Terakhir {when(d.last)} lewat {how[d.method] ?? d.method}{d.ip ? ` · IP ${d.ip}` : ''} · pertama {when(d.first)}</p>
              {d.device !== here && (
                <form action={forgetDevice}><input type="hidden" name="device" value={d.device} /><button className="note lift">lupakan perangkat ini</button></form>
              )}
            </li>
          ))}
          {devices.length === 0 && <li className="bg-surface p-4">Belum ada catatan. Riwayat mulai terisi sejak login berikutnya.</li>}
        </ul>
        <p className="note">Ada perangkat yang tidak kamu kenal? Hapus passkey-nya dan keluar dari semua sesi lewat Supabase → Authentication → Users.</p>
      </section>
    </div>
  )
}

export const instant = false

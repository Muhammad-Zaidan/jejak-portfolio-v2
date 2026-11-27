import type { Metadata } from 'next'
import { PageHead, wrap } from '@/components/site'
import { getSite } from '@/lib/content'
import { hasLocale, type Locale } from '@/lib/i18n'

const copy = {
  id: {
    title: 'Privasi',
    index: 'Kebijakan privasi',
    updated: 'Terakhir diperbarui 27 November 2026',
    body: [
      ['Pengunjung', 'Situs ini tidak memakai cookie pelacak atau iklan. Jika kamu mengirim pesan lewat formulir kontak, nama, email, dan isi pesan disimpan agar bisa saya balas. Jika kamu berkomentar, nama dan komentarmu tampil di situs; email hanya untuk saya dan tidak pernah ditampilkan atau dibagikan.'],
      ['Personal OS', 'Panel /admin hanya bisa dibuka oleh pemilik situs. Di sana tersimpan data pribadi pemilik sendiri: catatan, keuangan, dan riwayat login. Data ini tidak dibagikan ke pihak mana pun.'],
      ['Data Google', 'Jika pemilik menghubungkan akun Google-nya, aplikasi meminta akses ke Google Calendar (membaca dan membuat acara) dan Gmail hanya-baca, khusus untuk membaca email notifikasi transaksi dari bank dan dompet digital lalu mencatatnya sebagai transaksi. Isi email lain tidak disimpan. Token akses disimpan terenkripsi (AES-256-GCM) dan bisa dicabut kapan saja dari halaman Perangkat atau dari pengaturan akun Google. Penggunaan dan transfer informasi yang diterima dari Google API mematuhi Google API Services User Data Policy, termasuk ketentuan Limited Use.'],
      ['Penyimpanan', 'Data disimpan di Supabase (PostgreSQL) dengan aturan akses per baris, dan situs dijalankan di Vercel.'],
      ['Kontak', 'Pertanyaan atau permintaan penghapusan data: {email}.'],
    ],
  },
  en: {
    title: 'Privacy',
    index: 'Privacy policy',
    updated: 'Last updated 27 November 2026',
    body: [
      ['Visitors', 'This site uses no tracking or advertising cookies. If you send a message through the contact form, your name, email and message are stored so I can reply. If you comment, your name and comment appear on the site; your email is for me only and is never shown or shared.'],
      ['Personal OS', 'The /admin panel can only be opened by the site owner. It holds the owner’s own data: notes, finances and sign-in history. None of it is shared with anyone.'],
      ['Google data', 'If the owner connects their Google account, the app asks for Google Calendar (read and create events) and read-only Gmail, used only to read transaction notification emails from banks and e-wallets and record them as transactions. No other email content is stored. The token is stored encrypted (AES-256-GCM) and can be revoked at any time from the Devices page or the Google account settings. Use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.'],
      ['Storage', 'Data is stored in Supabase (PostgreSQL) with row-level access rules, and the site runs on Vercel.'],
      ['Contact', 'Questions or data deletion requests: {email}.'],
    ],
  },
}

export async function generateMetadata({ params }: PageProps<'/[lang]/privacy'>): Promise<Metadata> {
  const { lang } = await params
  return { title: copy[hasLocale(lang) ? lang : 'id'].title }
}

/** The privacy policy: what visitors share, and what the owner's back office does with Google data. */
export default async function Privacy({ params }: PageProps<'/[lang]/privacy'>) {
  const { lang: raw } = await params
  const lang: Locale = hasLocale(raw) ? raw : 'id'
  const c = copy[lang]
  const site = await getSite(lang)
  return (
    <>
      <PageHead index={c.index} title={c.title} />
      <section className={`${wrap} mt-16 grid max-w-3xl gap-10 pb-24`}>
        <p className="text-sm text-[var(--soft)]">{c.updated}</p>
        {c.body.map(([h, p]) => (
          <div key={h} className="grid gap-2">
            <h2 className="text-xl font-semibold">{h}</h2>
            <p className="leading-relaxed text-[var(--soft)]">{p.replace('{email}', site.email)}</p>
          </div>
        ))}
      </section>
    </>
  )
}

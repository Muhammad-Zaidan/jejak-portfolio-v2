# Portfolio & Personal OS

Satu situs, dua sisi. Sisi depan `/id` dan `/en` adalah portfolio publik dan tulisan, bergaya Lab Notebook untuk kerangkanya dan Editorial untuk artikel. Sisi belakang `/admin` adalah dashboard pribadi: agenda Google Calendar, catatan dan ide, tulisan, keuangan, proyek, dan pesan masuk.

Stack: Next.js 16 (App Router, Cache Components), Supabase (Postgres + Auth + RLS), Tailwind 4. Deploy ke Vercel.

## Menjalankan

```bash
npm install
cp .env.example .env.local   # lalu isi, lihat Setup
npm run dev                  # http://localhost:3000
npm test                     # RLS, enkripsi token, hitungan uang
```

Tanpa `.env.local` situs tetap jalan dengan isi kosong, dan `/admin` menampilkan pesan setup.

## Setup (sekali saja)

1. **Supabase.** Buat proyek di supabase.com, isi `.env.local` (lihat `.env.example`, termasuk `SUPABASE_DB_URL` dari tombol Connect → Session pooler), lalu jalankan:
   ```
   npm run db
   ```
   Ini membuat semua tabel (`supabase/migrations`) dan mengisi contoh isi dari `supabase/seed.sql` (semuanya bertanda "contoh", hapus kapan saja). Pemilik admin diatur di baris pertama `seed.sql`. Login pertama cukup lewat link email; Google (langkah 2–3) baru perlu untuk Kalender.

2. **Google Cloud.** Buat proyek, aktifkan *Google Calendar API*, lalu buat *OAuth client ID* tipe Web application.
   - Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
   - Biarkan OAuth consent screen di mode *Testing*, tambahkan email Anda sebagai test user, dan tambahkan scope `.../auth/calendar.events`. Untuk pemakaian pribadi tidak perlu verifikasi Google.
3. **Supabase Auth.** Di Authentication → Providers → Google, isi client ID dan secret. Di Authentication → URL Configuration, tambahkan `http://localhost:3000/auth/callback` dan `https://domain-anda/auth/callback` ke Redirect URLs.
4. **`.env.local`.** Isi semua variabel di `.env.example`. `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` sama dengan yang diisi di Supabase.
5. Buka `/admin`, lalu masuk dengan Google. Login pertama sekaligus menghubungkan kalender.
6. **Vercel.** Import repo, isi environment variables yang sama, lalu ubah `NEXT_PUBLIC_SITE_URL` ke domain produksi.

## Peta kode

| Bagian | Tempat |
| --- | --- |
| Skema dan aturan akses | `supabase/migrations/0001_init.sql` |
| Teks, profil, dan tampilan situs | Admin → Situs (`src/lib/site.ts`, tabel `site`) |
| Teks antarmuka ID/EN, bio "Tentang" | `src/lib/i18n.ts` |
| Warna dan font (ganti dengan identitas visual) | `src/app/globals.css`, `src/app/fonts.ts` |
| Halaman publik | `src/app/(site)/[lang]/` |
| Admin dan semua aksi tulis | `src/app/admin/`, `src/app/admin/actions.ts` |
| Google Calendar | `src/lib/gcal.ts` |

Isi publik di-cache satu jam dan diperbarui langsung setiap kali Anda menyimpan dari admin.

## Belum dibuat (sengaja, sesuai fase PRD atau untuk menjaga MVP kecil)

- API ingest untuk Hermes (fase 2). Kolom `source`, `external_id`, dan `reviewed` di `transactions` sudah disiapkan.
- Halaman `/arsip` (Timeline Hidup), tugas, jurnal harian, PWA, dan halaman Now/Uses (fase 2).
- Pencarian di halaman Tulisan publik dan daftar isi artikel.
- Tautan antar catatan (backlink), syntax highlighting di blok kode, dan edit event kalender (bisa tambah dan hapus).
- Rate limit formulir kontak (sementara honeypot dan batas panjang di database).

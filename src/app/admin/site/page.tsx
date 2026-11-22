import { Area, Field } from '@/components/fields'
import { RichEditor } from '@/components/rich-editor'
import { dict, site as env } from '@/lib/i18n'
import { requireOwner } from '@/lib/owner'
import { sections, type Copy, type SiteData } from '@/lib/site'
import { saveSite } from '../actions'

const langs = [['id', 'Bahasa Indonesia'], ['en', 'English']] as const

// Every field shows its built-in default as a placeholder: leave it empty to keep the default.
export default async function SiteSettings({ searchParams }: PageProps<'/admin/site'>) {
  const db = await requireOwner()
  const { saved } = await searchParams
  const { data: row } = await db.from('site').select('data').eq('id', 1).maybeSingle()
  const d: SiteData = row?.data ?? {}
  const c = (l: 'id' | 'en'): Copy => d[l] ?? {}

  return (
    <form action={saveSite} className="grid gap-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="note">Semua yang tampil di situs publik</p>
          <h1>Situs</h1>
        </div>
      </header>

      <Section title="Profil & kontak" hint="Dipakai di header, footer, halaman Tentang dan Kontak.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="name" label="Nama" value={d.name ?? ''} placeholder={env.name} />
          <Field name="email" label="Email" value={d.email ?? ''} placeholder={env.email} type="email" />
          <Field name="github" label="GitHub" value={d.github ?? ''} placeholder="https://github.com/…" />
          <Field name="linkedin" label="LinkedIn" value={d.linkedin ?? ''} placeholder="https://linkedin.com/in/…" />
          <Field name="instagram" label="Instagram" value={d.instagram ?? ''} placeholder="https://instagram.com/…" />
        </div>
      </Section>

      <Section title="Tampilan" hint="Bagian halaman depan yang tidak dicentang akan disembunyikan.">
        <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:gap-12">
          <div className="grid gap-2">
            <span className="note">Warna aksen</span>
            <div className="flex items-center gap-3">
              <input type="color" name="accent" defaultValue={d.accent || '#ff3b30'} className="h-10 w-14 cursor-pointer rounded-lg border border-[var(--line)] bg-transparent" aria-label="Warna aksen" />
              <label className="check"><input type="checkbox" name="accent_default" defaultChecked={!d.accent} /> Pakai merah logo</label>
            </div>
          </div>
          <fieldset className="grid gap-2">
            <legend className="note mb-2">Bagian halaman depan</legend>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {sections.map(([id, label]) => (
                <label key={id} className="check"><input type="checkbox" name="show" value={id} defaultChecked={!d.hide?.includes(id)} /> {label}</label>
              ))}
            </div>
          </fieldset>
        </div>
      </Section>

      <Section title="Halaman depan" hint="Kosongkan untuk memakai teks bawaan. Tandai kata aksen di bagian Kenapa dengan *bintang*.">
        <div className="grid gap-10 lg:grid-cols-2">
          {langs.map(([l, name]) => {
            const h = dict[l].home
            const v = c(l)
            return (
              <fieldset key={l} className="grid content-start gap-4">
                <legend className="lang-tag">{name}</legend>
                <Area name={`${l}.line`} label="Kalimat pembuka (hero)" value={v.line ?? ''} placeholder={h.line} rows={2} />
                <Field name={`${l}.roles`} label="Peran (kanan hero)" value={v.roles ?? ''} placeholder={h.roles} />
                <Field name={`${l}.now`} label="Sedang mengerjakan" value={v.now ?? ''} placeholder="kosongkan: otomatis dari proyek pilihan (Selected) pertama" />
                <Area name={`${l}.whoBody`} label="Siapa" value={v.whoBody ?? ''} placeholder={h.whoBody} />
                <div className="grid gap-2">
                  <span className="note">Empat kata tentang saya</span>
                  {h.words.map(([w, line], i) => (
                    <div key={i} className="grid grid-cols-[8rem_1fr] gap-2">
                      <input name={`${l}.word${i}`} defaultValue={v.words?.[i]?.[0] ?? ''} placeholder={w} className="field" aria-label={`Kata ${i + 1}`} />
                      <input name={`${l}.wordline${i}`} defaultValue={v.words?.[i]?.[1] ?? ''} placeholder={line} className="field" aria-label={`Penjelasan kata ${i + 1}`} />
                    </div>
                  ))}
                </div>
                <Area name={`${l}.whatIntro`} label="Apa (pengantar)" value={v.whatIntro ?? ''} placeholder={h.whatIntro} rows={2} />
                <Area name={`${l}.howIntro`} label="Bagaimana (pengantar)" value={v.howIntro ?? ''} placeholder={h.howIntro} rows={2} />
                <Area name={`${l}.steps`} label="Lima langkah kerja · satu per baris, urutan Anda" value={v.steps?.join('\n') ?? ''} placeholder={h.steps.join('\n')} rows={5} />
                <Area name={`${l}.whyText`} label="Kenapa" value={v.whyText ?? ''} placeholder={h.whyText} rows={4} />
                <Field name={`${l}.whyAccent`} label="Kenapa (kalimat penutup)" value={v.whyAccent ?? ''} placeholder={h.whyAccent} />
                <Field name={`${l}.talkLine`} label="Ajakan kontak" value={v.talkLine ?? ''} placeholder={h.talkLine} />
                <Field name={`${l}.footer`} label="Kalimat footer" value={v.footer ?? ''} placeholder={dict[l].footer} />
              </fieldset>
            )
          })}
        </div>
      </Section>

      <Section title="Halaman Tentang" hint="Editor yang sama dengan tulisan: bisa foto, video, kode, dan file.">
        <div className="grid gap-10">
          {langs.map(([l, name]) => (
            <div key={l} className="grid gap-2">
              <span className="lang-tag">{name}</span>
              <RichEditor name={`${l}.about`} initial={c(l).about ?? ''} />
            </div>
          ))}
        </div>
      </Section>

      <div className="savebar">
        <button className="btn">Simpan perubahan</button>
        {saved && <span role="status" className="note">Tersimpan. Situs publik sudah diperbarui.</span>}
      </div>
    </form>
  )
}

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="panel grid gap-6">
      <div>
        <h2>{title}</h2>
        <p className="note mt-1">{hint}</p>
      </div>
      {children}
    </section>
  )
}

// Reads the session and the URL on every request; no instant-navigation shell for the back office.
export const instant = false

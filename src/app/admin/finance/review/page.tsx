import Link from 'next/link'
import { idr, requireOwner } from '@/lib/owner'
import { acceptAllTx, deleteRule, reviewTx, syncMailNow } from '../../actions'

/**
 * Transactions read from bank emails that no rule recognised. Kept apart from logging and planning, so the daily
 * flow never waits on them: give one a name and category here, and tick "always" to make it a rule.
 */
export default async function Review({ searchParams }: PageProps<'/admin/finance/review'>) {
  const db = await requireOwner()
  const { synced } = await searchParams
  const [tx, categories, accounts, rules] = await Promise.all([
    db.from('transactions').select('id, date, amount, note, merchant, category_id, account_id').eq('reviewed', false).order('date', { ascending: false }).limit(100),
    db.from('categories').select('id, name, kind').order('kind').order('name'),
    db.from('accounts').select('id, name'),
    db.from('tx_rules').select('id, pattern, title, category_id').order('created_at', { ascending: false }),
  ])
  for (const r of [tx, categories, accounts, rules]) if (r.error) throw new Error(r.error.message)
  const C = categories.data!
  const kindOf = new Map(C.map((c) => [c.id, c.kind]))
  const name = new Map([...C, ...accounts.data!].map((x) => [x.id, x.name]))

  return (
    <div className="grid max-w-4xl gap-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="note">Keuangan · dari email bank</p>
          <h1 className="text-5xl font-semibold tracking-tight">Perlu judul</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <form action={syncMailNow}><button className="btn btn-quiet">Cek email sekarang</button></form>
          <Link className="lift" href="/admin/finance">← Keuangan</Link>
        </div>
      </header>
      {typeof synced === 'string' && (
        <p role="status" className="bg-surface p-4">
          {synced === 'not-connected' ? <>Google belum terhubung. <Link className="link" href="/admin/devices">Hubungkan di Perangkat & koneksi</Link>.</> : `${synced} transaksi baru dari email.`}
        </p>
      )}

      <section className="grid gap-3">
        {tx.data!.map((t) => {
          const inc = kindOf.get(t.category_id) === 'income'
          return (
            <form key={t.id} action={reviewTx} className="card grid gap-3">
              <input type="hidden" name="id" value={t.id} />
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold">{t.merchant || 'Tanpa keterangan'}</span>
                <span className={`tabular-nums ${inc ? '' : 'text-accent'}`}>{inc ? '+' : '−'}{idr(Number(t.amount))}</span>
              </div>
              <p className="note -mt-2">{t.date} · {name.get(t.account_id)}</p>
              <div className="grid gap-2 sm:grid-cols-[1fr_12rem_auto]">
                <input name="note" defaultValue={t.note} placeholder="Judul, mis. Makan siang" className="field" aria-label="Judul" required />
                <select name="category_id" defaultValue={t.category_id} className="field" aria-label="Kategori">
                  {C.filter((c) => c.kind === (inc ? 'income' : 'expense')).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button className="btn">Simpan</button>
              </div>
              <label className="check text-sm">
                <input type="checkbox" name="always" />
                Selalu begini untuk transaksi yang memuat
                <input name="pattern" defaultValue={(t.merchant || '').toLowerCase().slice(0, 40)} className="field w-48! py-1!" aria-label="Kata kunci" />
              </label>
            </form>
          )
        })}
        {tx.data!.length === 0 ? (
          <p className="bg-surface p-4">Semua transaksi dari email sudah jelas.</p>
        ) : (
          <form action={acceptAllTx}><button className="note lift">Biarkan semua apa adanya</button></form>
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="text-2xl font-semibold">Aturan default</h2>
        <p className="note">Transaksi email yang memuat kata kunci ini langsung dicatat dengan judul dan kategorinya, tanpa masuk ke daftar di atas.</p>
        <ul>
          {rules.data!.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 border-t border-ink/20 py-2">
              <span><code>{r.pattern}</code> → {r.title || '(judul dari email)'} <span className="note">· {name.get(r.category_id)}</span></span>
              <form action={deleteRule}><input type="hidden" name="id" value={r.id} /><button className="note lift">hapus</button></form>
            </li>
          ))}
          {rules.data!.length === 0 && <li className="note">Belum ada. Centang “Selalu begini” saat memberi judul.</li>}
        </ul>
      </section>
    </div>
  )
}

export const instant = false

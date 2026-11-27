// Reads an Indonesian bank or e-wallet notification email and pulls out one transaction. Pure, so it is tested
// against sample emails; returns null for anything that is not a completed transaction (promos, OTPs, statements).

export type Mail = { from: string; subject: string; text: string }
export type Parsed = { amount: number; kind: 'income' | 'expense'; merchant: string; bank: string; what: string }

const BANKS: [RegExp, string][] = [
  [/bankmandiri|livin/i, 'Mandiri'],
  [/bca\.co\.id|klikbca|mybca/i, 'BCA'],
  [/bri\.co\.id|brimo/i, 'BRI'],
  [/bni\.co\.id/i, 'BNI'],
  [/jago\.com/i, 'Jago'],
  [/seabank/i, 'SeaBank'],
  [/gojek|gopay/i, 'GoPay'],
  [/ovo\.id/i, 'OVO'],
  [/dana\.id/i, 'DANA'],
  [/shopee/i, 'ShopeePay'],
]
/** Gmail search for the senders above, so only their mail is read. */
export const SENDERS = 'from:(bankmandiri.co.id OR bca.co.id OR bri.co.id OR bni.co.id OR jago.com OR seabank.co.id OR gojek.com OR ovo.id OR dana.id OR shopee.co.id)'

/** "IDR 50,000.00", "Rp 100.000,00", "Rp25.000" → whole rupiah. */
export function rupiah(raw: string) {
  let s = raw.replace(/[^\d.,]/g, '')
  if (/[.,]\d{2}$/.test(s) && /[.,].*[.,]\d{2}$|^\d{4,}[.,]\d{2}$/.test(s)) s = s.slice(0, -3) // drop sen
  return Number(s.replace(/[.,]/g, '')) || 0
}

const MONEY = /(?:Rp\.?|IDR)\s*([\d][\d.,]*)/i
const AMOUNT_LABELS = [/total\s*(?:transaksi|bayar|pembayaran|transfer|amount|payment)?/i, /nominal\s*(?:transaksi|transfer|pembayaran)?/i, /jumlah\s*(?:transfer|pembayaran|transaksi|dana)?/i, /amount/i]
// most specific first; a bare "merchant" must not catch "Merchant PAN"
const MERCHANT_LABELS = [/nama\s*merchant/i, /merchant\s*name/i, /nama\s*toko/i, /nama\s*penerima/i, /beneficiary\s*name/i, /penerima/i, /recipient/i, /tujuan/i, /merchant(?!\s*pan)/i, /dari/i, /pengirim/i, /keterangan/i, /berita/i, /deskripsi/i]
const WHAT_LABELS = [/jenis\s*transaksi/i, /tipe\s*transaksi/i, /transfer\s*type/i, /transaction\s*type/i]
// a completed transaction says so in the subject; announcements, promos and order updates do not
const DONE = /berhasil|sukses|successful|transaksi|transaction|pembayaran|payment|transfer|top ?-?up|dana masuk|uang masuk|menerima|received|tarik tunai|debit|kredit|journal/i
const NOT_DONE = /\bOTP\b|kode verifikasi|promo|cashback|e-?statement|rekening koran|gagal|failed|ditolak|informasi|pemberitahuan|pemeliharaan|riplay|syarat|ketentuan|permintaan|pengembalian|pesanan/i
const numberish = (v: string) => /^(pan\s*)?[\d\s*x.-]+$/i.test(v)

/** The value after a label: on the same line after ":" (or a tab), or on the next non-empty line. */
function field(lines: string[], labels: RegExp[]) {
  for (const label of labels)
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i]
      const m = l.match(new RegExp(`^\\s*${label.source}\\s*[:\\t]?\\s*(.*)$`, 'i'))
      if (!m) continue
      const rest = m[1].replace(/^[:\s]+/, '').trim()
      if (rest && !numberish(rest)) return rest
      if (rest) continue
      // the value may sit on a later line, after a line holding only ":"
      const next = lines.slice(i + 1).find((x) => !/^[:\s]*$/.test(x))
      if (next && !numberish(next)) return next.trim()
    }
  return ''
}

export function htmlToText(html: string) {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/(p|div|tr|li|h\d)>|<br\s*\/?>/gi, '\n')
    .replace(/<\/t[dh]>/gi, '\t')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
}

export function parseBankMail(mail: Mail): Parsed | null {
  const bank = BANKS.find(([re]) => re.test(mail.from))?.[1]
  if (!bank) return null
  const all = `${mail.subject}\n${mail.text}`
  if (NOT_DONE.test(mail.subject) || !DONE.test(mail.subject)) return null

  const lines = mail.text.split(/\n/).map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean)
  let amount = 0
  for (const label of AMOUNT_LABELS) {
    const v = field(lines, [label])
    const m = v.match(MONEY) ?? (/^[\d.,]+$/.test(v) ? [v, v] : null)
    if (m) {
      amount = rupiah(m[1])
      if (amount) break
    }
  }
  if (!amount) amount = rupiah(all.match(MONEY)?.[1] ?? '')
  if (!amount) return null

  const income = /dana masuk|transfer masuk|uang masuk|anda menerima|telah menerima|diterima|kredit|incoming|refund/i.test(all) && !/pembayaran|bayar ke|transfer ke|qris/i.test(mail.subject)
  const merchant = field(lines, income ? [/dari/i, /pengirim/i, /nama\s*pengirim/i, ...MERCHANT_LABELS] : MERCHANT_LABELS).replace(MONEY, '').slice(0, 200).trim()
  const what = (field(lines, WHAT_LABELS) || mail.subject).slice(0, 120)
  // money moved between the owner's own accounts is neither spending nor income
  const me = all.match(/(?:halo|hello|hai|hi)\s+([^,\n]+)/i)?.[1].trim().toUpperCase()
  if (me && merchant.toUpperCase() === me) return null
  return { amount, kind: income ? 'income' : 'expense', merchant, bank, what }
}

/** The first rule whose pattern appears in the merchant or description. */
export function matchRule<R extends { pattern: string }>(rules: R[], p: { merchant: string; what: string }) {
  const hay = `${p.merchant} ${p.what}`.toLowerCase()
  return rules.find((r) => hay.includes(r.pattern.toLowerCase()))
}

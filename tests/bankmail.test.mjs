import { test } from 'node:test'
import assert from 'node:assert/strict'
import { htmlToText, matchRule, parseBankMail, rupiah } from '../src/lib/bankmail.ts'

test('rupiah reads both separator styles and drops sen', () => {
  assert.equal(rupiah('50,000.00'), 50000)
  assert.equal(rupiah('100.000,00'), 100000)
  assert.equal(rupiah('25.000'), 25000)
  assert.equal(rupiah('1.250.000'), 1250000)
  assert.equal(rupiah('20000'), 20000)
  assert.equal(rupiah('3500000,00'), 3500000)
})

test('a BCA QRIS payment (table HTML)', () => {
  const html = '<table><tr><td>Status</td><td>:</td><td>Berhasil</td></tr><tr><td>Jenis Transaksi</td><td>:</td><td>Pembayaran QRIS</td></tr><tr><td>Nama Merchant</td><td>:</td><td>KOPI JAGO SENOPATI</td></tr><tr><td>Total Bayar</td><td>:</td><td>IDR 20,000.00</td></tr></table>'
  const p = parseBankMail({ from: 'BCA <noreply@bca.co.id>', subject: 'Transaksi Berhasil', text: htmlToText(html) })
  assert.deepEqual(p, { amount: 20000, kind: 'expense', merchant: 'KOPI JAGO SENOPATI', bank: 'BCA', what: 'Pembayaran QRIS' })
})

test('a Mandiri transfer with label and value on separate lines, fee included in the total', () => {
  const text = 'Transfer Berhasil\nPenerima\nAHMAD KOHAR\nBank BCA - 1234567890\nJumlah Transfer\nRp 100.000,00\nBiaya Admin\nRp 2.500,00\nTotal Transaksi\nRp 102.500,00'
  const p = parseBankMail({ from: 'Livin by Mandiri <noreply.livin@bankmandiri.co.id>', subject: 'Transfer Berhasil', text })
  assert.equal(p.amount, 102500)
  assert.equal(p.kind, 'expense')
  assert.equal(p.merchant, 'AHMAD KOHAR')
  assert.equal(p.bank, 'Mandiri')
})

test('money coming in is income', () => {
  const text = 'Anda menerima dana\nDari : PT MAGANG SEJAHTERA\nNominal : Rp 3.500.000'
  const p = parseBankMail({ from: 'notifikasi@bankmandiri.co.id', subject: 'Dana Masuk', text })
  assert.equal(p.kind, 'income')
  assert.equal(p.amount, 3500000)
  assert.equal(p.merchant, 'PT MAGANG SEJAHTERA')
})

test('promos, OTPs and unknown senders are ignored', () => {
  assert.equal(parseBankMail({ from: 'promo@bca.co.id', subject: 'Promo akhir tahun! Cashback s.d Rp 100.000', text: 'Rp 100.000' }), null)
  assert.equal(parseBankMail({ from: 'noreply@bca.co.id', subject: 'Kode OTP anda', text: 'Rp 0' }), null)
  assert.equal(parseBankMail({ from: 'toko@example.com', subject: 'Pembayaran berhasil', text: 'Total Rp 10.000' }), null)
})

test('rules match on merchant or description, case-insensitively', () => {
  const rules = [{ pattern: 'kopi jago', title: 'Kopi' }, { pattern: 'qris', title: 'Jajan' }]
  assert.equal(matchRule(rules, { merchant: 'KOPI JAGO SENOPATI', what: 'Pembayaran QRIS' }).title, 'Kopi')
  assert.equal(matchRule(rules, { merchant: 'WARUNG', what: 'Pembayaran QRIS' }).title, 'Jajan')
  assert.equal(matchRule(rules, { merchant: 'X', what: 'Transfer' }), undefined)
})

test('real Mandiri QRIS layout: the shop is under "Penerima", not "Merchant PAN"', () => {
  const text = "Livin' by Mandiri\nPembayaran Berhasil\nHalo MUHAMMAD ZAIDAN,\nBerikut adalah detail transaksi Anda dengan QR:\nPenerima\nWarung Mang Udin\nKota Bekasi - ID\nTanggal 27 Nov 2026\nNominal Transaksi Rp 28.500,00\nNo. Referensi 123456789012\nMerchant PAN 9360091537400954095\nCustomer PAN 9360000812345678"
  const p = parseBankMail({ from: "Livin' <noreply.livin@bankmandiri.co.id>", subject: 'Pembayaran Berhasil!', text })
  assert.equal(p.merchant, 'Warung Mang Udin')
  assert.equal(p.amount, 28500)
})

test('real BCA layout (English, colon on its own line); a transfer to yourself is skipped', () => {
  const text = (name) => `Hello MUHAMMAD ZAIDAN,\nYou just made a transaction through myBCA.\nStatus\n:\nSuccessful\nTransfer Type\n:\nTransfer to BANK MANDIRI\nBeneficiary Name\n:\n${name}\nAmount\n:\nIDR 30,600.00`
  assert.equal(parseBankMail({ from: 'BCA <bca@bca.co.id>', subject: 'Internet Transaction Journal', text: text('MUHAMMAD ZAIDAN') }), null)
  const p = parseBankMail({ from: 'BCA <bca@bca.co.id>', subject: 'Internet Transaction Journal', text: text('TOKO SINAR') })
  assert.deepEqual([p.merchant, p.amount, p.what], ['TOKO SINAR', 30600, 'Transfer to BANK MANDIRI'])
})

test('announcements and marketplace order updates are not transactions', () => {
  assert.equal(parseBankMail({ from: 'Jago <info@jago.com>', subject: 'Informasi optimalisasi sistem', text: 'Transaksi menggunakan QRIS dan Debit Card Jago di atas Rp5 juta.' }), null)
  assert.equal(parseBankMail({ from: 'Shopee <info@mail.shopee.co.id>', subject: 'Lihat hasil untuk permintaan 2610060VAW8NCST', text: 'Pengembalian Dana sebesar Rp 950,875.' }), null)
})

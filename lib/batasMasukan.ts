/**
 * Batas atas masukan pengguna, dipakai route API, Server Action, dan form.
 * Tanpa impor apa pun supaya aman dimuat komponen klien untuk `maxLength`.
 *
 * Sebelumnya angka hanya diperiksa `> 0` dan teks hanya "tidak kosong".
 * Harga 1e308 lolos lalu tampil sebagai HPP "Rp ∞" dan merusak rata-rata
 * margin di dashboard, dan nama 200.000 karakter ikut tersimpan.
 *
 * Angkanya sengaja longgar: cukup untuk usaha kuliner terbesar sekalipun,
 * tetapi jauh di bawah titik angka mulai rusak saat dikalikan dan dijumlah.
 */
export const BATAS_MASUKAN = {
  /** Nama bahan, produk, biaya, usaha, dan pemilik. */
  panjangNama: 100,
  panjangSatuan: 20,
  panjangKategori: 50,
  /** Batas alamat email menurut RFC 5321. */
  panjangEmail: 254,
  /**
   * bcrypt hanya membaca 72 byte pertama. Kata sandi yang lebih panjang
   * dipotong diam-diam, jadi dua kata sandi berbeda bisa dianggap sama.
   */
  byteKataSandi: 72,
  /** Rupiah: harga bahan per satuan, harga jual, dan biaya tetap per bulan. */
  rupiah: 1_000_000_000,
  /** Takaran satu bahan untuk satu porsi, dalam satuan bahannya. */
  takaran: 100_000,
  /** Jumlah bahan dalam satu resep. */
  barisResep: 50,
  /** Porsi dalam sekali produksi (mode takaran sekali produksi). */
  porsiProduksi: 100_000,
  estimasiPorsiPerBulan: 10_000_000,
} as const

function ribuan(angka: number): string {
  return angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/** Pesan galat kalau teks (setelah di-trim) melebihi `maks`, selain itu null. */
export function periksaPanjang(teks: string, label: string, maks: number): string | null {
  return teks.trim().length > maks ? `${label} paling banyak ${maks} karakter` : null
}

/** Pesan galat kalau angka melebihi `maks`, selain itu null. */
export function periksaMaksimum(angka: number, label: string, maks: number): string | null {
  return angka > maks ? `${label} paling besar ${ribuan(maks)}` : null
}

/** Panjang kata sandi dalam byte UTF-8, satuan yang dibaca bcrypt. */
export function byteUtf8(teks: string): number {
  return new TextEncoder().encode(teks).length
}

/**
 * Server Action bisa dipanggil lewat POST buatan, jadi tipe TypeScript-nya
 * tidak menjamin apa-apa saat runtime. Dua pembaca ini mengubah nilai yang
 * salah tipe jadi nilai yang pasti ditolak validasi berikutnya, bukan
 * exception seperti `masukan.nama.trim is not a function`.
 */
export function bacaTeks(nilai: unknown): string {
  return typeof nilai === 'string' ? nilai.trim() : ''
}

export function bacaAngka(nilai: unknown): number {
  return typeof nilai === 'number' ? nilai : Number.NaN
}

export function isObjek(nilai: unknown): nilai is Record<string, unknown> {
  return typeof nilai === 'object' && nilai !== null && !Array.isArray(nilai)
}

/** Id baris database: bilangan bulat positif. Sama dengan `parseId` di route. */
export function isIdSah(nilai: unknown): nilai is number {
  return typeof nilai === 'number' && Number.isSafeInteger(nilai) && nilai > 0
}

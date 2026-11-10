/**
 * Halaman tujuan setelah login berhasil. Tanpa impor apa pun supaya aman
 * dimuat komponen klien.
 */

export const TUJUAN_BAWAAN = '/dashboard'

/**
 * Asal tiruan untuk mengurai jalur relatif. Domain `.invalid` tidak pernah bisa
 * didaftarkan, jadi asal hasil urai hanya sama dengan ini kalau jalurnya
 * memang tetap di aplikasi ini.
 */
const ASAL_TIRUAN = 'http://ruang-margin.invalid'

/**
 * Ubah `callbackUrl` dari query string jadi jalur internal yang aman.
 *
 * `callbackUrl` bisa diisi siapa saja lewat tautan, jadi tanpa penyaring ini
 * `/login?callbackUrl=https://situs-palsu.example` membawa pengguna ke situs
 * luar tepat setelah ia memasukkan kata sandinya.
 *
 * Memeriksa awalan "/" dan bukan "//" saja tidak cukup: browser membaca
 * `/\situs.example` dan `/<tab>/situs.example` sebagai `//situs.example`.
 * Karena itu jalurnya diurai seperti browser mengurainya, lalu ditolak kalau
 * asalnya berpindah. Yang dikembalikan adalah hasil urai itu, bukan teks
 * mentahnya, supaya yang diperiksa dan yang dipakai selalu sama.
 */
export function tujuanSetelahMasuk(mentah: string | null | undefined): string {
  if (!mentah || !mentah.startsWith('/')) return TUJUAN_BAWAAN

  let url: URL
  try {
    url = new URL(mentah, ASAL_TIRUAN)
  } catch {
    return TUJUAN_BAWAAN
  }
  if (url.origin !== ASAL_TIRUAN) return TUJUAN_BAWAAN

  return `${url.pathname}${url.search}${url.hash}`
}

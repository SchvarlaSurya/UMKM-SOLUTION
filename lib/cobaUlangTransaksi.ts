/**
 * Coba ulang ringan untuk transaksi Prisma yang gagal karena P2028.
 *
 * Batas bawaan di lib/prisma.ts (maxWait 10 s, timeout 20 s) mencegah
 * sebagian besar P2028, tetapi pooler Supabase masih bisa tersendat sesaat.
 * Terukur 30 September 2026, P2028 muncul dalam dua bentuk:
 *
 * - "Unable to start a transaction in the given time": maxWait habis sebelum
 *   transaksi dimulai, karena pool harus membuka koneksi baru. Percobaan
 *   berikutnya lolos begitu koneksinya sudah terbuka.
 * - "A commit cannot be executed on an expired transaction": pekerjaan di
 *   dalam transaksi melewati `timeout`.
 *
 * Keduanya berarti transaksinya sudah di-rollback utuh, jadi menjalankan ulang
 * seluruh transaksi aman. Galat lain (target margin yang tidak sah, data
 * tidak ditemukan) tidak dicoba ulang: hasilnya akan sama saja.
 *
 * Sengaja tetap sinkron di dalam request yang sama. Tidak ada antrean atau
 * worker: aplikasi berjalan sebagai satu proses.
 */

export const KODE_TIMEOUT_TRANSAKSI = 'P2028'

export function isTimeoutTransaksi(galat: unknown): boolean {
  return (
    typeof galat === 'object' &&
    galat !== null &&
    'code' in galat &&
    galat.code === KODE_TIMEOUT_TRANSAKSI
  )
}

export type OpsiCobaUlang = {
  /** Termasuk percobaan pertama. */
  maksPercobaan?: number
  /** Jeda sebelum percobaan kedua; berlipat dua tiap percobaan berikutnya. */
  jedaAwalMs?: number
  /** Diganti di tes supaya tidak benar-benar menunggu. */
  tunggu?: (ms: number) => Promise<void>
}

const tidur = (ms: number) => new Promise<void>((selesai) => setTimeout(selesai, ms))

/**
 * Jalankan `jalankan`, ulangi hanya kalau gagal P2028. Bawaan 3 percobaan
 * dengan jeda 500 ms lalu 1000 ms. Kalau semuanya gagal, galat terakhir
 * dilempar apa adanya.
 *
 * `jalankan` harus membuka transaksinya sendiri, misalnya
 * `() => prisma.$transaction(async (tx) => ...)`, supaya setiap percobaan
 * mengulang seluruh unit kerja, bukan melanjutkan transaksi yang sudah batal.
 */
export async function cobaUlangSaatTimeout<T>(
  jalankan: () => Promise<T>,
  { maksPercobaan = 3, jedaAwalMs = 500, tunggu = tidur }: OpsiCobaUlang = {}
): Promise<T> {
  for (let percobaan = 1; ; percobaan++) {
    try {
      return await jalankan()
    } catch (galat) {
      if (!isTimeoutTransaksi(galat) || percobaan >= maksPercobaan) throw galat
      await tunggu(jedaAwalMs * 2 ** (percobaan - 1))
    }
  }
}

import { PrismaClient } from '@/app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const produksi = process.env.NODE_ENV === "production"

/**
 * Supabase punya dua pooler dan keduanya berperilaku sangat berbeda:
 *
 * - Session mode (port 5432) memegang satu koneksi Postgres selama klien
 *   terhubung, dan kuotanya kecil: 15 koneksi untuk SELURUH proyek, dibagi
 *   semua anggota tim. Begitu tiga dev server sama-sama menahan lima koneksi,
 *   proses berikutnya ditolak "(EMAXCONNSESSION) max clients reached".
 * - Transaction mode (port 6543, biasanya dengan `?pgbouncer=true`) memulangkan
 *   koneksi ke pooler setiap transaksi selesai, jadi jauh lebih banyak klien
 *   muat dan menahan koneksi menganggur tidak lagi merugikan orang lain.
 *
 * Batas pool di bawah menyesuaikan mode yang sedang dipakai, dan bisa ditimpa
 * lewat env supaya tiap anggota tim bisa mengalah tanpa mengubah kode.
 */
function modeTransaksi(url: string | undefined): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.port === "6543" || parsed.searchParams.get("pgbouncer") === "true"
  } catch {
    return false
  }
}

/** Angka dari env kalau ada dan masuk akal; selain itu pakai bawaan. */
function angkaEnv(nama: string, bawaan: number): number {
  const mentah = process.env[nama]
  if (mentah === undefined) return bawaan
  const nilai = Number(mentah)
  return Number.isSafeInteger(nilai) && nilai >= 0 ? nilai : bawaan
}

const prismaClientSingleton = () => {
  const transaksi = modeTransaksi(process.env.DATABASE_URL)

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    // Session mode: kuota 15 dibagi seluruh tim, jadi max 5 menyisakan ruang
    // untuk dua orang lain. Harganya terukur: render Dashboard (~8 query
    // paralel) dan Produk (~7) melebihi 5 koneksi, jadi sebagian query antre
    // sekitar satu round trip. Halaman lain muat dalam 5 dan tidak terpengaruh.
    //
    // Transaction mode: koneksi dipulangkan tiap transaksi selesai, jadi pool
    // yang lebih longgar tidak memakan jatah orang lain.
    //
    // Nilai produksi sengaja belum diubah: angka amannya bergantung pada
    // target hosting (satu server Node vs banyak instance serverless).
    max: angkaEnv("PRISMA_POOL_MAX", transaksi ? 10 : 5),
    // `min` di pg-pool tidak membuka koneksi di muka; ia mencegah koneksi yang
    // sudah terbuka ditutup idle timeout. Membuka koneksi baru ke pooler
    // Supabase butuh ~2 detik, jadi di dev dua koneksi hangat ditahan.
    //
    // Di session mode, koneksi yang ditahan itu benar-benar mengurangi jatah
    // anggota tim lain meski dev server sedang menganggur. Kalau kuotanya
    // sedang sesak, PRISMA_POOL_MIN=0 melepasnya dengan menukar ~2 detik pada
    // permintaan pertama.
    min: angkaEnv("PRISMA_POOL_MIN", produksi ? 1 : 2),
    idleTimeoutMillis: 300_000,
    connectionTimeoutMillis: 10_000,
    // Tanpa keepalive, koneksi yang menganggur diputus pihak lain (pooler
    // Supabase/NAT) dalam kurang dari 7 menit. Pool tetap menganggapnya sehat,
    // jadi query berikutnya menggantung 12-25 detik lalu gagal "Connection
    // terminated unexpectedly", dan halaman tertahan di "Rendering...".
    // Terukur ke database ini: koneksi idle 7 dan 15 menit tanpa keepalive
    // gagal ECONNRESET; dengan keepalive keduanya tetap bisa dipakai.
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
  })

  return new PrismaClient({ adapter })
}

declare global {
  var prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined
}

/**
 * Satu instance untuk seluruh proses. Disimpan di globalThis supaya hot reload
 * dev tidak membuat pool baru tiap modul ini dimuat ulang — itu jalur paling
 * cepat menghabiskan kuota pooler.
 */
export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma

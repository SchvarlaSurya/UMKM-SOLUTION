import { PrismaClient } from '@/app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const produksi = process.env.NODE_ENV === "production"

const prismaClientSingleton = () => {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    // Database dev dipakai bersama 3 anggota tim, dan Supabase Session Pooler
    // hanya menerima 15 koneksi untuk SEMUA proses. max 5 per dev server
    // menyisakan ruang kalau beberapa orang menjalankan dev bersamaan.
    //
    // Harganya terukur: render Dashboard (~8 query paralel) dan Produk (~7)
    // melebihi 5 koneksi, jadi sebagian query antre sekitar satu round trip.
    // Halaman lain muat dalam 5 koneksi dan tidak terpengaruh.
    //
    // Nilai produksi sengaja belum diubah: angka amannya bergantung pada
    // target hosting (satu server Node vs banyak instance serverless).
    max: 5,
    // `min` di pg-pool tidak membuka koneksi di muka; ia mencegah koneksi yang
    // sudah terbuka ditutup idle timeout. Membuka koneksi baru ke pooler
    // Supabase butuh ~2 detik, jadi di dev dua koneksi hangat ditahan.
    min: produksi ? 1 : 2,
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

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma

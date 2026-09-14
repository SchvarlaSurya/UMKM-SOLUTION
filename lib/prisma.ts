import { PrismaClient } from '@/app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const produksi = process.env.NODE_ENV === "production"

const prismaClientSingleton = () => {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    // Satu render dashboard menjalankan ~7 query paralel (page + layout +
    // notifikasi). Dengan max 3, sebagian antre menunggu koneksi kosong.
    // Nilai produksi sengaja belum diubah: angka amannya bergantung pada
    // target hosting (satu server Node vs banyak instance serverless).
    max: produksi ? 5 : 8,
    // `min` di pg-pool tidak membuka koneksi di muka; ia mencegah koneksi yang
    // sudah terbuka ditutup idle timeout. Membuka koneksi baru ke pooler
    // Supabase butuh ~2 detik, jadi di dev koneksi hangat ditahan.
    min: produksi ? 1 : 4,
    idleTimeoutMillis: 300_000,
    connectionTimeoutMillis: 10_000,
  })
  return new PrismaClient({ adapter })
}

declare global {
  var prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma

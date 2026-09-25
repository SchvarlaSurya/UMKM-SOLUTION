import type { PrismaClient, User } from '@/app/generated/prisma/client'

/**
 * Bentuk baku email yang disimpan dan dicari: tanpa spasi di tepi, huruf kecil.
 *
 * Pendaftaran dan login wajib memakai fungsi yang sama. Kalau tidak, akun yang
 * disimpan sebagai "budi@mail.com" gagal masuk saat diketik "Budi@mail.com".
 */
export function normalisasiEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Cari pengguna lewat email tanpa peduli huruf besar-kecil.
 *
 * Sengaja SQL mentah dengan `lower(email) = $1`, bukan
 * `{ equals, mode: 'insensitive' }`: Prisma menerjemahkan yang terakhir ke
 * ILIKE, sehingga `%` dan `_` di email menjadi wildcard — email "%" cocok
 * dengan akun mana pun. Nilai di sini dikirim sebagai parameter dan
 * dibandingkan persis.
 *
 * `lower(email)` menjangkau akun yang mendaftar sebelum 10 September 2026,
 * sebelum email mulai dinormalisasi saat daftar, sehingga bisa tersimpan
 * dengan huruf besar. Bila ada dua akun yang hanya beda huruf, yang tersimpan
 * persis dalam bentuk baku didahulukan.
 *
 * Selalu tepat satu query, ada atau tidak akunnya, supaya waktu respons tidak
 * membocorkan email mana yang terdaftar.
 */
export async function cariUserLewatEmail(
  prisma: Pick<PrismaClient, '$queryRaw'>,
  email: string
): Promise<User | null> {
  const baku = normalisasiEmail(email)
  const hasil = await prisma.$queryRaw<User[]>`
    SELECT id, email, password, nama, "createdAt"
    FROM "User"
    WHERE lower(email) = ${baku}
    ORDER BY (email = ${baku}) DESC, id ASC
    LIMIT 1
  `
  return hasil[0] ?? null
}

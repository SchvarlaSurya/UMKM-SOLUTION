import type { PrismaClient } from '@/app/generated/prisma/client'

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
 * Bentuk baku dicoba dulu karena memakai indeks unik. Pencarian tidak peka
 * huruf hanya cadangan untuk akun yang mendaftar sebelum 10 September 2026,
 * sebelum email mulai dinormalisasi saat daftar, sehingga bisa tersimpan
 * dengan huruf besar.
 */
export async function cariUserLewatEmail(
  prisma: Pick<PrismaClient, 'user'>,
  email: string
) {
  const baku = normalisasiEmail(email)
  return (
    (await prisma.user.findUnique({ where: { email: baku } })) ??
    (await prisma.user.findFirst({
      where: { email: { equals: baku, mode: 'insensitive' } },
      orderBy: { id: 'asc' },
    }))
  )
}

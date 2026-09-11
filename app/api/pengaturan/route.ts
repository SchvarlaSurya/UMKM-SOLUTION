import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { errorResponse, handleError, readJsonBody, unauthorizedResponse } from '@/lib/apiHelpers'

/**
 * Pengaturan bersifat singleton per akun: selalu ambil/buat baris milik user.
 * Route inilah yang bertugas membuat baris itu. `lib/hppCalculator.ts` sengaja
 * tidak melakukannya supaya endpoint HPP tetap nol write.
 */
async function getOrCreatePengaturan(userId: number) {
  return prisma.pengaturan.upsert({
    where: { userId },
    update: {},
    create: { userId },
    omit: { userId: true },
  })
}

export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.authorized) return unauthorizedResponse()

    const pengaturan = await getOrCreatePengaturan(auth.userId)
    return NextResponse.json(pengaturan)
  } catch (error) {
    return handleError(error, 'Gagal mengambil pengaturan')
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAuth()
    if (!auth.authorized) return unauthorizedResponse()

    const parsed = await readJsonBody(req)
    if (!parsed.ok) return errorResponse('Body request harus JSON yang valid', 400)
    const { estimasiPorsiPerBulan, batasMarginAman } = parsed.body

    // Porsi dipakai sebagai pembagi alokasi biaya tetap, jadi harus bilangan
    // bulat lebih dari 0. Cek tipe juga, supaya "1200" ditolak di sini dan
    // bukan jadi error Prisma.
    if (
      typeof estimasiPorsiPerBulan !== 'number' ||
      !Number.isSafeInteger(estimasiPorsiPerBulan) ||
      estimasiPorsiPerBulan <= 0
    ) {
      return errorResponse('Estimasi porsi per bulan harus bilangan bulat lebih dari 0', 400)
    }
    if (
      typeof batasMarginAman !== 'number' ||
      !Number.isFinite(batasMarginAman) ||
      batasMarginAman < 0 ||
      batasMarginAman > 100
    ) {
      return errorResponse('Batas margin aman harus angka antara 0 sampai 100', 400)
    }

    const existing = await getOrCreatePengaturan(auth.userId)
    const updated = await prisma.pengaturan.update({
      where: { id: existing.id, userId: auth.userId },
      data: { estimasiPorsiPerBulan, batasMarginAman },
      omit: { userId: true },
    })
    return NextResponse.json(updated)
  } catch (error) {
    return handleError(error, 'Gagal mengubah pengaturan')
  }
}

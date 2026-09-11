import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { errorResponse, handleError, readJsonBody, unauthorizedResponse } from '@/lib/apiHelpers'

/**
 * Pengaturan bersifat singleton: selalu ambil/buat baris pertama.
 * Route inilah yang bertugas membuat baris itu. `lib/hppCalculator.ts` sengaja
 * tidak melakukannya supaya endpoint HPP tetap nol write.
 */
async function getOrCreatePengaturan() {
  const pengaturan = await prisma.pengaturan.findFirst()
  if (pengaturan) return pengaturan
  return prisma.pengaturan.create({ data: {} })
}

export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.authorized) return unauthorizedResponse()

    const pengaturan = await getOrCreatePengaturan()
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

    const existing = await getOrCreatePengaturan()
    const updated = await prisma.pengaturan.update({
      where: { id: existing.id },
      data: { estimasiPorsiPerBulan, batasMarginAman },
    })
    return NextResponse.json(updated)
  } catch (error) {
    return handleError(error, 'Gagal mengubah pengaturan')
  }
}

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  errorResponse,
  handleError,
  unauthorizedResponse,
} from '@/lib/apiHelpers'

export async function GET(req: Request) {
  try {
    const auth = await requireAuth()
    if (!auth.authorized) return unauthorizedResponse()

    const belumDibacaParam = new URL(req.url).searchParams.get('belumDibaca')
    if (
      belumDibacaParam !== null &&
      belumDibacaParam !== 'true' &&
      belumDibacaParam !== 'false'
    ) {
      return errorResponse('Parameter belumDibaca harus "true" atau "false"', 400)
    }

    const notifikasi = await prisma.notifikasi.findMany({
      where: {
        userId: auth.userId,
        ...(belumDibacaParam === 'true' ? { sudahDibaca: false } : {}),
      },
      omit: { userId: true },
      orderBy: { tanggal: 'desc' },
    })

    return NextResponse.json(notifikasi)
  } catch (error) {
    return handleError(error, 'Gagal mengambil notifikasi')
  }
}

export async function PATCH() {
  try {
    const auth = await requireAuth()
    if (!auth.authorized) return unauthorizedResponse()

    const hasil = await prisma.notifikasi.updateMany({
      where: { userId: auth.userId, sudahDibaca: false },
      data: { sudahDibaca: true },
    })

    return NextResponse.json({ success: true, jumlahDiperbarui: hasil.count })
  } catch (error) {
    return handleError(error, 'Gagal menandai semua notifikasi sudah dibaca')
  }
}

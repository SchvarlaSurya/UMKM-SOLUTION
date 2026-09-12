import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  errorResponse,
  handleError,
  parseId,
  unauthorizedResponse,
} from '@/lib/apiHelpers'

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (!auth.authorized) return unauthorizedResponse()

    const { id: idParam } = await params
    const id = parseId(idParam)
    if (id === null) return errorResponse('ID notifikasi tidak valid', 400)

    const existing = await prisma.notifikasi.findFirst({
      where: { id, userId: auth.userId },
      select: { id: true },
    })
    if (!existing) return errorResponse('Notifikasi tidak ditemukan', 404)

    const notifikasi = await prisma.notifikasi.update({
      where: { id, userId: auth.userId },
      data: { sudahDibaca: true },
      omit: { userId: true },
    })

    return NextResponse.json(notifikasi)
  } catch (error) {
    return handleError(error, 'Gagal menandai notifikasi sudah dibaca')
  }
}

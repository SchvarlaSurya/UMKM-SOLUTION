import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  errorResponse,
  handleError,
  parseId,
  unauthorizedResponse,
} from '@/lib/apiHelpers'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (!auth.authorized) return unauthorizedResponse()

    const { id: idParam } = await params
    const id = parseId(idParam)
    if (id === null) return errorResponse('ID produk tidak valid', 400)

    const produk = await prisma.produk.findFirst({
      where: { id, userId: auth.userId },
      select: { id: true },
    })
    if (!produk) return errorResponse('Produk tidak ditemukan', 404)

    const histori = await prisma.historiHargaJual.findMany({
      where: { produkId: id, produk: { userId: auth.userId } },
      orderBy: { tanggal: 'desc' },
    })

    return NextResponse.json(histori)
  } catch (error) {
    return handleError(error, 'Gagal mengambil histori harga jual')
  }
}

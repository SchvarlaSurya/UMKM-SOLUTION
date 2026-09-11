import { calculateHpp } from '@/lib/hppCalculator'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { errorResponse, handleError, parseId, unauthorizedResponse } from '@/lib/apiHelpers'

/** Read-only: tidak menulis HppSnapshot. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (!auth.authorized) return unauthorizedResponse()

    const { id: idParam } = await params
    const id = parseId(idParam)
    if (id === null) return errorResponse('ID produk tidak valid', 400)

    const { searchParams } = new URL(req.url)
    const thresholdParam = searchParams.get('threshold')
    let thresholdOverride: number | undefined
    if (thresholdParam !== null) {
      const angka = Number(thresholdParam)
      if (!Number.isFinite(angka) || angka < 0) {
        return errorResponse('Parameter threshold harus angka >= 0', 400)
      }
      thresholdOverride = angka
    }

    const produk = await prisma.produk.findFirst({
      where: { id, userId: auth.userId },
      select: { id: true },
    })
    if (!produk) return errorResponse('Produk tidak ditemukan', 404)

    const result = await calculateHpp(id, auth.userId, { thresholdOverride })
    return NextResponse.json(result)
  } catch (error) {
    return handleError(error, 'Gagal menghitung HPP produk')
  }
}

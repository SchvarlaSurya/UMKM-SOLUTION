import { calculateAllHpp } from '@/lib/hppCalculator'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { errorResponse, handleError, unauthorizedResponse } from '@/lib/apiHelpers'

/** Read-only: tidak menulis HppSnapshot, aman dipanggil tiap kali dashboard dibuka. */
export async function GET(req: Request) {
  try {
    const auth = await requireAuth()
    if (!auth.authorized) return unauthorizedResponse()

    const { searchParams } = new URL(req.url)
    const thresholdParam = searchParams.get('threshold')
    let threshold: number | undefined
    if (thresholdParam !== null) {
      const angka = Number(thresholdParam)
      if (!Number.isFinite(angka) || angka < 0) {
        return errorResponse('Parameter threshold harus angka >= 0', 400)
      }
      threshold = angka
    }

    const hasil = await calculateAllHpp(threshold)
    return NextResponse.json(hasil)
  } catch (error) {
    return handleError(error, 'Gagal menghitung HPP semua produk')
  }
}

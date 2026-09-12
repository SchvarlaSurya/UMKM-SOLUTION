import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import {
  errorResponse,
  handleError,
  readJsonBody,
  unauthorizedResponse,
} from '@/lib/apiHelpers'
import {
  calculateHargaJualTargetMarginDariResep,
  isTargetMarginPersen,
  PerhitunganHargaTargetError,
} from '@/lib/hppCalculator'
import { validasiResep } from '@/lib/validasiResep'

export async function POST(req: Request) {
  try {
    const auth = await requireAuth()
    if (!auth.authorized) return unauthorizedResponse()

    const parsed = await readJsonBody(req)
    if (!parsed.ok) return errorResponse('Body request harus JSON yang valid', 400)

    const { resep, targetMarginPersen } = parsed.body
    if (!isTargetMarginPersen(targetMarginPersen)) {
      return errorResponse('Target margin harus angka antara 0 sampai 80 persen', 400)
    }

    const cekResep = validasiResep(resep)
    if (!cekResep.ok) return errorResponse(cekResep.error, 400)

    const hasil = await calculateHargaJualTargetMarginDariResep(
      cekResep.data,
      auth.userId,
      targetMarginPersen
    )

    return NextResponse.json({ ...hasil, targetMarginPersen })
  } catch (error) {
    if (error instanceof PerhitunganHargaTargetError) {
      return errorResponse(error.message, 400)
    }
    return handleError(error, 'Gagal menyimulasikan harga jual')
  }
}

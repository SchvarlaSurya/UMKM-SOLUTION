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
import { isPembulatanHarga } from '@/lib/hpp'
import { validasiResep } from '@/lib/validasiResep'

export async function POST(req: Request) {
  try {
    const auth = await requireAuth()
    if (!auth.authorized) return unauthorizedResponse()

    const parsed = await readJsonBody(req)
    if (!parsed.ok) return errorResponse('Body request harus JSON yang valid', 400)

    const { resep, targetMarginPersen, pembulatanHarga } = parsed.body
    if (!isTargetMarginPersen(targetMarginPersen)) {
      return errorResponse('Target margin harus angka antara 0 sampai 80 persen', 400)
    }
    const pembulatan = pembulatanHarga ?? 0
    if (!isPembulatanHarga(pembulatan)) {
      return errorResponse('Pembulatan harga harus 0, 100, 500, atau 1000', 400)
    }

    const cekResep = validasiResep(resep)
    if (!cekResep.ok) return errorResponse(cekResep.error, 400)

    // Pratinjau memakai jalur hitung yang sama dengan penyimpanan, jadi angka
    // yang dilihat pemilik sebelum menyimpan sama dengan yang tersimpan.
    const hasil = await calculateHargaJualTargetMarginDariResep(
      cekResep.data,
      auth.userId,
      targetMarginPersen,
      undefined,
      pembulatan
    )

    return NextResponse.json({ ...hasil, targetMarginPersen })
  } catch (error) {
    if (error instanceof PerhitunganHargaTargetError) {
      return errorResponse(error.message, 400)
    }
    return handleError(error, 'Gagal menyimulasikan harga jual')
  }
}

import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getKonteksBiaya } from '@/lib/hppCalculator'
import {
  hitungDampakKenaikan,
  hitungHargaHipotetis,
  isPersenKenaikan,
  PERSEN_KENAIKAN_MAKSIMUM,
  type HasilSimulasiKenaikan,
} from '@/lib/simulasiKenaikan'
import {
  errorResponse,
  handleError,
  parseId,
  readJsonBody,
  unauthorizedResponse,
} from '@/lib/apiHelpers'

/**
 * POST /api/bahan-baku/[id]/simulasi-kenaikan
 * Body: { persenKenaikan: number } — misal 20 untuk kenaikan 20%.
 *
 * READ-ONLY. Memakai POST hanya karena menerima masukan; tidak ada satu pun
 * penulisan ke database, dan tidak ada permintaan ke layanan luar. Semua data
 * dibatasi ke user yang sedang masuk.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (!auth.authorized) return unauthorizedResponse()

    const { id: idParam } = await params
    const id = parseId(idParam)
    if (id === null) return errorResponse('ID bahan baku tidak valid', 400)

    const parsed = await readJsonBody(req)
    if (!parsed.ok) return errorResponse('Body request harus JSON yang valid', 400)
    const { persenKenaikan } = parsed.body
    if (!isPersenKenaikan(persenKenaikan)) {
      return errorResponse(
        `Persentase kenaikan harus angka lebih dari 0 dan paling banyak ${PERSEN_KENAIKAN_MAKSIMUM}`,
        400
      )
    }

    // Bahan milik user lain diperlakukan sama dengan bahan yang tidak ada.
    const bahan = await prisma.bahanBaku.findFirst({
      where: { id, userId: auth.userId },
      select: { id: true, nama: true, satuan: true, hargaPerSatuan: true },
    })
    if (!bahan) return errorResponse('Bahan baku tidak ditemukan', 404)

    const [produk, konteks] = await Promise.all([
      prisma.produk.findMany({
        where: {
          userId: auth.userId,
          resep: { some: { bahanBakuId: id } },
        },
        orderBy: { nama: 'asc' },
        select: {
          id: true,
          nama: true,
          kategori: true,
          hargaJual: true,
          modePenentuanHarga: true,
          targetMarginPersen: true,
          pembulatanHarga: true,
          resep: {
            where: { bahanBaku: { userId: auth.userId } },
            select: {
              bahanBakuId: true,
              jumlahDipakai: true,
              bahanBaku: { select: { hargaPerSatuan: true } },
            },
          },
        },
      }),
      getKonteksBiaya(auth.userId),
    ])

    const hargaHipotetis = hitungHargaHipotetis(bahan.hargaPerSatuan, persenKenaikan)

    const hasil: HasilSimulasiKenaikan = {
      bahanBaku: {
        id: bahan.id,
        nama: bahan.nama,
        satuan: bahan.satuan,
        hargaSekarang: bahan.hargaPerSatuan,
        hargaHipotetis,
      },
      persenKenaikan,
      batasMarginAman: konteks.pengaturan.batasMarginAman,
      produk: hitungDampakKenaikan({
        produk,
        bahanBakuId: id,
        hargaHipotetis,
        komponen: konteks.komponen,
        batasMarginAman: konteks.pengaturan.batasMarginAman,
      }),
    }

    return NextResponse.json(hasil)
  } catch (error) {
    return handleError(error, 'Gagal menghitung simulasi kenaikan')
  }
}

import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { analyzePriceTrend, type TrendResult } from '@/lib/trendAnalyzer'
import { errorResponse, handleError, parseId, unauthorizedResponse } from '@/lib/apiHelpers'

const KONTEKS = 'Gagal mengambil histori harga'

/**
 * GET /api/bahan-baku/[id]/histori
 * Read-only. Urut tanggal naik (paling lama dulu) supaya langsung bisa dipakai
 * sebagai deret grafik. `delta` sudah dihitung di sini agar frontend tidak perlu.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (!auth.authorized) return unauthorizedResponse()

    const { id: idParam } = await params
    const id = parseId(idParam)
    if (id === null) return errorResponse('ID bahan baku tidak valid', 400)

    const bahan = await prisma.bahanBaku.findFirst({ where: { id, userId: auth.userId } })
    if (!bahan) return errorResponse('Bahan baku tidak ditemukan', 404)

    const histori = await prisma.historiHarga.findMany({
      where: { bahanBakuId: id },
      orderBy: [{ tanggal: 'asc' }, { id: 'asc' }],
    })

    const tren = analisaTren(id, histori)

    return NextResponse.json({
      bahanBaku: {
        id: bahan.id,
        nama: bahan.nama,
        satuan: bahan.satuan,
        hargaPerSatuan: bahan.hargaPerSatuan,
      },
      histori: histori.map((h) => ({
        id: h.id,
        bahanBakuId: h.bahanBakuId,
        hargaLama: h.hargaLama,
        hargaBaru: h.hargaBaru,
        delta: h.hargaBaru - h.hargaLama,
        tanggal: h.tanggal,
      })),
      trenNaik: tren.trenNaik,
      statusTren: tren.status,
      jumlahPerubahanDiperiksa: tren.jumlahPerubahanDiperiksa,
    })
  } catch (error) {
    return handleError(error, KONTEKS)
  }
}

/**
 * `analyzePriceTrend` melempar kalau ada baris histori yang tidak valid
 * (harga <= 0, id duplikat). Itu masalah data, bukan alasan membuat seluruh
 * endpoint gagal, jadi turunkan saja ke "data_belum_cukup".
 */
function analisaTren(
  bahanBakuId: number,
  histori: readonly { id: number; bahanBakuId: number; hargaLama: number; hargaBaru: number; tanggal: Date }[]
): TrendResult {
  try {
    return analyzePriceTrend(bahanBakuId, histori)
  } catch (error) {
    console.error(`[api] histori harga bahan ${bahanBakuId} tidak bisa dianalisa:`, error)
    return {
      bahanBakuId,
      status: 'data_belum_cukup',
      trenNaik: false,
      jumlahPerubahanDiperiksa: 0,
    }
  }
}

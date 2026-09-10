import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { recalculateAllAffectedByBahan } from '@/lib/hppCalculator'
import { requireAuth } from '@/lib/auth'
import {
  errorResponse,
  handleError,
  isAngkaPositif,
  isTeksTerisi,
  parseId,
  readJsonBody,
  unauthorizedResponse,
} from '@/lib/apiHelpers'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (!auth.authorized) return unauthorizedResponse()

    const { id: idParam } = await params
    const id = parseId(idParam)
    if (id === null) return errorResponse('ID bahan baku tidak valid', 400)

    const bahan = await prisma.bahanBaku.findUnique({ where: { id } })
    if (!bahan) return errorResponse('Bahan baku tidak ditemukan', 404)

    return NextResponse.json(bahan)
  } catch (error) {
    return handleError(error, 'Gagal mengambil bahan baku')
  }
}

/**
 * Terima perubahan nama, satuan, dan/atau harga. Semua field opsional supaya
 * form edit bisa mengirim sebagian saja.
 *
 * HistoriHarga HANYA ditulis kalau `hargaPerSatuan` benar-benar berbeda dari
 * nilai sekarang. Edit nama/satuan saja tidak mengotori grafik tren harga.
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (!auth.authorized) return unauthorizedResponse()

    const { id: idParam } = await params
    const id = parseId(idParam)
    if (id === null) return errorResponse('ID bahan baku tidak valid', 400)

    const parsed = await readJsonBody(req)
    if (!parsed.ok) return errorResponse('Body request harus JSON yang valid', 400)
    const { nama, satuan, hargaPerSatuan } = parsed.body

    if (nama !== undefined && !isTeksTerisi(nama)) {
      return errorResponse('Nama bahan baku tidak boleh kosong', 400)
    }
    if (satuan !== undefined && !isTeksTerisi(satuan)) {
      return errorResponse('Satuan tidak boleh kosong', 400)
    }
    if (hargaPerSatuan !== undefined && !isAngkaPositif(hargaPerSatuan)) {
      return errorResponse('Harga per satuan harus angka lebih dari 0', 400)
    }
    if (nama === undefined && satuan === undefined && hargaPerSatuan === undefined) {
      return errorResponse('Tidak ada data yang diubah', 400)
    }

    const bahan = await prisma.bahanBaku.findUnique({ where: { id } })
    if (!bahan) return errorResponse('Bahan baku tidak ditemukan', 404)

    const hargaBerubah =
      hargaPerSatuan !== undefined && (hargaPerSatuan as number) !== bahan.hargaPerSatuan

    if (hargaBerubah) {
      await prisma.historiHarga.create({
        data: {
          bahanBakuId: id,
          hargaLama: bahan.hargaPerSatuan,
          hargaBaru: hargaPerSatuan as number,
        },
      })
    }

    const updated = await prisma.bahanBaku.update({
      where: { id },
      data: {
        ...(nama !== undefined ? { nama: (nama as string).trim() } : {}),
        ...(satuan !== undefined ? { satuan: (satuan as string).trim() } : {}),
        ...(hargaBerubah ? { hargaPerSatuan: hargaPerSatuan as number } : {}),
      },
    })

    // Snapshot HPP hanya perlu dicatat ulang kalau harga yang berubah.
    if (hargaBerubah) {
      await recalculateAllAffectedByBahan(id)
    }

    return NextResponse.json({ ...updated, hargaBerubah })
  } catch (error) {
    return handleError(error, 'Gagal mengubah bahan baku')
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (!auth.authorized) return unauthorizedResponse()

    const { id: idParam } = await params
    const id = parseId(idParam)
    if (id === null) return errorResponse('ID bahan baku tidak valid', 400)

    const bahan = await prisma.bahanBaku.findUnique({ where: { id } })
    if (!bahan) return errorResponse('Bahan baku tidak ditemukan', 404)

    // Tolak lebih awal dengan pesan jelas, jangan biarkan jadi error FK dari DB.
    const dipakai = await prisma.resep.findMany({
      where: { bahanBakuId: id },
      select: { produk: { select: { nama: true } } },
    })
    if (dipakai.length > 0) {
      const namaProduk = [...new Set(dipakai.map((r) => r.produk.nama))]
      return NextResponse.json(
        {
          error: `Bahan masih dipakai di ${namaProduk.length} produk`,
          produkTerkait: namaProduk,
        },
        { status: 400 }
      )
    }

    // Histori harga tidak punya onDelete cascade di schema, hapus manual dulu.
    await prisma.historiHarga.deleteMany({ where: { bahanBakuId: id } })
    await prisma.bahanBaku.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleError(error, 'Gagal menghapus bahan baku')
  }
}

import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { recalculateAllAffectedByBahan } from '@/lib/hppCalculator'
import { requireAuth } from '@/lib/auth'
import { rencanaHistoriHarga } from '@/lib/histori'
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

    const bahan = await prisma.bahanBaku.findFirst({
      where: { id, userId: auth.userId },
      omit: { userId: true },
    })
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
 * Setiap permintaan yang menyertakan `hargaPerSatuan` menulis satu baris
 * HistoriHarga, termasuk ketika nominalnya sama dengan harga sekarang:
 * menyimpan ulang harga yang sama berarti harganya sudah dicek dan ternyata
 * tetap, dan itu informasi yang layak ada di grafik tren.
 *
 * Edit nama atau satuan saja tidak menulis histori dan tidak memicu
 * perhitungan ulang HPP.
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

    const bahan = await prisma.bahanBaku.findFirst({ where: { id, userId: auth.userId } })
    if (!bahan) return errorResponse('Bahan baku tidak ditemukan', 404)

    const namaBersih = nama !== undefined ? (nama as string).trim() : undefined

    // Cek bentrok hanya kalau namanya memang berubah. `id: { not: id }` supaya
    // bahan ini boleh disimpan dengan namanya sendiri.
    if (namaBersih !== undefined && namaBersih.toLowerCase() !== bahan.nama.toLowerCase()) {
      const kembar = await prisma.bahanBaku.findFirst({
        where: {
          userId: auth.userId,
          nama: { equals: namaBersih, mode: 'insensitive' },
          id: { not: id },
        },
      })
      if (kembar) {
        return errorResponse(`Bahan dengan nama "${kembar.nama}" sudah ada`, 409)
      }
    }

    const rencana = rencanaHistoriHarga(
      bahan.hargaPerSatuan,
      hargaPerSatuan as number | undefined
    )

    if (rencana.catatHistori) {
      await prisma.historiHarga.create({
        data: {
          bahanBakuId: id,
          hargaLama: rencana.hargaLama,
          hargaBaru: rencana.hargaBaru,
        },
      })
    }

    const updated = await prisma.bahanBaku.update({
      where: { id, userId: auth.userId },
      data: {
        ...(namaBersih !== undefined ? { nama: namaBersih } : {}),
        ...(satuan !== undefined ? { satuan: (satuan as string).trim() } : {}),
        ...(rencana.hargaBerubah ? { hargaPerSatuan: rencana.hargaBaru } : {}),
      },
      omit: { userId: true },
    })

    // Nominal yang sama menghasilkan HPP yang sama, jadi tidak perlu dihitung
    // ulang meski historinya tetap dicatat.
    if (rencana.hargaBerubah) {
      await recalculateAllAffectedByBahan(id, auth.userId)
    }

    return NextResponse.json({
      ...updated,
      hargaBerubah: rencana.hargaBerubah,
      historiDicatat: rencana.catatHistori,
    })
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

    const bahan = await prisma.bahanBaku.findFirst({ where: { id, userId: auth.userId } })
    if (!bahan) return errorResponse('Bahan baku tidak ditemukan', 404)

    // Tolak lebih awal dengan pesan jelas, jangan biarkan jadi error foreign key.
    const dipakai = await prisma.resep.findMany({
      where: { bahanBakuId: id, produk: { userId: auth.userId } },
      select: { produk: { select: { nama: true } } },
    })
    if (dipakai.length > 0) {
      const namaProduk = [...new Set(dipakai.map((r) => r.produk.nama))]
      return NextResponse.json(
        {
          error: `Bahan masih dipakai di ${namaProduk.length} produk. Hapus dari resep dulu.`,
          produkTerkait: namaProduk,
        },
        { status: 400 }
      )
    }

    // HistoriHarga tidak punya onDelete cascade di schema, hapus manual dulu.
    await prisma.historiHarga.deleteMany({ where: { bahanBakuId: id } })
    await prisma.bahanBaku.delete({ where: { id, userId: auth.userId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleError(error, 'Gagal menghapus bahan baku')
  }
}

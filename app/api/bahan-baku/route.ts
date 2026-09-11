import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import {
  errorResponse,
  handleError,
  isAngkaPositif,
  isTeksTerisi,
  readJsonBody,
  unauthorizedResponse,
} from '@/lib/apiHelpers'

export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.authorized) return unauthorizedResponse()

    const data = await prisma.bahanBaku.findMany({
      orderBy: { nama: 'asc' },
      include: { _count: { select: { histori: true } } },
    })

    // `_count` diratakan jadi field biasa supaya frontend tidak perlu
    // memanggil endpoint histori satu per satu hanya untuk tahu bahan mana
    // yang punya catatan perubahan harga.
    const hasil = data.map((b) => ({
      id: b.id,
      nama: b.nama,
      satuan: b.satuan,
      hargaPerSatuan: b.hargaPerSatuan,
      updatedAt: b.updatedAt,
      jumlahHistori: b._count.histori,
      punyaHistori: b._count.histori > 0,
    }))

    return NextResponse.json(hasil)
  } catch (error) {
    return handleError(error, 'Gagal mengambil daftar bahan baku')
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth()
    if (!auth.authorized) return unauthorizedResponse()

    const parsed = await readJsonBody(req)
    if (!parsed.ok) return errorResponse('Body request harus JSON yang valid', 400)
    const { nama, satuan, hargaPerSatuan } = parsed.body

    if (!isTeksTerisi(nama)) return errorResponse('Nama bahan baku wajib diisi', 400)
    if (!isTeksTerisi(satuan)) return errorResponse('Satuan wajib diisi', 400)
    if (!isAngkaPositif(hargaPerSatuan)) {
      return errorResponse('Harga per satuan harus angka lebih dari 0', 400)
    }

    const namaBersih = nama.trim()

    // Nama bahan kembar membuat daftar membingungkan dan resep gampang salah
    // pilih. Perbandingan case-insensitive, jadi "Gula" dan "gula" dianggap sama.
    const kembar = await prisma.bahanBaku.findFirst({
      where: { nama: { equals: namaBersih, mode: 'insensitive' } },
    })
    if (kembar) {
      return errorResponse(`Bahan dengan nama "${kembar.nama}" sudah ada`, 409)
    }

    const data = await prisma.bahanBaku.create({
      data: { nama: namaBersih, satuan: satuan.trim(), hargaPerSatuan },
    })
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return handleError(error, 'Gagal menambah bahan baku')
  }
}

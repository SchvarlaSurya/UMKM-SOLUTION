import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { validasiResep } from '@/lib/validasiResep'
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

    const data = await prisma.produk.findMany({
      where: { userId: auth.userId },
      omit: { userId: true },
      include: {
        resep: {
          where: { bahanBaku: { userId: auth.userId } },
          include: { bahanBaku: { omit: { userId: true } } },
        },
      },
      orderBy: { nama: 'asc' },
    })
    return NextResponse.json(data)
  } catch (error) {
    return handleError(error, 'Gagal mengambil daftar produk')
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth()
    if (!auth.authorized) return unauthorizedResponse()

    const parsed = await readJsonBody(req)
    if (!parsed.ok) return errorResponse('Body request harus JSON yang valid', 400)
    const { nama, kategori, hargaJual, resep } = parsed.body

    if (!isTeksTerisi(nama)) return errorResponse('Nama produk wajib diisi', 400)
    if (!isAngkaPositif(hargaJual)) {
      return errorResponse('Harga jual harus angka lebih dari 0', 400)
    }
    if (kategori !== undefined && kategori !== null && !isTeksTerisi(kategori)) {
      return errorResponse('Kategori tidak boleh kosong', 400)
    }

    const cekResep = validasiResep(resep)
    if (!cekResep.ok) return errorResponse(cekResep.error, 400)

    const bahanAda = await prisma.bahanBaku.findMany({
      where: {
        userId: auth.userId,
        id: { in: cekResep.data.map((r) => r.bahanBakuId) },
      },
      select: { id: true },
    })
    const idHilang = cekResep.data
      .map((r) => r.bahanBakuId)
      .filter((id) => !bahanAda.some((b) => b.id === id))
    if (idHilang.length > 0) {
      return errorResponse(`Bahan baku tidak ditemukan: id ${idHilang.join(', ')}`, 400)
    }

    const produk = await prisma.produk.create({
      data: {
        nama: nama.trim(),
        kategori: isTeksTerisi(kategori) ? kategori.trim() : 'Umum',
        hargaJual,
        userId: auth.userId,
        resep: { create: cekResep.data },
      },
      omit: { userId: true },
      include: {
        resep: {
          where: { bahanBaku: { userId: auth.userId } },
          include: { bahanBaku: { omit: { userId: true } } },
        },
      },
    })

    return NextResponse.json(produk, { status: 201 })
  } catch (error) {
    return handleError(error, 'Gagal menambah produk')
  }
}

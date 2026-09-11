import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { validasiResep } from '@/lib/validasiResep'
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
    if (id === null) return errorResponse('ID produk tidak valid', 400)

    const produk = await prisma.produk.findFirst({
      where: { id, userId: auth.userId },
      omit: { userId: true },
      include: {
        resep: {
          where: { bahanBaku: { userId: auth.userId } },
          include: { bahanBaku: { omit: { userId: true } } },
        },
      },
    })
    if (!produk) return errorResponse('Produk tidak ditemukan', 404)

    return NextResponse.json(produk)
  } catch (error) {
    return handleError(error, 'Gagal mengambil produk')
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (!auth.authorized) return unauthorizedResponse()

    const { id: idParam } = await params
    const id = parseId(idParam)
    if (id === null) return errorResponse('ID produk tidak valid', 400)

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

    const existing = await prisma.produk.findFirst({ where: { id, userId: auth.userId } })
    if (!existing) return errorResponse('Produk tidak ditemukan', 404)

    // `resep` opsional: kalau tidak dikirim, resep lama dibiarkan apa adanya.
    // Kalau dikirim, aturannya sama ketat dengan POST.
    let resepBaru: { bahanBakuId: number; jumlahDipakai: number }[] | null = null
    if (resep !== undefined) {
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
        .filter((bahanId) => !bahanAda.some((b) => b.id === bahanId))
      if (idHilang.length > 0) {
        return errorResponse(`Bahan baku tidak ditemukan: id ${idHilang.join(', ')}`, 400)
      }

      resepBaru = cekResep.data
    }

    // Ganti resep dan update produk dalam satu transaksi, supaya produk tidak
    // pernah tertinggal dalam keadaan resepnya sudah terhapus tapi belum diisi.
    const updated = await prisma.$transaction(async (tx) => {
      if (resepBaru !== null) {
        await tx.resep.deleteMany({ where: { produkId: id } })
        await tx.resep.createMany({
          data: resepBaru.map((r) => ({ produkId: id, ...r })),
        })
      }
      return tx.produk.update({
        where: { id, userId: auth.userId },
        data: {
          nama: nama.trim(),
          kategori: isTeksTerisi(kategori) ? kategori.trim() : existing.kategori,
          hargaJual,
        },
        omit: { userId: true },
        include: {
          resep: {
            where: { bahanBaku: { userId: auth.userId } },
            include: { bahanBaku: { omit: { userId: true } } },
          },
        },
      })
    })

    return NextResponse.json(updated)
  } catch (error) {
    return handleError(error, 'Gagal mengubah produk')
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (!auth.authorized) return unauthorizedResponse()

    const { id: idParam } = await params
    const id = parseId(idParam)
    if (id === null) return errorResponse('ID produk tidak valid', 400)

    const existing = await prisma.produk.findFirst({ where: { id, userId: auth.userId } })
    if (!existing) return errorResponse('Produk tidak ditemukan', 404)

    // Schema belum pakai onDelete cascade, jadi relasi dihapus manual dulu.
    await prisma.$transaction([
      prisma.resep.deleteMany({ where: { produkId: id } }),
      prisma.hppSnapshot.deleteMany({ where: { produkId: id } }),
      prisma.produk.delete({ where: { id, userId: auth.userId } }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleError(error, 'Gagal menghapus produk')
  }
}

import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { validasiResep } from '@/lib/validasiResep'
import {
  calculateHargaJualTargetMarginDariResep,
  isModePenentuanHarga,
  isTargetMarginPersen,
  PerhitunganHargaTargetError,
} from '@/lib/hppCalculator'
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
    const { nama, kategori, hargaJual, resep, modePenentuanHarga, targetMarginPersen } =
      parsed.body

    if (!isTeksTerisi(nama)) return errorResponse('Nama produk wajib diisi', 400)
    if (kategori !== undefined && kategori !== null && !isTeksTerisi(kategori)) {
      return errorResponse('Kategori tidak boleh kosong', 400)
    }
    if (modePenentuanHarga !== undefined && !isModePenentuanHarga(modePenentuanHarga)) {
      return errorResponse('Mode penentuan harga harus "manual" atau "targetMargin"', 400)
    }

    const existing = await prisma.produk.findFirst({
      where: { id, userId: auth.userId },
      include: {
        resep: {
          where: { bahanBaku: { userId: auth.userId } },
          select: { bahanBakuId: true, jumlahDipakai: true },
        },
      },
    })
    if (!existing) return errorResponse('Produk tidak ditemukan', 404)

    const modeHarga = modePenentuanHarga ?? existing.modePenentuanHarga
    if (!isModePenentuanHarga(modeHarga)) {
      return errorResponse('Mode penentuan harga produk tidak valid', 400)
    }
    const targetMarginInput =
      targetMarginPersen === undefined ? existing.targetMarginPersen : targetMarginPersen
    if (modeHarga === 'manual' && !isAngkaPositif(hargaJual)) {
      return errorResponse('Harga jual harus angka lebih dari 0', 400)
    }
    let targetMarginTersimpan: number | null = null
    if (modeHarga === 'targetMargin') {
      if (!isTargetMarginPersen(targetMarginInput)) {
        return errorResponse('Target margin harus angka antara 0 sampai 80 persen', 400)
      }
      targetMarginTersimpan = targetMarginInput
    }

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
      const resepUntukHarga = resepBaru ?? existing.resep
      const hargaSistem =
        modeHarga === 'targetMargin'
          ? await calculateHargaJualTargetMarginDariResep(
              resepUntukHarga,
              auth.userId,
              targetMarginTersimpan as number,
              tx
            )
          : null

      if (resepBaru !== null) {
        await tx.resep.deleteMany({ where: { produkId: id } })
        await tx.resep.createMany({
          data: resepBaru.map((r) => ({ produkId: id, ...r })),
        })
      }

      const produk = await tx.produk.update({
        where: { id, userId: auth.userId },
        data: {
          nama: nama.trim(),
          kategori: isTeksTerisi(kategori) ? kategori.trim() : existing.kategori,
          hargaJual: hargaSistem?.hargaJual ?? (hargaJual as number),
          modePenentuanHarga: modeHarga,
          targetMarginPersen:
            modeHarga === 'targetMargin' ? targetMarginTersimpan : null,
        },
        omit: { userId: true },
        include: {
          resep: {
            where: { bahanBaku: { userId: auth.userId } },
            include: { bahanBaku: { omit: { userId: true } } },
          },
        },
      })

      if (hargaSistem && hargaSistem.hargaJual !== existing.hargaJual) {
        const alasan =
          existing.modePenentuanHarga !== 'targetMargin'
            ? 'mode target margin diaktifkan'
            : existing.targetMarginPersen !== targetMarginTersimpan
              ? 'perubahan target margin'
              : resepBaru !== null
                ? 'perubahan resep'
                : 'perhitungan ulang target margin'

        await tx.historiHargaJual.create({
          data: {
            produkId: id,
            hargaLama: existing.hargaJual,
            hargaBaru: hargaSistem.hargaJual,
            alasan,
          },
        })
        await tx.notifikasi.create({
          data: {
            userId: auth.userId,
            judul: 'Harga jual diperbarui otomatis',
            pesan: `1 produk mengalami perubahan harga jual karena ${alasan}.`,
          },
        })
      }

      return produk
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof PerhitunganHargaTargetError) {
      return errorResponse(error.message, 400)
    }
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
      prisma.historiHargaJual.deleteMany({ where: { produkId: id } }),
      prisma.produk.delete({ where: { id, userId: auth.userId } }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleError(error, 'Gagal menghapus produk')
  }
}

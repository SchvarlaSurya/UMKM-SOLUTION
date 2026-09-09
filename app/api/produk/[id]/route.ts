import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params
  const id = Number(idParam)
  const { nama, hargaJual, resep } = await req.json()

  if (!nama || hargaJual == null || hargaJual <= 0) {
    return NextResponse.json({ error: 'Nama dan harga jual wajib diisi dengan benar' }, { status: 400 })
  }

  const existing = await prisma.produk.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })

  // Strategi: hapus semua resep lama, buat ulang dari data baru.
  // Sederhana dan cukup aman untuk skala data lomba ini.
  if (Array.isArray(resep) && resep.length > 0) {
    await prisma.resep.deleteMany({ where: { produkId: id } })
    await prisma.resep.createMany({
      data: resep.map((r: { bahanBakuId: number; jumlahDipakai: number }) => ({
        produkId: id,
        bahanBakuId: r.bahanBakuId,
        jumlahDipakai: r.jumlahDipakai,
      })),
    })
  }

  const updated = await prisma.produk.update({
    where: { id },
    data: { nama, hargaJual },
    include: { resep: { include: { bahanBaku: true } } },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params
  const id = Number(idParam)

  // Hapus data anak dulu (resep, snapshot) sebelum hapus produk induk,
  // karena schema kita belum pasang onDelete: Cascade.
  await prisma.resep.deleteMany({ where: { produkId: id } })
  await prisma.hppSnapshot.deleteMany({ where: { produkId: id } })
  await prisma.produk.delete({ where: { id } })

  return NextResponse.json({ success: true })
}

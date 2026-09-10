import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id: idParam } = await params
  const id = Number(idParam)
  const { nama, hargaJual, resep } = await req.json()

  if (!nama || hargaJual == null || hargaJual <= 0) {
    return NextResponse.json({ error: 'Nama dan harga jual wajib diisi dengan benar' }, { status: 400 })
  }

  const existing = await prisma.produk.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })

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
  const auth = await requireAuth()
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id: idParam } = await params
  const id = Number(idParam)

  await prisma.resep.deleteMany({ where: { produkId: id } })
  await prisma.hppSnapshot.deleteMany({ where: { produkId: id } })
  await prisma.produk.delete({ where: { id } })

  return NextResponse.json({ success: true })
}

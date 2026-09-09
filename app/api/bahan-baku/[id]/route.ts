import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params
  const id = Number(idParam)
  const { hargaPerSatuan } = await req.json()
  if (hargaPerSatuan == null || hargaPerSatuan <= 0) {
    return NextResponse.json({ error: 'Harga tidak valid' }, { status: 400 })
  }

  const bahan = await prisma.bahanBaku.findUnique({ where: { id } })
  if (!bahan) return NextResponse.json({ error: 'Bahan tidak ditemukan' }, { status: 404 })

  await prisma.historiHarga.create({
    data: { bahanBakuId: id, hargaLama: bahan.hargaPerSatuan, hargaBaru: hargaPerSatuan },
  })

  const updated = await prisma.bahanBaku.update({
    where: { id },
    data: { hargaPerSatuan },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params
  const id = Number(idParam)
  await prisma.bahanBaku.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params
  const id = Number(idParam)
  const { nama, jenis, nilai } = await req.json()
  if (nilai == null || nilai <= 0) {
    return NextResponse.json({ error: 'Nilai tidak valid' }, { status: 400 })
  }
  const updated = await prisma.biayaOperasional.update({
    where: { id },
    data: { nama, jenis, nilai },
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params
  const id = Number(idParam)
  await prisma.biayaOperasional.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

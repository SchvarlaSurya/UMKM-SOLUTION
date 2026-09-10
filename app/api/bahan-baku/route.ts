import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  const auth = await requireAuth()
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const data = await prisma.bahanBaku.findMany({ orderBy: { nama: 'asc' } })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const auth = await requireAuth()
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { nama, satuan, hargaPerSatuan } = await req.json()
  if (!nama || !satuan || hargaPerSatuan == null || hargaPerSatuan <= 0) {
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
  }
  const data = await prisma.bahanBaku.create({ data: { nama, satuan, hargaPerSatuan } })
  return NextResponse.json(data)
}

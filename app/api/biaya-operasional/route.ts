import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  const auth = await requireAuth()
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const data = await prisma.biayaOperasional.findMany({ orderBy: { nama: 'asc' } })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const auth = await requireAuth()
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { nama, jenis, nilai } = await req.json()
  if (!nama || !jenis || nilai == null || nilai <= 0) {
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
  }
  if (jenis !== 'tetap' && jenis !== 'persentase') {
    return NextResponse.json({ error: 'Jenis harus "tetap" atau "persentase"' }, { status: 400 })
  }
  const data = await prisma.biayaOperasional.create({ data: { nama, jenis, nilai } })
  return NextResponse.json(data)
}

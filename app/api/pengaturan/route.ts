import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

// Pengaturan bersifat singleton ? selalu ambil/buat baris pertama.
async function getOrCreatePengaturan() {
  let pengaturan = await prisma.pengaturan.findFirst()
  if (!pengaturan) {
    pengaturan = await prisma.pengaturan.create({ data: {} })
  }
  return pengaturan
}

export async function GET() {
  const auth = await requireAuth()
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const pengaturan = await getOrCreatePengaturan()
  return NextResponse.json(pengaturan)
}

export async function PUT(req: Request) {
  const auth = await requireAuth()
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { estimasiPorsiPerBulan, batasMarginAman } = await req.json()
  if (estimasiPorsiPerBulan == null || estimasiPorsiPerBulan <= 0) {
    return NextResponse.json({ error: 'Estimasi porsi per bulan tidak valid' }, { status: 400 })
  }
  if (batasMarginAman == null || batasMarginAman < 0) {
    return NextResponse.json({ error: 'Batas margin aman tidak valid' }, { status: 400 })
  }
  const existing = await getOrCreatePengaturan()
  const updated = await prisma.pengaturan.update({
    where: { id: existing.id },
    data: { estimasiPorsiPerBulan, batasMarginAman },
  })
  return NextResponse.json(updated)
}

import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  const auth = await requireAuth()
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const data = await prisma.produk.findMany({
    include: { resep: { include: { bahanBaku: true } } },
    orderBy: { nama: 'asc' },
  })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const auth = await requireAuth()
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { nama, hargaJual, resep } = await req.json()

  if (!nama || hargaJual == null || hargaJual <= 0) {
    return NextResponse.json({ error: 'Nama dan harga jual wajib diisi dengan benar' }, { status: 400 })
  }
  if (!Array.isArray(resep) || resep.length === 0) {
    return NextResponse.json({ error: 'Produk harus punya minimal 1 bahan baku di resep' }, { status: 400 })
  }
  for (const r of resep) {
    if (!r.bahanBakuId || !r.jumlahDipakai || r.jumlahDipakai <= 0) {
      return NextResponse.json({ error: 'Setiap resep wajib punya bahanBakuId dan jumlahDipakai valid' }, { status: 400 })
    }
  }

  const produk = await prisma.produk.create({
    data: {
      nama,
      hargaJual,
      resep: {
        create: resep.map((r: { bahanBakuId: number; jumlahDipakai: number }) => ({
          bahanBakuId: r.bahanBakuId,
          jumlahDipakai: r.jumlahDipakai,
        })),
      },
    },
    include: { resep: { include: { bahanBaku: true } } },
  })

  return NextResponse.json(produk)
}

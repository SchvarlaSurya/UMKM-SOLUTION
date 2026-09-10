import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import {
  errorResponse,
  handleError,
  isAngkaPositif,
  isTeksTerisi,
  readJsonBody,
  unauthorizedResponse,
} from '@/lib/apiHelpers'

export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.authorized) return unauthorizedResponse()

    const data = await prisma.bahanBaku.findMany({ orderBy: { nama: 'asc' } })
    return NextResponse.json(data)
  } catch (error) {
    return handleError(error, 'Gagal mengambil daftar bahan baku')
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth()
    if (!auth.authorized) return unauthorizedResponse()

    const parsed = await readJsonBody(req)
    if (!parsed.ok) return errorResponse('Body request harus JSON yang valid', 400)
    const { nama, satuan, hargaPerSatuan } = parsed.body

    if (!isTeksTerisi(nama)) return errorResponse('Nama bahan baku wajib diisi', 400)
    if (!isTeksTerisi(satuan)) return errorResponse('Satuan wajib diisi', 400)
    if (!isAngkaPositif(hargaPerSatuan)) {
      return errorResponse('Harga per satuan harus angka lebih dari 0', 400)
    }

    const data = await prisma.bahanBaku.create({
      data: { nama: nama.trim(), satuan: satuan.trim(), hargaPerSatuan },
    })
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return handleError(error, 'Gagal menambah bahan baku')
  }
}

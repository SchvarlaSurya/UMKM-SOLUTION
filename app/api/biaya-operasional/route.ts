import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import {
  errorResponse,
  handleError,
  isAngkaPositif,
  isJenisBiaya,
  isTeksTerisi,
  readJsonBody,
  unauthorizedResponse,
} from '@/lib/apiHelpers'

export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.authorized) return unauthorizedResponse()

    const data = await prisma.biayaOperasional.findMany({ orderBy: { nama: 'asc' } })
    return NextResponse.json(data)
  } catch (error) {
    return handleError(error, 'Gagal mengambil daftar biaya operasional')
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth()
    if (!auth.authorized) return unauthorizedResponse()

    const parsed = await readJsonBody(req)
    if (!parsed.ok) return errorResponse('Body request harus JSON yang valid', 400)
    const { nama, jenis, nilai } = parsed.body

    if (!isTeksTerisi(nama)) return errorResponse('Nama biaya wajib diisi', 400)
    if (!isJenisBiaya(jenis)) {
      return errorResponse('Jenis harus "tetap" atau "persentase"', 400)
    }
    if (!isAngkaPositif(nilai)) return errorResponse('Nilai harus angka lebih dari 0', 400)
    if (jenis === 'persentase' && nilai > 100) {
      return errorResponse('Nilai persentase tidak boleh lebih dari 100', 400)
    }

    const data = await prisma.biayaOperasional.create({
      data: { nama: nama.trim(), jenis, nilai },
    })
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return handleError(error, 'Gagal menambah biaya operasional')
  }
}

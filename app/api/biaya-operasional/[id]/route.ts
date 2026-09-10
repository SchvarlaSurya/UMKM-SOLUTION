import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import {
  errorResponse,
  handleError,
  isAngkaPositif,
  isJenisBiaya,
  isTeksTerisi,
  parseId,
  readJsonBody,
  unauthorizedResponse,
} from '@/lib/apiHelpers'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (!auth.authorized) return unauthorizedResponse()

    const { id: idParam } = await params
    const id = parseId(idParam)
    if (id === null) return errorResponse('ID biaya operasional tidak valid', 400)

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

    const existing = await prisma.biayaOperasional.findUnique({ where: { id } })
    if (!existing) return errorResponse('Biaya operasional tidak ditemukan', 404)

    const updated = await prisma.biayaOperasional.update({
      where: { id },
      data: { nama: nama.trim(), jenis, nilai },
    })
    return NextResponse.json(updated)
  } catch (error) {
    return handleError(error, 'Gagal mengubah biaya operasional')
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (!auth.authorized) return unauthorizedResponse()

    const { id: idParam } = await params
    const id = parseId(idParam)
    if (id === null) return errorResponse('ID biaya operasional tidak valid', 400)

    const existing = await prisma.biayaOperasional.findUnique({ where: { id } })
    if (!existing) return errorResponse('Biaya operasional tidak ditemukan', 404)

    await prisma.biayaOperasional.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleError(error, 'Gagal menghapus biaya operasional')
  }
}

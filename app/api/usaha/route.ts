import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import {
  errorResponse,
  handleError,
  isTeksTerisi,
  readJsonBody,
  unauthorizedResponse,
} from '@/lib/apiHelpers'

const JENIS_USAHA_KULINER = [
  'Warung Makan',
  'Katering',
  'Kedai Minuman',
  'Toko Kue & Roti',
  'Jajanan/Camilan',
  'Lainnya (Kuliner)',
] as const

export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.authorized) return unauthorizedResponse()

    const usaha = await prisma.usaha.findUnique({
      where: { userId: auth.userId },
      omit: { userId: true },
    })

    return NextResponse.json(usaha)
  } catch (error) {
    return handleError(error, 'Gagal mengambil profil usaha')
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAuth()
    if (!auth.authorized) return unauthorizedResponse()

    const parsed = await readJsonBody(req)
    if (!parsed.ok) return errorResponse('Body request harus JSON yang valid', 400)

    const { namaUsaha, jenisUsaha } = parsed.body
    if (!isTeksTerisi(namaUsaha)) {
      return errorResponse('Nama usaha wajib diisi', 400)
    }
    if (!isTeksTerisi(jenisUsaha)) {
      return errorResponse('Jenis usaha wajib dipilih', 400)
    }

    const jenisUsahaBersih = jenisUsaha.trim()
    if (!(JENIS_USAHA_KULINER as readonly string[]).includes(jenisUsahaBersih)) {
      return errorResponse('Jenis usaha harus termasuk kategori usaha kuliner', 400)
    }

    const usaha = await prisma.usaha.upsert({
      where: { userId: auth.userId },
      update: {
        namaUsaha: namaUsaha.trim(),
        jenisUsaha: jenisUsahaBersih,
      },
      create: {
        userId: auth.userId,
        namaUsaha: namaUsaha.trim(),
        jenisUsaha: jenisUsahaBersih,
      },
      omit: { userId: true },
    })

    return NextResponse.json(usaha)
  } catch (error) {
    return handleError(error, 'Gagal menyimpan profil usaha')
  }
}

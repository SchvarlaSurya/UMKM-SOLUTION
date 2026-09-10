import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { errorResponse, handleError, isTeksTerisi, readJsonBody } from '@/lib/apiHelpers'

const PANJANG_PASSWORD_MINIMAL = 8

export async function POST(req: Request) {
  try {
    const parsed = await readJsonBody(req)
    if (!parsed.ok) return errorResponse('Body request harus JSON yang valid', 400)
    const { email, password, nama } = parsed.body

    if (!isTeksTerisi(email) || !email.includes('@')) {
      return errorResponse('Email tidak valid', 400)
    }
    if (!isTeksTerisi(nama)) return errorResponse('Nama wajib diisi', 400)
    if (typeof password !== 'string' || password.length < PANJANG_PASSWORD_MINIMAL) {
      return errorResponse(`Password minimal ${PANJANG_PASSWORD_MINIMAL} karakter`, 400)
    }

    const emailBersih = email.trim().toLowerCase()
    const existing = await prisma.user.findUnique({ where: { email: emailBersih } })
    if (existing) return errorResponse('Email sudah terdaftar', 409)

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email: emailBersih, password: hashed, nama: nama.trim() },
    })

    return NextResponse.json({ id: user.id, email: user.email, nama: user.nama }, { status: 201 })
  } catch (error) {
    return handleError(error, 'Gagal mendaftarkan user')
  }
}

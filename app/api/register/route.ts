import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { email, password, nama } = await req.json()
  if (!email || !password || !nama) {
    return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
  }
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 })
  }
  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { email, password: hashed, nama } })
  return NextResponse.json({ id: user.id, email: user.email })
}
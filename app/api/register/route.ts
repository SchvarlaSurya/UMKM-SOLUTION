import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { errorResponse, handleError, isTeksTerisi, readJsonBody } from '@/lib/apiHelpers'
import { ipDariHeader, kunciPercobaan, pembatasDaftar } from '@/lib/batasPercobaan'
import { cariUserLewatEmail, normalisasiEmail } from '@/lib/email'
import { adalahJenisUsaha } from '@/lib/jenisUsaha'

const PANJANG_PASSWORD_MINIMAL = 8

export async function POST(req: Request) {
  try {
    const parsed = await readJsonBody(req)
    if (!parsed.ok) return errorResponse('Body request harus JSON yang valid', 400)
    const { email, password, nama, namaUsaha, jenisUsaha } = parsed.body

    // 5 percobaan per 15 menit per IP + email, berhasil atau gagal. Dihitung
    // sebelum validasi supaya isian ngawur pun memakan jatah. In-memory: lihat
    // catatan di lib/batasPercobaan.ts sebelum pindah ke multi-instance.
    const kunci = kunciPercobaan(
      ipDariHeader((namaHeader) => req.headers.get(namaHeader)),
      typeof email === 'string' ? normalisasiEmail(email) : ''
    )
    const cek = pembatasDaftar.periksa(kunci)
    if (!cek.diizinkan) {
      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan daftar. Coba lagi dalam ${Math.ceil(cek.cobaLagiDetik / 60)} menit.`,
        },
        { status: 429, headers: { 'Retry-After': String(cek.cobaLagiDetik) } }
      )
    }
    pembatasDaftar.catat(kunci)

    if (!isTeksTerisi(email) || !email.includes('@')) {
      return errorResponse('Email tidak valid', 400)
    }
    if (!isTeksTerisi(nama)) return errorResponse('Nama wajib diisi', 400)
    if (typeof password !== 'string' || password.length < PANJANG_PASSWORD_MINIMAL) {
      return errorResponse(`Password minimal ${PANJANG_PASSWORD_MINIMAL} karakter`, 400)
    }
    if (!isTeksTerisi(namaUsaha)) return errorResponse('Nama usaha wajib diisi', 400)
    if (!isTeksTerisi(jenisUsaha) || !adalahJenisUsaha(jenisUsaha.trim())) {
      return errorResponse('Jenis usaha harus termasuk kategori usaha kuliner', 400)
    }

    const emailBersih = normalisasiEmail(email)
    // Tidak peka huruf, supaya akun lama "Budi@mail.com" tidak bisa didaftarkan
    // ulang sebagai "budi@mail.com".
    const existing = await cariUserLewatEmail(prisma, emailBersih)
    if (existing) return errorResponse('Email sudah terdaftar', 409)

    const hashed = await bcrypt.hash(password, 10)

    // Akun tanpa profil usaha akan tampil tanpa nama toko di sidebar, jadi
    // keduanya dibuat sekaligus; kalau salah satu gagal, tidak ada yang tersimpan.
    const user = await prisma.$transaction(async (tx) => {
      const dibuat = await tx.user.create({
        data: { email: emailBersih, password: hashed, nama: nama.trim() },
      })
      await tx.usaha.create({
        data: {
          userId: dibuat.id,
          namaUsaha: namaUsaha.trim(),
          jenisUsaha: jenisUsaha.trim(),
        },
      })
      return dibuat
    })

    return NextResponse.json({ id: user.id, email: user.email, nama: user.nama }, { status: 201 })
  } catch (error) {
    return handleError(error, 'Gagal mendaftarkan user')
  }
}

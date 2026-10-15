import { NextResponse } from 'next/server'
import { Prisma } from '@/app/generated/prisma/client'
import { pesanGalatTakTerduga } from '@/lib/pesanGalatServer'

/**
 * Helper bersama untuk semua route di `app/api/*`.
 * Tujuannya satu: frontend selalu dapat JSON `{ error: string }` dengan status
 * yang benar, bukan 500 telanjang dari exception yang tidak tertangkap.
 */

export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export const unauthorizedResponse = () => errorResponse('Unauthorized', 401)

/** Ubah `params.id` jadi angka. `null` berarti tidak valid: bukan bilangan bulat positif. */
export function parseId(idParam: string): number | null {
  const id = Number(idParam)
  if (!Number.isSafeInteger(id) || id <= 0) return null
  return id
}

/** Baca body JSON tanpa melempar. `ok: false` kalau body kosong/rusak. */
export async function readJsonBody(
  req: Request
): Promise<{ ok: true; body: Record<string, unknown> } | { ok: false }> {
  try {
    const body = await req.json()
    if (body === null || typeof body !== 'object' || Array.isArray(body)) return { ok: false }
    return { ok: true, body: body as Record<string, unknown> }
  } catch {
    return { ok: false }
  }
}

/** Terjemahkan exception jadi response yang bisa dibaca frontend. */
export function handleError(error: unknown, konteks: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2025':
        return errorResponse(`${konteks}: data tidak ditemukan`, 404)
      case 'P2002':
        return errorResponse(`${konteks}: data dengan nilai unik yang sama sudah ada`, 409)
      case 'P2003':
        return errorResponse(
          `${konteks}: data masih dipakai oleh data lain, hapus keterkaitannya dulu`,
          400
        )
      default:
        return errorResponse(`${konteks}: gagal memproses data (${error.code})`, 400)
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return errorResponse(`${konteks}: tidak bisa terhubung ke database`, 503)
  }

  // Detail lengkapnya hanya di log server; klien menerima pesan umum, kecuali
  // di `next dev` supaya galat tetap mudah dilacak saat mengembangkan.
  console.error(`[api] ${konteks}:`, error)
  return errorResponse(
    pesanGalatTakTerduga(konteks, error, process.env.NODE_ENV === 'development'),
    500
  )
}

/** Angka positif (boleh desimal) untuk harga, nilai biaya, jumlah dipakai. */
export function isAngkaPositif(nilai: unknown): nilai is number {
  return typeof nilai === 'number' && Number.isFinite(nilai) && nilai > 0
}

export function isTeksTerisi(nilai: unknown): nilai is string {
  return typeof nilai === 'string' && nilai.trim().length > 0
}

export const JENIS_BIAYA = ['tetap', 'persentase'] as const
export type JenisBiaya = (typeof JENIS_BIAYA)[number]

export function isJenisBiaya(nilai: unknown): nilai is JenisBiaya {
  return typeof nilai === 'string' && (JENIS_BIAYA as readonly string[]).includes(nilai)
}

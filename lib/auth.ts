import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

/**
 * Penjaga sesi untuk route handler dan Server Action.
 *
 * `authOptions` wajib dilewatkan: tanpa itu NextAuth tidak menjalankan callback
 * yang menaruh id pengguna ke dalam sesi, sehingga `userId` selalu kosong.
 *
 * `userId` bertipe number supaya langsung cocok dengan kolom `User.id` di
 * Prisma. NextAuth menyimpannya sebagai string di dalam token.
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { authorized: false as const }
  }

  const userId = Number(session.user.id)
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return { authorized: false as const }
  }

  return { authorized: true as const, session, userId }
}

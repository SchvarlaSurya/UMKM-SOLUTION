import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  const userId = Number(session?.user?.id)
  if (!session || !Number.isSafeInteger(userId) || userId <= 0) {
    return { authorized: false as const }
  }
  return { authorized: true as const, session, userId }
}

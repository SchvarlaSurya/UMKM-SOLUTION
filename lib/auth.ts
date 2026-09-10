import { getServerSession } from 'next-auth'

export async function requireAuth() {
  const session = await getServerSession()
  if (!session) {
    return { authorized: false as const }
  }
  return { authorized: true as const, session }
}

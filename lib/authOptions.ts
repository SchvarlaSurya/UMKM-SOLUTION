import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

/**
 * Konfigurasi NextAuth dipisah dari route handler supaya bisa ikut dipakai
 * `getServerSession(authOptions)`. Tanpa argumen itu, NextAuth tidak menjalankan
 * callback di bawah, sehingga `session.user.id` tidak akan pernah terisi.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user) return null
        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null
        return { id: String(user.id), email: user.email, name: user.nama }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    /**
     * `user` hanya terisi pada saat login. Id disalin ke token sekali di situ,
     * lalu ikut terbawa pada setiap permintaan berikutnya.
     */
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    /** Turunkan id dari token ke sesi supaya bisa dibaca server maupun klien. */
    session({ session, token }) {
      if (session.user && typeof token.id === 'string') {
        session.user.id = token.id
      }
      return session
    },
  },
}

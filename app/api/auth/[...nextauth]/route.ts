import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        // POST /api/register menyimpan email dalam huruf kecil, jadi lookup
        // di sini harus dinormalisasi sama supaya login tidak gagal.
        const email = credentials.email.trim().toLowerCase()
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) return null
        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null
        return { id: String(user.id), email: user.email, name: user.nama }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
})

export { handler as GET, handler as POST }
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { ipDariHeader, pembatasLogin } from '@/lib/batasPercobaan'
import { cariUserLewatEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { verifikasiLogin } from '@/lib/verifikasiLogin'

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
      /**
       * Melempar LoginDibatasiError setelah 5 kali gagal per 15 menit untuk
       * IP + email yang sama; NextAuth meneruskan pesannya ke klien sebagai
       * `error`. Lihat lib/verifikasiLogin.ts dan lib/batasPercobaan.ts.
       */
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await verifikasiLogin(
          {
            email: credentials.email,
            password: credentials.password,
            ip: ipDariHeader((nama) => {
              const nilai = req?.headers?.[nama]
              return Array.isArray(nilai) ? nilai[0] : nilai
            }),
          },
          {
            cariUser: (emailBaku) => cariUserLewatEmail(prisma, emailBaku),
            bandingkan: bcrypt.compare,
            pembatas: pembatasLogin,
          }
        )
        if (!user) return null
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

import type { DefaultSession } from "next-auth";

/**
 * Menambahkan `id` ke bentuk sesi bawaan NextAuth.
 * Diisi oleh callback `jwt` dan `session` di lib/authOptions.ts.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}

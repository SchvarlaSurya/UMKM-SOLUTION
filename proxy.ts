import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Penjaga rute. Di Next.js 16 berkas `middleware.ts` berganti nama jadi
 * `proxy.ts`; perilakunya sama.
 *
 * Pemeriksaan di sini bersifat optimistik: hanya melihat ada tidaknya token
 * sesi supaya pengunjung tanpa sesi tidak menatap halaman kosong. Otorisasi
 * sebenarnya tetap dilakukan tiap route handler lewat requireAuth() di
 * lib/auth.ts, jangan diandalkan hanya pada berkas ini.
 */

/** Halaman yang butuh sesi. Awalan jalur, termasuk seluruh anak jalurnya. */
const RUTE_TERLINDUNGI = [
  "/dashboard",
  "/bahan-baku",
  "/biaya-operasional",
  "/produk",
  "/tren-harga",
];

/** Halaman yang tidak masuk akal dibuka saat sudah punya sesi. */
const RUTE_TAMU = ["/login", "/register"];

function cocok(pathname: string, daftar: string[]): boolean {
  return daftar.some((rute) => pathname === rute || pathname.startsWith(`${rute}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token && cocok(pathname, RUTE_TERLINDUNGI)) {
    const tujuan = new URL("/login", request.url);
    // Simpan halaman yang dituju supaya bisa dilanjutkan setelah masuk.
    tujuan.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(tujuan);
  }

  if (token && cocok(pathname, RUTE_TAMU)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // "/" tidak perlu dijaga: app/page.tsx mengarahkannya ke /dashboard,
    // yang sudah termasuk rute terlindungi.
    "/dashboard/:path*",
    "/bahan-baku/:path*",
    "/biaya-operasional/:path*",
    "/produk/:path*",
    "/tren-harga/:path*",
    "/login",
    "/register",
  ],
};

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Pemanggil endpoint `app/api/*` dari sisi server.
 *
 * Dua hal yang tidak otomatis saat Server Component memanggil API sendiri:
 * 1. `fetch` di server tidak mengenal path relatif, jadi butuh URL absolut.
 * 2. Cookie sesi tidak ikut terkirim, padahal semua route dijaga requireAuth().
 * Keduanya diurus di sini supaya halaman cukup memanggil apiGet("/produk").
 */

/** Asal aplikasi saat ini. NEXTAUTH_URL sudah wajib ada untuk NextAuth. */
function asalAplikasi(): string {
  const dariEnv = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (dariEnv) return dariEnv.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export class GalatApi extends Error {
  constructor(
    readonly status: number,
    pesan: string,
  ) {
    super(pesan);
    this.name = "GalatApi";
  }
}

/**
 * GET ke endpoint internal. Selalu segar: halaman ini menampilkan angka usaha
 * yang berubah setiap kali form disimpan.
 */
export async function apiGet<T>(path: string): Promise<T> {
  const respons = await fetch(`${asalAplikasi()}/api${path}`, {
    headers: { cookie: (await cookies()).toString() },
    cache: "no-store",
  });

  // Sesi bisa habis di antara pemeriksaan proxy.ts dan pemanggilan ini.
  // Antarkan ke halaman masuk, jangan biarkan halaman meledak jadi 500.
  if (respons.status === 401) redirect("/login");

  if (!respons.ok) {
    const isi = await respons.json().catch(() => null);
    throw new GalatApi(
      respons.status,
      isi?.error ?? `Gagal memuat data dari /api${path}`,
    );
  }

  return respons.json() as Promise<T>;
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { adalahJenisUsaha } from "@/lib/jenisUsaha";
import { BATAS_MASUKAN, bacaTeks, isObjek, periksaPanjang } from "@/lib/batasMasukan";

/**
 * Server Action untuk halaman Profil Usaha.
 *
 * Aturannya disamakan dengan PUT /api/usaha, dan sesi tetap diperiksa di sini
 * karena Server Function bisa dipanggil lewat POST langsung.
 */

export type HasilAksi = { ok: true } | { ok: false; error: string };

export async function simpanProfilUsaha(masukan: {
  namaUsaha: string;
  jenisUsaha: string;
}): Promise<HasilAksi> {
  const auth = await requireAuth();
  if (!auth.authorized) {
    return { ok: false, error: "Sesi berakhir. Masuk lagi untuk menyimpan." };
  }

  if (!isObjek(masukan)) {
    return { ok: false, error: "Data yang dikirim tidak valid. Muat ulang halaman lalu coba lagi." };
  }
  const namaUsaha = bacaTeks(masukan.namaUsaha);
  const jenisUsaha = bacaTeks(masukan.jenisUsaha);

  if (namaUsaha === "") {
    return { ok: false, error: "Nama usaha wajib diisi." };
  }
  const galatNama = periksaPanjang(namaUsaha, "Nama usaha", BATAS_MASUKAN.panjangNama);
  if (galatNama) return { ok: false, error: `${galatNama}.` };
  if (!adalahJenisUsaha(jenisUsaha)) {
    return { ok: false, error: "Jenis usaha harus termasuk kategori usaha kuliner." };
  }

  // Akun yang mendaftar sebelum profil usaha ada belum punya barisnya, jadi
  // upsert: yang lama diperbarui, yang belum punya dibuatkan.
  await prisma.usaha.upsert({
    where: { userId: auth.userId },
    update: { namaUsaha, jenisUsaha },
    create: { userId: auth.userId, namaUsaha, jenisUsaha },
  });

  // Nama usaha tampil di sidebar, yang ikut dirender tiap halaman di grup ini.
  revalidatePath("/", "layout");
  return { ok: true };
}

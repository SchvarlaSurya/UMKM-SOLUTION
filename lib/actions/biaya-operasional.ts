"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import type { JenisBiaya } from "@/lib/types";

/**
 * Server Action untuk halaman Biaya Operasional.
 *
 * Sesi diperiksa di dalam tiap action karena Server Function bisa dipanggil
 * lewat POST langsung, bukan hanya dari tombol di UI. Aturan validasinya
 * disamakan dengan route di app/api/biaya-operasional dan app/api/pengaturan.
 */

export type HasilAksi = { ok: true } | { ok: false; error: string };

/** Biaya dan pengaturan ikut menentukan HPP, jadi halaman ini ikut disegarkan. */
const HALAMAN_TERDAMPAK = ["/biaya-operasional", "/dashboard", "/produk"];

function segarkan() {
  for (const halaman of HALAMAN_TERDAMPAK) revalidatePath(halaman);
}

type MasukanBiaya = {
  nama: string;
  jenis: JenisBiaya;
  nilai: number;
};

/** Aturan yang sama dipakai saat menambah maupun menyunting. */
function periksaMasukan(masukan: MasukanBiaya): string | null {
  const nama = masukan.nama?.trim() ?? "";
  if (nama === "") return "Nama biaya wajib diisi.";
  if (masukan.jenis !== "tetap" && masukan.jenis !== "persentase") {
    return 'Jenis biaya harus "tetap" atau "persentase".';
  }
  if (!Number.isFinite(masukan.nilai) || masukan.nilai <= 0) {
    return "Nilai harus lebih dari 0.";
  }
  if (masukan.jenis === "persentase" && masukan.nilai > 100) {
    return "Persentase tidak boleh lebih dari 100.";
  }
  return null;
}

export async function tambahBiaya(masukan: MasukanBiaya): Promise<HasilAksi> {
  const auth = await requireAuth();
  if (!auth.authorized) {
    return { ok: false, error: "Sesi berakhir. Masuk lagi untuk menyimpan." };
  }

  const galat = periksaMasukan(masukan);
  if (galat) return { ok: false, error: galat };

  await prisma.biayaOperasional.create({
    data: { nama: masukan.nama.trim(), jenis: masukan.jenis, nilai: masukan.nilai },
  });

  segarkan();
  return { ok: true };
}

export async function perbaruiBiaya(id: number, masukan: MasukanBiaya): Promise<HasilAksi> {
  const auth = await requireAuth();
  if (!auth.authorized) {
    return { ok: false, error: "Sesi berakhir. Masuk lagi untuk menyimpan." };
  }

  const galat = periksaMasukan(masukan);
  if (galat) return { ok: false, error: galat };

  const ada = await prisma.biayaOperasional.findUnique({ where: { id } });
  if (!ada) return { ok: false, error: "Biaya tidak ditemukan." };

  await prisma.biayaOperasional.update({
    where: { id },
    data: { nama: masukan.nama.trim(), jenis: masukan.jenis, nilai: masukan.nilai },
  });

  segarkan();
  return { ok: true };
}

/**
 * Pengaturan bersifat singleton: baris pertama dipakai, dibuat kalau belum ada.
 * Keduanya disimpan sekaligus karena dua input itu tampil di card yang sama.
 */
export async function simpanPengaturan(masukan: {
  estimasiPorsiPerBulan: number;
  batasMarginAman: number;
}): Promise<HasilAksi> {
  const auth = await requireAuth();
  if (!auth.authorized) {
    return { ok: false, error: "Sesi berakhir. Masuk lagi untuk menyimpan." };
  }

  if (!Number.isInteger(masukan.estimasiPorsiPerBulan) || masukan.estimasiPorsiPerBulan <= 0) {
    return { ok: false, error: "Estimasi porsi per bulan harus bilangan bulat lebih dari 0." };
  }
  if (
    !Number.isFinite(masukan.batasMarginAman) ||
    masukan.batasMarginAman < 0 ||
    masukan.batasMarginAman > 100
  ) {
    return { ok: false, error: "Batas margin aman harus antara 0 dan 100." };
  }

  const ada = await prisma.pengaturan.findFirst();
  if (ada) {
    await prisma.pengaturan.update({ where: { id: ada.id }, data: masukan });
  } else {
    await prisma.pengaturan.create({ data: masukan });
  }

  segarkan();
  return { ok: true };
}

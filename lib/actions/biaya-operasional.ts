"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  PerhitunganHargaTargetError,
  recalculateAllByBiayaOperasional,
} from "@/lib/hppCalculator";
import type { JenisBiaya } from "@/lib/types";

export type HasilAksi = { ok: true } | { ok: false; error: string };

function galatPerhitungan(error: unknown): HasilAksi | null {
  return error instanceof PerhitunganHargaTargetError
    ? { ok: false, error: error.message }
    : null;
}

const HALAMAN_BIAYA = ["/biaya-operasional"] as const;
const HALAMAN_PERHITUNGAN_BIAYA = ["/biaya-operasional", "/dashboard", "/produk"] as const;

function segarkan(halamanTerdampak: readonly string[]) {
  // revalidatePath sinkron; panggilan ini tidak saling menunggu secara async.
  for (const halaman of halamanTerdampak) revalidatePath(halaman);
}

type MasukanBiaya = {
  nama: string;
  jenis: JenisBiaya;
  nilai: number;
};

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

  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.biayaOperasional.create({
          data: {
            nama: masukan.nama.trim(),
            jenis: masukan.jenis,
            nilai: masukan.nilai,
            userId: auth.userId,
          },
        });
        await recalculateAllByBiayaOperasional(auth.userId, tx);
      },
      { maxWait: 10000, timeout: 20000 }
    );
  } catch (error) {
    const hasil = galatPerhitungan(error);
    if (hasil) return hasil;
    throw error;
  }

  segarkan(HALAMAN_PERHITUNGAN_BIAYA);
  return { ok: true };
}

export async function perbaruiBiaya(id: number, masukan: MasukanBiaya): Promise<HasilAksi> {
  const auth = await requireAuth();
  if (!auth.authorized) {
    return { ok: false, error: "Sesi berakhir. Masuk lagi untuk menyimpan." };
  }

  const galat = periksaMasukan(masukan);
  if (galat) return { ok: false, error: galat };

  const ada = await prisma.biayaOperasional.findFirst({
    where: { id, userId: auth.userId },
  });
  if (!ada) return { ok: false, error: "Biaya tidak ditemukan." };

  const memengaruhiPerhitungan =
    ada.jenis !== masukan.jenis || ada.nilai !== masukan.nilai;

  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.biayaOperasional.update({
          where: { id, userId: auth.userId },
          data: { nama: masukan.nama.trim(), jenis: masukan.jenis, nilai: masukan.nilai },
        });
        await recalculateAllByBiayaOperasional(auth.userId, tx);
      },
      { maxWait: 10000, timeout: 20000 }
    );
  } catch (error) {
    const hasil = galatPerhitungan(error);
    if (hasil) return hasil;
    throw error;
  }

  // Nama biaya hanya ditampilkan di halaman biaya operasional. Rekalkulasi
  // tetap dipertahankan agar perilaku mutasi di luar invalidasi tidak berubah.
  segarkan(memengaruhiPerhitungan ? HALAMAN_PERHITUNGAN_BIAYA : HALAMAN_BIAYA);
  return { ok: true };
}

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

  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.pengaturan.upsert({
          where: { userId: auth.userId },
          update: masukan,
          create: { ...masukan, userId: auth.userId },
        });
        await recalculateAllByBiayaOperasional(auth.userId, tx);
      },
      { maxWait: 10000, timeout: 20000 }
    );
  } catch (error) {
    const hasil = galatPerhitungan(error);
    if (hasil) return hasil;
    throw error;
  }

  segarkan(HALAMAN_PERHITUNGAN_BIAYA);
  return { ok: true };
}

export async function hapusBiaya(id: number): Promise<HasilAksi> {
  const auth = await requireAuth();
  if (!auth.authorized) {
    return { ok: false, error: "Sesi berakhir. Masuk lagi untuk menghapus." };
  }

  const ada = await prisma.biayaOperasional.findFirst({ where: { id, userId: auth.userId } });
  if (!ada) return { ok: false, error: "Biaya tidak ditemukan." };

  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.biayaOperasional.delete({ where: { id, userId: auth.userId } });
        await recalculateAllByBiayaOperasional(auth.userId, tx);
      },
      { maxWait: 10000, timeout: 20000 }
    );
  } catch (error) {
    const hasil = galatPerhitungan(error);
    if (hasil) return hasil;
    throw error;
  }

  segarkan(HALAMAN_PERHITUNGAN_BIAYA);
  return { ok: true };
}

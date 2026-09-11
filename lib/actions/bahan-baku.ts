"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { recalculateAllAffectedByBahan } from "@/lib/hppCalculator";

/**
 * Server Action untuk halaman Bahan Baku.
 *
 * Server Function bisa dipanggil lewat POST langsung, bukan cuma dari tombol
 * di UI, jadi sesi diperiksa ulang di sini — penjagaan proxy.ts saja tidak
 * cukup. Aturan validasinya sengaja disamakan dengan route di
 * app/api/bahan-baku supaya kedua jalur menolak masukan yang sama.
 */

export type HasilAksi = { ok: true } | { ok: false; error: string };

/** Halaman yang menampilkan angka turunan harga bahan. */
const HALAMAN_TERDAMPAK = ["/bahan-baku", "/dashboard", "/produk", "/tren-harga"];

function segarkan() {
  for (const halaman of HALAMAN_TERDAMPAK) revalidatePath(halaman);
}

export async function tambahBahanBaku(masukan: {
  nama: string;
  satuan: string;
  hargaPerSatuan: number;
}): Promise<HasilAksi> {
  const auth = await requireAuth();
  if (!auth.authorized) {
    return { ok: false, error: "Sesi berakhir. Masuk lagi untuk menyimpan." };
  }

  const nama = masukan.nama?.trim() ?? "";
  const satuan = masukan.satuan?.trim() ?? "";

  if (nama === "" || satuan === "") {
    return { ok: false, error: "Nama dan satuan bahan wajib diisi." };
  }
  if (!Number.isFinite(masukan.hargaPerSatuan) || masukan.hargaPerSatuan <= 0) {
    return { ok: false, error: "Harga per satuan harus lebih dari 0." };
  }

  const kembar = await prisma.bahanBaku.findFirst({
    where: {
      userId: auth.userId,
      nama: { equals: nama, mode: "insensitive" },
    },
  });
  if (kembar) {
    return { ok: false, error: `Bahan bernama "${kembar.nama}" sudah ada.` };
  }

  await prisma.bahanBaku.create({
    data: { nama, satuan, hargaPerSatuan: masukan.hargaPerSatuan, userId: auth.userId },
  });

  segarkan();
  return { ok: true };
}

/**
 * Mengubah harga bahan sekaligus mencatat historinya dan menghitung ulang HPP
 * seluruh produk yang memakai bahan ini. Perilakunya sengaja sama dengan
 * PUT /api/bahan-baku/[id].
 */
export async function perbaruiHargaBahan(
  id: number,
  hargaPerSatuan: number,
): Promise<HasilAksi> {
  const auth = await requireAuth();
  if (!auth.authorized) {
    return { ok: false, error: "Sesi berakhir. Masuk lagi untuk menyimpan." };
  }

  if (!Number.isFinite(hargaPerSatuan) || hargaPerSatuan <= 0) {
    return { ok: false, error: "Harga per satuan harus lebih dari 0." };
  }

  const bahan = await prisma.bahanBaku.findFirst({ where: { id, userId: auth.userId } });
  if (!bahan) return { ok: false, error: "Bahan tidak ditemukan." };

  if (bahan.hargaPerSatuan === hargaPerSatuan) {
    return { ok: false, error: "Harga belum berubah dari nilai sebelumnya." };
  }

  await prisma.historiHarga.create({
    data: { bahanBakuId: id, hargaLama: bahan.hargaPerSatuan, hargaBaru: hargaPerSatuan },
  });
  await prisma.bahanBaku.update({
    where: { id, userId: auth.userId },
    data: { hargaPerSatuan },
  });
  await recalculateAllAffectedByBahan(id, auth.userId);

  segarkan();
  return { ok: true };
}

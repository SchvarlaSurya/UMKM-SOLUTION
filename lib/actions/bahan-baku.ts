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

const HALAMAN_DAFTAR_BAHAN = ["/bahan-baku", "/dashboard", "/produk"] as const;
const HALAMAN_HARGA_BAHAN = [...HALAMAN_DAFTAR_BAHAN, "/tren-harga"] as const;

function segarkan(halamanTerdampak: readonly string[]) {
  // revalidatePath bersifat sinkron; tidak ada pekerjaan async yang perlu
  // ditunggu atau diparalelkan dengan Promise.all.
  for (const halaman of halamanTerdampak) revalidatePath(halaman);
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

  // Bahan baru belum punya histori harga, jadi belum muncul di tren harga.
  segarkan(HALAMAN_DAFTAR_BAHAN);
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

  segarkan(HALAMAN_HARGA_BAHAN);
  return { ok: true };
}

/**
 * Menghapus bahan baku beserta histori harganya.
 *
 * Aturannya sama dengan DELETE /api/bahan-baku/[id]: bahan yang masih dipakai
 * resep ditolak lebih dulu dengan menyebut produknya, jangan dibiarkan gagal
 * sebagai galat foreign key yang tidak bisa dibaca pengguna.
 */
export async function hapusBahanBaku(id: number): Promise<HasilAksi> {
  const auth = await requireAuth();
  if (!auth.authorized) {
    return { ok: false, error: "Sesi berakhir. Masuk lagi untuk menghapus." };
  }

  const bahan = await prisma.bahanBaku.findFirst({
    where: { id, userId: auth.userId },
    include: { _count: { select: { histori: true } } },
  });
  if (!bahan) return { ok: false, error: "Bahan tidak ditemukan." };

  const dipakai = await prisma.resep.findMany({
    where: { bahanBakuId: id, produk: { userId: auth.userId } },
    select: { produk: { select: { nama: true } } },
  });

  if (dipakai.length > 0) {
    const namaProduk = [...new Set(dipakai.map((r) => r.produk.nama))];
    const daftar =
      namaProduk.length <= 3
        ? namaProduk.join(", ")
        : `${namaProduk.slice(0, 3).join(", ")}, dan ${namaProduk.length - 3} lainnya`;
    return {
      ok: false,
      error: `Masih dipakai ${namaProduk.length} produk (${daftar}). Keluarkan dari resepnya dulu.`,
    };
  }

  // HistoriHarga belum punya onDelete cascade di schema, hapus manual dulu.
  await prisma.$transaction([
    prisma.historiHarga.deleteMany({ where: { bahanBakuId: id } }),
    prisma.bahanBaku.delete({ where: { id, userId: auth.userId } }),
  ]);

  // Tren hanya berubah bila bahan yang dihapus memang memiliki histori.
  segarkan(bahan._count.histori > 0 ? HALAMAN_HARGA_BAHAN : HALAMAN_DAFTAR_BAHAN);
  return { ok: true };
}

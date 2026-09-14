"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  calculateHargaJualTargetMarginDariResep,
  isModePenentuanHarga,
  isTargetMarginPersen,
  PerhitunganHargaTargetError,
  type ModePenentuanHarga,
} from "@/lib/hppCalculator";

/**
 * Server Action untuk halaman Produk & Resep.
 *
 * Sesi diperiksa di dalam tiap action karena Server Function bisa dipanggil
 * lewat POST langsung, bukan hanya dari tombol di UI. Aturan validasinya
 * mengikuti route di app/api/produk, ditambah pemeriksaan bahan ganda karena
 * model Resep memakai primary key gabungan [produkId, bahanBakuId].
 */

export type HasilAksi = { ok: true } | { ok: false; error: string };

export type BarisResep = { bahanBakuId: number; jumlahDipakai: number };

export type MasukanProduk = {
  nama: string;
  kategori: string;
  hargaJual: number;
  resep: BarisResep[];
};

/** Masukan tambah produk: sama dengan form, termasuk cara menentukan harga. */
export type MasukanTambahProduk = MasukanProduk & {
  modePenentuanHarga?: ModePenentuanHarga;
  targetMarginPersen?: number | null;
};

const HALAMAN_DATA_PRODUK = ["/produk", "/dashboard"] as const;
const HALAMAN_RELASI_RESEP = [...HALAMAN_DATA_PRODUK, "/bahan-baku"] as const;

function segarkan(halamanTerdampak: readonly string[]) {
  // revalidatePath sinkron; panggilan ini tidak saling menunggu secara async.
  for (const halaman of halamanTerdampak) revalidatePath(halaman);
}

async function periksaMasukan(
  masukan: MasukanProduk,
  userId: number,
  // Di mode target margin harga dihitung server, jadi angka dari klien diabaikan.
  hargaWajib = true,
): Promise<string | null> {
  const nama = masukan.nama?.trim() ?? "";
  if (nama === "") return "Nama produk wajib diisi.";
  if (hargaWajib && (!Number.isFinite(masukan.hargaJual) || masukan.hargaJual <= 0)) {
    return "Harga jual harus lebih dari 0.";
  }
  if (!Array.isArray(masukan.resep) || masukan.resep.length === 0) {
    return "Produk harus punya minimal 1 bahan baku di resep.";
  }
  if (masukan.resep.some((r) => !Number.isFinite(r.jumlahDipakai) || r.jumlahDipakai <= 0)) {
    return "Setiap bahan wajib punya takaran lebih dari 0.";
  }

  const idBahan = masukan.resep.map((r) => r.bahanBakuId);
  if (new Set(idBahan).size !== idBahan.length) {
    return "Ada bahan yang dipilih lebih dari sekali.";
  }

  const ditemukan = await prisma.bahanBaku.count({
    where: { userId, id: { in: idBahan } },
  });
  if (ditemukan !== idBahan.length) {
    return "Ada bahan yang sudah tidak tersedia. Muat ulang halaman lalu coba lagi.";
  }

  return null;
}

/**
 * Dipakai tombol "Tambah produk" di dashboard. Aturan harganya sama dengan
 * POST /api/produk: mode manual menyimpan `hargaJual` persis seperti yang
 * dikirim; mode target margin menghitung harga di server dari resep dan
 * menyimpan target yang diisi. Sebelumnya mode dan target diabaikan, sehingga
 * produk target margin dari dashboard tersimpan sebagai manual.
 */
export async function tambahProduk(masukan: MasukanTambahProduk): Promise<HasilAksi> {
  const auth = await requireAuth();
  if (!auth.authorized) {
    return { ok: false, error: "Sesi berakhir. Masuk lagi untuk menyimpan." };
  }

  const modeHarga = masukan.modePenentuanHarga ?? "manual";
  if (!isModePenentuanHarga(modeHarga)) {
    return { ok: false, error: "Mode penentuan harga tidak dikenal." };
  }
  if (modeHarga === "targetMargin" && !isTargetMarginPersen(masukan.targetMarginPersen)) {
    return { ok: false, error: "Target margin harus antara 0 sampai 80 persen." };
  }

  const galat = await periksaMasukan(masukan, auth.userId, modeHarga === "manual");
  if (galat) return { ok: false, error: galat };

  const resep = masukan.resep.map((r) => ({
    bahanBakuId: r.bahanBakuId,
    jumlahDipakai: r.jumlahDipakai,
  }));

  try {
    await prisma.$transaction(async (tx) => {
      const targetMarginPersen =
        modeHarga === "targetMargin" ? (masukan.targetMarginPersen as number) : null;
      const hargaSistem =
        targetMarginPersen !== null
          ? await calculateHargaJualTargetMarginDariResep(
              resep,
              auth.userId,
              targetMarginPersen,
              tx,
            )
          : null;

      await tx.produk.create({
        data: {
          nama: masukan.nama.trim(),
          kategori: masukan.kategori?.trim() || "Umum",
          hargaJual: hargaSistem?.hargaJual ?? masukan.hargaJual,
          modePenentuanHarga: modeHarga,
          targetMarginPersen,
          userId: auth.userId,
          resep: { create: resep },
        },
      });
    });
  } catch (error) {
    if (error instanceof PerhitunganHargaTargetError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }

  segarkan(HALAMAN_RELASI_RESEP);
  return { ok: true };
}

export async function perbaruiProduk(
  id: number,
  masukan: MasukanProduk,
): Promise<HasilAksi> {
  const auth = await requireAuth();
  if (!auth.authorized) {
    return { ok: false, error: "Sesi berakhir. Masuk lagi untuk menyimpan." };
  }

  const galat = await periksaMasukan(masukan, auth.userId);
  if (galat) return { ok: false, error: galat };

  const ada = await prisma.produk.findFirst({
    where: { id, userId: auth.userId },
    include: { resep: { select: { bahanBakuId: true } } },
  });
  if (!ada) return { ok: false, error: "Produk tidak ditemukan." };

  const bahanLama = new Set(ada.resep.map((item) => item.bahanBakuId));
  const bahanBaru = new Set(masukan.resep.map((item) => item.bahanBakuId));
  const relasiBahanBerubah =
    bahanLama.size !== bahanBaru.size ||
    [...bahanLama].some((bahanBakuId) => !bahanBaru.has(bahanBakuId));

  // Resep lama dihapus lalu ditulis ulang. Dibungkus transaksi supaya produk
  // tidak pernah tertinggal tanpa resep kalau penulisan gagal di tengah jalan.
  await prisma.$transaction([
    prisma.resep.deleteMany({ where: { produkId: id } }),
    prisma.resep.createMany({
      data: masukan.resep.map((r) => ({
        produkId: id,
        bahanBakuId: r.bahanBakuId,
        jumlahDipakai: r.jumlahDipakai,
      })),
    }),
    prisma.produk.update({
      where: { id, userId: auth.userId },
      data: {
        nama: masukan.nama.trim(),
        kategori: masukan.kategori?.trim() || ada.kategori,
        hargaJual: masukan.hargaJual,
      },
    }),
  ]);

  // Halaman bahan baku hanya menampilkan jumlah produk pemakai. Perubahan
  // nama, harga jual, kategori, atau takaran tidak mengubah angka tersebut.
  segarkan(relasiBahanBerubah ? HALAMAN_RELASI_RESEP : HALAMAN_DATA_PRODUK);
  return { ok: true };
}

/**
 * Menghapus produk beserta resep dan snapshot HPP-nya.
 * Bahan baku tidak ikut terhapus, hanya kaitannya di resep.
 */
export async function hapusProduk(id: number): Promise<HasilAksi> {
  const auth = await requireAuth();
  if (!auth.authorized) {
    return { ok: false, error: "Sesi berakhir. Masuk lagi untuk menghapus." };
  }

  const ada = await prisma.produk.findFirst({ where: { id, userId: auth.userId } });
  if (!ada) return { ok: false, error: "Produk tidak ditemukan." };

  // Schema belum memakai onDelete cascade, jadi relasi dihapus manual dulu.
  await prisma.$transaction([
    prisma.resep.deleteMany({ where: { produkId: id } }),
    prisma.hppSnapshot.deleteMany({ where: { produkId: id } }),
    prisma.produk.delete({ where: { id, userId: auth.userId } }),
  ]);

  segarkan(HALAMAN_RELASI_RESEP);
  return { ok: true };
}

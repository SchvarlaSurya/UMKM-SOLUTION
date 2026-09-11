"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

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

/** Resep menentukan HPP, dan jumlah pemakaian bahan ikut berubah. */
const HALAMAN_TERDAMPAK = ["/produk", "/dashboard", "/bahan-baku"];

function segarkan() {
  for (const halaman of HALAMAN_TERDAMPAK) revalidatePath(halaman);
}

async function periksaMasukan(masukan: MasukanProduk): Promise<string | null> {
  const nama = masukan.nama?.trim() ?? "";
  if (nama === "") return "Nama produk wajib diisi.";
  if (!Number.isFinite(masukan.hargaJual) || masukan.hargaJual <= 0) {
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

  const ditemukan = await prisma.bahanBaku.count({ where: { id: { in: idBahan } } });
  if (ditemukan !== idBahan.length) {
    return "Ada bahan yang sudah tidak tersedia. Muat ulang halaman lalu coba lagi.";
  }

  return null;
}

export async function tambahProduk(masukan: MasukanProduk): Promise<HasilAksi> {
  const auth = await requireAuth();
  if (!auth.authorized) {
    return { ok: false, error: "Sesi berakhir. Masuk lagi untuk menyimpan." };
  }

  const galat = await periksaMasukan(masukan);
  if (galat) return { ok: false, error: galat };

  await prisma.produk.create({
    data: {
      nama: masukan.nama.trim(),
      kategori: masukan.kategori?.trim() || "Umum",
      hargaJual: masukan.hargaJual,
      resep: {
        create: masukan.resep.map((r) => ({
          bahanBakuId: r.bahanBakuId,
          jumlahDipakai: r.jumlahDipakai,
        })),
      },
    },
  });

  segarkan();
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

  const galat = await periksaMasukan(masukan);
  if (galat) return { ok: false, error: galat };

  const ada = await prisma.produk.findUnique({ where: { id } });
  if (!ada) return { ok: false, error: "Produk tidak ditemukan." };

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
      where: { id },
      data: {
        nama: masukan.nama.trim(),
        kategori: masukan.kategori?.trim() || ada.kategori,
        hargaJual: masukan.hargaJual,
      },
    }),
  ]);

  segarkan();
  return { ok: true };
}

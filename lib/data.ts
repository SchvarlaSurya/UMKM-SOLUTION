import {
  bahanBakuMock,
  biayaOperasionalMock,
  historiHargaMock,
  pengaturanMock,
  produkMock,
} from "@/lib/mock/data";
import { turunkanHpp } from "@/lib/mock/hpp";
import type {
  BahanBaku,
  BiayaOperasional,
  HistoriHarga,
  Pengaturan,
  Produk,
  ProdukDenganHpp,
} from "@/lib/types";

/**
 * Satu-satunya pintu data untuk halaman UI.
 * Saat ini mengembalikan data mock; penggantian ke API asli
 * (`fetch('/api/...')`, endpoint sudah tersedia dari Person A)
 * cukup dilakukan di file ini tanpa menyentuh komponen.
 */

export async function getProduk(): Promise<Produk[]> {
  return produkMock;
}

export async function getBahanBaku(): Promise<BahanBaku[]> {
  return bahanBakuMock;
}

export async function getBiayaOperasional(): Promise<BiayaOperasional[]> {
  return biayaOperasionalMock;
}

export async function getPengaturan(): Promise<Pengaturan> {
  return pengaturanMock;
}

/**
 * Belum ada endpoint GET histori harga di backend (model HistoriHarga sudah
 * ada, route-nya belum). Sementara memakai data mock.
 */
export async function getHistoriHarga(bahanBakuId: number): Promise<HistoriHarga[]> {
  return historiHargaMock.filter((h) => h.bahanBakuId === bahanBakuId);
}

/**
 * Produk + hasil HPP untuk tabel dashboard.
 * Nanti diganti gabungan GET /api/produk dan GET /api/produk/hpp-semua.
 */
export async function getProdukDenganHpp(): Promise<ProdukDenganHpp[]> {
  const [produk, biaya, pengaturan] = await Promise.all([
    getProduk(),
    getBiayaOperasional(),
    getPengaturan(),
  ]);
  return turunkanHpp(produk, biaya, pengaturan);
}

/** Jumlah produk yang memakai sebuah bahan baku (kolom "Dipakai di"). */
export async function getPemakaianBahan(): Promise<Map<number, number>> {
  const produk = await getProduk();
  const pemakaian = new Map<number, number>();
  for (const p of produk) {
    for (const r of p.resep) {
      pemakaian.set(r.bahanBakuId, (pemakaian.get(r.bahanBakuId) ?? 0) + 1);
    }
  }
  return pemakaian;
}

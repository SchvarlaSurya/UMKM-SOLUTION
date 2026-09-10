import {
  bahanBakuMock,
  biayaOperasionalMock,
  historiHargaMock,
  pengaturanMock,
  produkMock,
} from "@/lib/mock/data";
import { biayaTetapPerPorsi, rincianHpp, turunkanHpp, type RincianHpp } from "@/lib/mock/hpp";
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

/** Rincian pembentuk HPP per produk, dipakai modal "Rincian HPP". */
export async function getRincianHppSemua(): Promise<Record<number, RincianHpp>> {
  const [produk, biaya, pengaturan] = await Promise.all([
    getProduk(),
    getBiayaOperasional(),
    getPengaturan(),
  ]);
  return Object.fromEntries(
    produk.map((p) => [p.id, rincianHpp(p, biaya, pengaturan)]),
  );
}

export type RingkasanDashboard = {
  totalProduk: number;
  rataMargin: number;
  perluPerhatian: number;
  namaPerluPerhatian: string[];
  batasMarginAman: number;
  biayaTetapPerPorsi: number;
};

/** Angka untuk empat summary card dan alert banner di dashboard. */
export async function getRingkasanDashboard(): Promise<RingkasanDashboard> {
  const [daftar, biaya, pengaturan] = await Promise.all([
    getProdukDenganHpp(),
    getBiayaOperasional(),
    getPengaturan(),
  ]);

  const bermasalah = daftar.filter((p) => !p.statusAman);
  const rataMargin =
    daftar.length === 0
      ? 0
      : daftar.reduce((total, p) => total + p.marginPersen, 0) / daftar.length;

  return {
    totalProduk: daftar.length,
    rataMargin,
    perluPerhatian: bermasalah.length,
    namaPerluPerhatian: bermasalah.map((p) => p.nama),
    batasMarginAman: pengaturan.batasMarginAman,
    biayaTetapPerPorsi: biayaTetapPerPorsi(biaya, pengaturan),
  };
}

export type TitikHarga = { tanggal: string; harga: number };

/** Deret harga sebuah bahan untuk grafik (titik pertama = harga sebelum perubahan). */
export async function getDeretHarga(bahanBakuId: number): Promise<TitikHarga[]> {
  const histori = await getHistoriHarga(bahanBakuId);
  const urut = [...histori].sort(
    (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime(),
  );
  return urut.map((h) => ({ tanggal: h.tanggal, harga: h.hargaBaru }));
}

/** Bahan baku yang punya catatan histori harga (isi dropdown widget & tren). */
export async function getBahanBerhistori(): Promise<BahanBaku[]> {
  const bahan = await getBahanBaku();
  const punyaHistori = new Set(historiHargaMock.map((h) => h.bahanBakuId));
  return bahan.filter((b) => punyaHistori.has(b.id));
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

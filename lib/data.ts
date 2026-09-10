import { prisma } from "@/lib/prisma";
import { biayaTetapPerPorsi, rincianHpp, turunkanHpp, type RincianHpp } from "@/lib/hpp";
import { analyzePriceTrend, type TrendResult } from "@/lib/trendAnalyzer";
import type {
  BahanBaku,
  BiayaOperasional,
  HistoriHarga,
  JenisBiaya,
  Pengaturan,
  Produk,
  ProdukDenganHpp,
} from "@/lib/types";

/**
 * Satu-satunya pintu data untuk halaman UI.
 *
 * Halaman adalah Server Component, jadi query dijalankan langsung lewat Prisma
 * di proses yang sama — tanpa lompatan HTTP ke route sendiri dan tanpa perlu
 * meneruskan cookie sesi. Route di app/api tetap ada untuk pemakaian dari sisi
 * klien dan konsumen luar; keduanya memakai rumus HPP yang sama di lib/hpp.ts.
 *
 * Penjagaan sesi ada di proxy.ts untuk halaman, dan requireAuth() di dalam tiap
 * route handler.
 */

/** Dipakai kalau tabel Pengaturan masih kosong; samakan dengan seed. */
const PENGATURAN_DEFAULT: Pengaturan = {
  id: 0,
  estimasiPorsiPerBulan: 1200,
  batasMarginAman: 30,
};

export async function getBahanBaku(): Promise<BahanBaku[]> {
  const baris = await prisma.bahanBaku.findMany({ orderBy: { nama: "asc" } });
  return baris.map((b) => ({ ...b, updatedAt: b.updatedAt.toISOString() }));
}

export async function getProduk(): Promise<Produk[]> {
  const baris = await prisma.produk.findMany({
    include: { resep: { include: { bahanBaku: true } } },
    orderBy: { nama: "asc" },
  });

  return baris.map((p) => ({
    id: p.id,
    nama: p.nama,
    kategori: p.kategori,
    hargaJual: p.hargaJual,
    resep: p.resep.map((r) => ({
      produkId: r.produkId,
      bahanBakuId: r.bahanBakuId,
      jumlahDipakai: r.jumlahDipakai,
      bahanBaku: { ...r.bahanBaku, updatedAt: r.bahanBaku.updatedAt.toISOString() },
    })),
  }));
}

export async function getBiayaOperasional(): Promise<BiayaOperasional[]> {
  const baris = await prisma.biayaOperasional.findMany({ orderBy: { nama: "asc" } });
  // Kolom `jenis` di schema masih String bebas; dipersempit di sini.
  return baris.map((b) => ({ ...b, jenis: b.jenis as JenisBiaya }));
}

/** Baca saja: pembuatan baris pertama tetap tugas GET /api/pengaturan. */
export async function getPengaturan(): Promise<Pengaturan> {
  return (await prisma.pengaturan.findFirst()) ?? PENGATURAN_DEFAULT;
}

export async function getHistoriHarga(bahanBakuId: number): Promise<HistoriHarga[]> {
  const baris = await prisma.historiHarga.findMany({
    where: { bahanBakuId },
    orderBy: [{ tanggal: "asc" }, { id: "asc" }],
  });
  // `delta` mengikuti bentuk yang dikembalikan GET /api/bahan-baku/[id]/histori.
  return baris.map((h) => ({
    ...h,
    delta: h.hargaBaru - h.hargaLama,
    tanggal: h.tanggal.toISOString(),
  }));
}

/**
 * Produk + hasil HPP untuk tabel dashboard.
 *
 * Sengaja tidak memakai calculateAllHpp() dari lib/hppCalculator.ts: fungsi itu
 * menjalankan beberapa query per produk, sedangkan di sini tiga query cukup
 * untuk seluruh produk. Rumusnya tetap sama karena keduanya memakai lib/hpp.ts.
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
  return Object.fromEntries(produk.map((p) => [p.id, rincianHpp(p, biaya, pengaturan)]));
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

/** Deret harga sebuah bahan untuk grafik. */
export async function getDeretHarga(bahanBakuId: number): Promise<TitikHarga[]> {
  const histori = await getHistoriHarga(bahanBakuId);
  return histori.map((h) => ({ tanggal: h.tanggal, harga: h.hargaBaru }));
}

/** Bahan baku yang punya catatan histori harga (isi dropdown widget & tren). */
export async function getBahanBerhistori(): Promise<BahanBaku[]> {
  const punyaHistori = await prisma.historiHarga.findMany({
    distinct: ["bahanBakuId"],
    select: { bahanBakuId: true },
  });
  if (punyaHistori.length === 0) return [];

  const baris = await prisma.bahanBaku.findMany({
    where: { id: { in: punyaHistori.map((h) => h.bahanBakuId) } },
    orderBy: { nama: "asc" },
  });
  return baris.map((b) => ({ ...b, updatedAt: b.updatedAt.toISOString() }));
}

/**
 * Status tren harga sebuah bahan menurut tiga perubahan terakhir.
 * Memakai analyzePriceTrend dari lib/trendAnalyzer.ts.
 */
export async function getStatusTren(bahanBakuId: number): Promise<TrendResult> {
  const histori = await getHistoriHarga(bahanBakuId);
  return analyzePriceTrend(
    bahanBakuId,
    histori.map((h) => ({
      id: h.id,
      bahanBakuId: h.bahanBakuId,
      hargaLama: h.hargaLama,
      hargaBaru: h.hargaBaru,
      tanggal: new Date(h.tanggal),
    })),
  );
}

/** Jumlah produk yang memakai sebuah bahan baku (kolom "Dipakai di"). */
export async function getPemakaianBahan(): Promise<Map<number, number>> {
  const kelompok = await prisma.resep.groupBy({
    by: ["bahanBakuId"],
    _count: { produkId: true },
  });
  return new Map(kelompok.map((k) => [k.bahanBakuId, k._count.produkId]));
}

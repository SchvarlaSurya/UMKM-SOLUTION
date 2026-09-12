import "server-only";

import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  biayaTetapPerPorsi,
  rincianHpp,
  turunkanHpp,
  type RincianHpp,
} from "@/lib/hpp";
import { analyzePriceTrend, type TrendResult } from "@/lib/trendAnalyzer";
import type {
  BahanBaku,
  BiayaOperasional,
  HistoriHarga,
  Pengaturan,
  Produk,
} from "@/lib/types";

/**
 * Loader data khusus Server Component.
 *
 * Semua fungsi menerima `userId` dari sesi dan setiap query Prisma membatasi
 * data ke user tersebut. Tidak ada fetch ke route API sendiri dan tidak ada
 * cache lintas request, sehingga hasil setelah `router.refresh()` selalu baru.
 */

type BarisBahan = {
  id: number;
  nama: string;
  satuan: string;
  hargaPerSatuan: number;
  updatedAt: Date;
};

type BarisHistori = {
  id: number;
  bahanBakuId: number;
  hargaLama: number;
  hargaBaru: number;
  tanggal: Date;
};

function serialisasiBahan(bahan: BarisBahan): BahanBaku {
  return {
    id: bahan.id,
    nama: bahan.nama,
    satuan: bahan.satuan,
    hargaPerSatuan: bahan.hargaPerSatuan,
    updatedAt: bahan.updatedAt.toISOString(),
  };
}

function serialisasiHistori(histori: BarisHistori): HistoriHarga {
  return {
    id: histori.id,
    bahanBakuId: histori.bahanBakuId,
    hargaLama: histori.hargaLama,
    hargaBaru: histori.hargaBaru,
    delta: histori.hargaBaru - histori.hargaLama,
    tanggal: histori.tanggal.toISOString(),
  };
}

async function ambilBahanBaku(userId: number): Promise<BahanBaku[]> {
  const bahan = await prisma.bahanBaku.findMany({
    where: { userId },
    orderBy: { nama: "asc" },
    select: {
      id: true,
      nama: true,
      satuan: true,
      hargaPerSatuan: true,
      updatedAt: true,
    },
  });

  return bahan.map(serialisasiBahan);
}

async function ambilProduk(userId: number): Promise<Produk[]> {
  const produk = await prisma.produk.findMany({
    where: { userId },
    orderBy: { nama: "asc" },
    select: {
      id: true,
      nama: true,
      kategori: true,
      hargaJual: true,
      modePenentuanHarga: true,
      targetMarginPersen: true,
      resep: {
        where: {
          produk: { userId },
          bahanBaku: { userId },
        },
        select: {
          produkId: true,
          bahanBakuId: true,
          jumlahDipakai: true,
          bahanBaku: {
            select: {
              id: true,
              nama: true,
              satuan: true,
              hargaPerSatuan: true,
              updatedAt: true,
            },
          },
        },
      },
    },
  });

  return produk.map((item) => ({
    ...item,
    modePenentuanHarga: item.modePenentuanHarga as Produk["modePenentuanHarga"],
    resep: item.resep.map((baris) => ({
      ...baris,
      bahanBaku: serialisasiBahan(baris.bahanBaku),
    })),
  }));
}

async function ambilBiayaOperasional(userId: number): Promise<BiayaOperasional[]> {
  const biaya = await prisma.biayaOperasional.findMany({
    where: { userId },
    orderBy: { nama: "asc" },
    select: { id: true, nama: true, jenis: true, nilai: true },
  });

  return biaya.map((item) => ({
    ...item,
    jenis: item.jenis as BiayaOperasional["jenis"],
  }));
}

/** Pertahankan perilaku lama: baris default dibuat saat pertama kali dibaca. */
async function ambilPengaturan(userId: number): Promise<Pengaturan> {
  try {
    return await prisma.pengaturan.upsert({
      where: { userId },
      update: {},
      create: { userId },
      omit: { userId: true },
    });
  } catch (error) {
    // Dua render awal akun yang sama dapat membuat baris secara bersamaan.
    // Setelah salah satunya menang, baca baris tersebut alih-alih gagal P2002.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const pengaturan = await prisma.pengaturan.findUnique({
        where: { userId },
        omit: { userId: true },
      });
      if (pengaturan) return pengaturan;
    }

    throw error;
  }
}

async function ambilPemakaianBahan(userId: number): Promise<Map<number, number>> {
  const resep = await prisma.resep.findMany({
    where: {
      produk: { userId },
      bahanBaku: { userId },
    },
    select: { bahanBakuId: true },
  });
  const pemakaian = new Map<number, number>();

  for (const baris of resep) {
    pemakaian.set(baris.bahanBakuId, (pemakaian.get(baris.bahanBakuId) ?? 0) + 1);
  }

  return pemakaian;
}

function analisaTrenAman(bahanBakuId: number, histori: BarisHistori[]): TrendResult {
  try {
    return analyzePriceTrend(bahanBakuId, histori);
  } catch (error) {
    console.error(`[data] histori harga bahan ${bahanBakuId} tidak bisa dianalisa:`, error);
    return {
      bahanBakuId,
      status: "data_belum_cukup",
      trenNaik: false,
      jumlahPerubahanDiperiksa: 0,
    };
  }
}

export type RingkasanDashboard = {
  totalProduk: number;
  rataMargin: number;
  perluPerhatian: number;
  namaPerluPerhatian: string[];
  batasMarginAman: number;
  biayaTetapPerPorsi: number;
};

export type TitikHarga = { tanggal: string; harga: number };

/** Satu loader untuk seluruh data dashboard agar dataset per render konsisten. */
export async function getDataDashboard(userId: number) {
  const [barisBahan, produk, biaya, pengaturan] = await Promise.all([
    prisma.bahanBaku.findMany({
      where: { userId },
      orderBy: { nama: "asc" },
      select: {
        id: true,
        nama: true,
        satuan: true,
        hargaPerSatuan: true,
        updatedAt: true,
        histori: {
          orderBy: [{ tanggal: "asc" }, { id: "asc" }],
          select: {
            id: true,
            bahanBakuId: true,
            hargaLama: true,
            hargaBaru: true,
            tanggal: true,
          },
        },
      },
    }),
    ambilProduk(userId),
    ambilBiayaOperasional(userId),
    ambilPengaturan(userId),
  ]);

  const bahan = barisBahan.map(serialisasiBahan);
  const produkDenganHpp = turunkanHpp(produk, biaya, pengaturan);
  const rincian: Record<number, RincianHpp> = Object.fromEntries(
    produk.map((item) => [item.id, rincianHpp(item, biaya, pengaturan)]),
  );
  const bermasalah = produkDenganHpp.filter((item) => !item.statusAman);
  const rataMargin =
    produkDenganHpp.length === 0
      ? 0
      : produkDenganHpp.reduce((total, item) => total + item.marginPersen, 0) /
        produkDenganHpp.length;
  const ringkasan: RingkasanDashboard = {
    totalProduk: produkDenganHpp.length,
    rataMargin,
    perluPerhatian: bermasalah.length,
    namaPerluPerhatian: bermasalah.map((item) => item.nama),
    batasMarginAman: pengaturan.batasMarginAman,
    biayaTetapPerPorsi: biayaTetapPerPorsi(biaya, pengaturan),
  };

  const bahanBerhistori: BahanBaku[] = [];
  const deret: Record<number, TitikHarga[]> = {};
  for (const item of barisBahan) {
    if (item.histori.length === 0) continue;
    bahanBerhistori.push(serialisasiBahan(item));
    deret[item.id] = item.histori.map((histori) => ({
      tanggal: histori.tanggal.toISOString(),
      harga: histori.hargaBaru,
    }));
  }

  return { bahan, bahanBerhistori, deret, produk: produkDenganHpp, rincian, ringkasan };
}

export async function getDataHalamanBahanBaku(userId: number) {
  const [bahan, pemakaian] = await Promise.all([
    ambilBahanBaku(userId),
    ambilPemakaianBahan(userId),
  ]);

  return { bahan, pemakaian: Object.fromEntries(pemakaian) };
}

export async function getDataHalamanBiayaOperasional(userId: number) {
  const [biaya, pengaturan] = await Promise.all([
    ambilBiayaOperasional(userId),
    ambilPengaturan(userId),
  ]);

  return { biaya, pengaturan };
}

export async function getDataHalamanProduk(userId: number) {
  const [produk, bahan, biaya, pengaturan] = await Promise.all([
    ambilProduk(userId),
    ambilBahanBaku(userId),
    ambilBiayaOperasional(userId),
    ambilPengaturan(userId),
  ]);

  return { produk: turunkanHpp(produk, biaya, pengaturan), bahan };
}

export async function getDataHalamanTren(userId: number) {
  const [barisBahan, pemakaian] = await Promise.all([
    prisma.bahanBaku.findMany({
      where: { userId, histori: { some: {} } },
      orderBy: { nama: "asc" },
      select: {
        id: true,
        nama: true,
        satuan: true,
        hargaPerSatuan: true,
        updatedAt: true,
        histori: {
          orderBy: [{ tanggal: "asc" }, { id: "asc" }],
          select: {
            id: true,
            bahanBakuId: true,
            hargaLama: true,
            hargaBaru: true,
            tanggal: true,
          },
        },
      },
    }),
    ambilPemakaianBahan(userId),
  ]);

  const bahan = barisBahan.map(serialisasiBahan);
  const histori: Record<number, HistoriHarga[]> = {};
  const tren: Record<number, TrendResult> = {};

  for (const item of barisBahan) {
    histori[item.id] = item.histori.map(serialisasiHistori);
    tren[item.id] = analisaTrenAman(item.id, item.histori);
  }

  return {
    bahan,
    histori,
    pemakaian: Object.fromEntries(pemakaian),
    tren,
  };
}

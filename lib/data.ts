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

/** Kelompokkan baris per kunci; urutan di dalam tiap kelompok dipertahankan. */
function kelompokkanPer<T>(baris: readonly T[], kunci: (item: T) => number): Map<number, T[]> {
  const hasil = new Map<number, T[]>();
  for (const item of baris) {
    const k = kunci(item);
    const kelompok = hasil.get(k);
    if (kelompok) kelompok.push(item);
    else hasil.set(k, [item]);
  }
  return hasil;
}

/*
 * Kenapa query datar, bukan relasi bersarang:
 *
 * Tanpa preview feature `relationJoins`, Prisma mengirim satu query SQL per
 * tingkat relasi, berurutan. Dengan database yang round trip-nya ratusan
 * milidetik, `produk -> resep -> bahanBaku` jadi tiga kali lebih lambat dari
 * satu query. Query datar di bawah jalan paralel, jadi waktu tunggunya kurang
 * lebih sama dengan satu query, lalu digabung di JS.
 */

async function ambilBarisBahan(userId: number): Promise<BarisBahan[]> {
  return prisma.bahanBaku.findMany({
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
}

async function ambilBarisHistori(userId: number): Promise<BarisHistori[]> {
  return prisma.historiHarga.findMany({
    where: { bahanBaku: { userId } },
    orderBy: [{ tanggal: "asc" }, { id: "asc" }],
    select: {
      id: true,
      bahanBakuId: true,
      hargaLama: true,
      hargaBaru: true,
      tanggal: true,
    },
  });
}

/**
 * Produk beserta resepnya. Pemanggil yang sudah mengambil bahan untuk
 * keperluan lain mengoper promise-nya lewat `barisBahanSiap`, supaya tidak ada
 * query bahan kedua.
 */
async function ambilProduk(
  userId: number,
  barisBahanSiap?: Promise<BarisBahan[]>,
): Promise<Produk[]> {
  const [produk, resep, barisBahan] = await Promise.all([
    prisma.produk.findMany({
      where: { userId },
      orderBy: { nama: "asc" },
      select: {
        id: true,
        nama: true,
        kategori: true,
        hargaJual: true,
        modePenentuanHarga: true,
        targetMarginPersen: true,
      },
    }),
    // Sengaja tanpa orderBy, sama seperti relasi bersarang sebelumnya: urutan
    // resep yang tampil di UI mengikuti urutan baris tersimpan. Tabel Resep
    // tidak punya kolom id/createdAt untuk mengurutkan secara eksplisit.
    prisma.resep.findMany({
      where: {
        produk: { userId },
        bahanBaku: { userId },
      },
      select: { produkId: true, bahanBakuId: true, jumlahDipakai: true },
    }),
    barisBahanSiap ?? ambilBarisBahan(userId),
  ]);

  const bahanPerId = new Map(barisBahan.map((b) => [b.id, serialisasiBahan(b)]));
  const resepPerProduk = kelompokkanPer(resep, (r) => r.produkId);

  return produk.map((item) => ({
    ...item,
    modePenentuanHarga: item.modePenentuanHarga as Produk["modePenentuanHarga"],
    resep: (resepPerProduk.get(item.id) ?? []).flatMap((baris) => {
      // Query resep sudah memfilter `bahanBaku: { userId }`, jadi bahannya
      // selalu ada di daftar bahan user. Pemeriksaan ini hanya penjaga.
      const bahanBaku = bahanPerId.get(baris.bahanBakuId);
      return bahanBaku ? [{ ...baris, bahanBaku }] : [];
    }),
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

/**
 * Pertahankan perilaku lama: baris default dibuat saat pertama kali dibaca.
 *
 * Sengaja bukan `upsert`. Upsert Prisma butuh beberapa round trip (transaksi,
 * baca, tulis) dan terukur ~1.4 detik ke database ini, padahal barisnya hampir
 * selalu sudah ada. Jalur normal cukup satu `findUnique`; `create` hanya untuk
 * akun yang belum pernah punya baris.
 */
async function ambilPengaturan(userId: number): Promise<Pengaturan> {
  const ada = await prisma.pengaturan.findUnique({
    where: { userId },
    omit: { userId: true },
  });
  if (ada) return ada;

  try {
    return await prisma.pengaturan.create({
      data: { userId },
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

/**
 * Satu catatan perubahan harga untuk widget dashboard. `harga` adalah harga
 * sesudah perubahan; `hargaLama` harga sebelumnya, dibutuhkan sebagai baseline
 * supaya bahan yang baru berubah sekali tidak terbaca "Stabil".
 */
export type TitikHarga = { tanggal: string; harga: number; hargaLama: number };

/** Satu loader untuk seluruh data dashboard agar dataset per render konsisten. */
export async function getDataDashboard(userId: number) {
  // Satu lapis paralel. Promise bahan dipakai dua kali (output `bahan` dan
  // penggabungan resep), jadi bahan hanya diambil sekali.
  const barisBahanSiap = ambilBarisBahan(userId);
  const [barisBahan, barisHistori, produk, biaya, pengaturan] = await Promise.all([
    barisBahanSiap,
    ambilBarisHistori(userId),
    ambilProduk(userId, barisBahanSiap),
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

  const historiPerBahan = kelompokkanPer(barisHistori, (h) => h.bahanBakuId);
  const bahanBerhistori: BahanBaku[] = [];
  const deret: Record<number, TitikHarga[]> = {};
  for (const item of barisBahan) {
    const histori = historiPerBahan.get(item.id);
    if (!histori) continue;
    bahanBerhistori.push(serialisasiBahan(item));
    deret[item.id] = histori.map((baris) => ({
      tanggal: baris.tanggal.toISOString(),
      harga: baris.hargaBaru,
      hargaLama: baris.hargaLama,
    }));
  }

  return { bahan, bahanBerhistori, deret, produk: produkDenganHpp, rincian, ringkasan };
}

export async function getDataHalamanBahanBaku(userId: number) {
  const [barisBahan, pemakaian] = await Promise.all([
    ambilBarisBahan(userId),
    ambilPemakaianBahan(userId),
  ]);

  return { bahan: barisBahan.map(serialisasiBahan), pemakaian: Object.fromEntries(pemakaian) };
}

export async function getDataHalamanBiayaOperasional(userId: number) {
  const [biaya, pengaturan] = await Promise.all([
    ambilBiayaOperasional(userId),
    ambilPengaturan(userId),
  ]);

  return { biaya, pengaturan };
}

export async function getDataHalamanProduk(userId: number) {
  const barisBahanSiap = ambilBarisBahan(userId);
  const [produk, barisBahan, biaya, pengaturan] = await Promise.all([
    ambilProduk(userId, barisBahanSiap),
    barisBahanSiap,
    ambilBiayaOperasional(userId),
    ambilPengaturan(userId),
  ]);

  return {
    produk: turunkanHpp(produk, biaya, pengaturan),
    bahan: barisBahan.map(serialisasiBahan),
  };
}

export async function getDataHalamanTren(userId: number) {
  const [barisBahan, barisHistori, pemakaian] = await Promise.all([
    ambilBarisBahan(userId),
    ambilBarisHistori(userId),
    ambilPemakaianBahan(userId),
  ]);

  const historiPerBahan = kelompokkanPer(barisHistori, (h) => h.bahanBakuId);
  const bahan: BahanBaku[] = [];
  const histori: Record<number, HistoriHarga[]> = {};
  const tren: Record<number, TrendResult> = {};

  // Hanya bahan yang punya histori, setara filter lama `histori: { some: {} }`.
  for (const item of barisBahan) {
    const baris = historiPerBahan.get(item.id);
    if (!baris) continue;
    bahan.push(serialisasiBahan(item));
    histori[item.id] = baris.map(serialisasiHistori);
    tren[item.id] = analisaTrenAman(item.id, baris);
  }

  return {
    bahan,
    histori,
    pemakaian: Object.fromEntries(pemakaian),
    tren,
  };
}

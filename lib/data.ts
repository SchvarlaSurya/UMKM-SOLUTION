import { apiGet } from "@/lib/api";
import { biayaTetapPerPorsi, rincianHpp, type RincianHpp } from "@/lib/hpp";
import type { TrendResult } from "@/lib/trendAnalyzer";
import type {
  BahanBaku,
  BiayaOperasional,
  HistoriHarga,
  HppResult,
  Pengaturan,
  Produk,
  ProdukDenganHpp,
} from "@/lib/types";

/**
 * Satu-satunya pintu data untuk halaman UI.
 *
 * Seluruh pembacaan lewat endpoint di app/api, dipanggil dari Server Component
 * memakai lib/api.ts yang meneruskan cookie sesi. Halaman tidak menyentuh
 * Prisma langsung, jadi aturan dan bentuk data hanya ditentukan satu tempat:
 * route handler.
 */

/** Bentuk balasan GET /api/bahan-baku/[id]/histori. */
type BalasanHistori = {
  bahanBaku: Pick<BahanBaku, "id" | "nama" | "satuan" | "hargaPerSatuan">;
  histori: HistoriHarga[];
  trenNaik: boolean;
  statusTren: TrendResult["status"];
  jumlahPerubahanDiperiksa: number;
};

export async function getBahanBaku(): Promise<BahanBaku[]> {
  return apiGet<BahanBaku[]>("/bahan-baku");
}

export async function getProduk(): Promise<Produk[]> {
  return apiGet<Produk[]>("/produk");
}

export async function getBiayaOperasional(): Promise<BiayaOperasional[]> {
  return apiGet<BiayaOperasional[]>("/biaya-operasional");
}

export async function getPengaturan(): Promise<Pengaturan> {
  return apiGet<Pengaturan>("/pengaturan");
}

export async function getHistoriHarga(bahanBakuId: number): Promise<HistoriHarga[]> {
  const balasan = await apiGet<BalasanHistori>(`/bahan-baku/${bahanBakuId}/histori`);
  return balasan.histori;
}

/**
 * Produk + hasil HPP untuk tabel dashboard dan kartu produk.
 * HPP diambil dari endpoint, bukan dihitung ulang di sini.
 */
export async function getProdukDenganHpp(): Promise<ProdukDenganHpp[]> {
  const [produk, hpp] = await Promise.all([
    getProduk(),
    apiGet<HppResult[]>("/produk/hpp-semua"),
  ]);

  const hppById = new Map(hpp.map((h) => [h.produkId, h]));

  return produk.map((p) => {
    const hasil = hppById.get(p.id);
    return {
      ...p,
      hppTerhitung: hasil?.hppTerhitung ?? 0,
      marginPersen: hasil?.marginPersen ?? 0,
      statusAman: hasil?.statusAman ?? false,
    };
  });
}

/**
 * Rincian pembentuk HPP per produk untuk modal "Rincian HPP".
 *
 * Belum ada endpoint yang memecah HPP jadi per komponen, jadi uraiannya
 * disusun di sini dari data yang sudah diambil, memakai rumus yang sama
 * dengan backend di lib/hpp.ts.
 */
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

/**
 * Bahan baku yang punya catatan histori harga, untuk dropdown widget dan
 * halaman tren.
 *
 * Belum ada endpoint yang menjawab ini dalam satu panggilan, jadi histori tiap
 * bahan diperiksa satu per satu secara paralel. Kalau daftar bahan tumbuh
 * besar, endpoint ringkasan dari backend akan jauh lebih hemat.
 */
export async function getBahanBerhistori(): Promise<BahanBaku[]> {
  const bahan = await getBahanBaku();

  const diperiksa = await Promise.all(
    bahan.map(async (b) => ({
      bahan: b,
      punyaHistori: (await getHistoriHarga(b.id)).length > 0,
    })),
  );

  return diperiksa.filter((d) => d.punyaHistori).map((d) => d.bahan);
}

/** Status tren harga sebuah bahan menurut tiga perubahan terakhir. */
export async function getStatusTren(bahanBakuId: number): Promise<TrendResult> {
  const balasan = await apiGet<BalasanHistori>(`/bahan-baku/${bahanBakuId}/histori`);
  return {
    bahanBakuId,
    status: balasan.statusTren,
    trenNaik: balasan.trenNaik,
    jumlahPerubahanDiperiksa: balasan.jumlahPerubahanDiperiksa,
  };
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

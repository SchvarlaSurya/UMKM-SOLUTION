/**
 * Bentuk data di sini mengikuti response endpoint di `app/api/*` persis,
 * supaya penggantian sumber data mock -> API asli tidak mengubah komponen.
 */

export type BahanBaku = {
  id: number;
  nama: string;
  satuan: string;
  hargaPerSatuan: number;
  updatedAt: string;
};

export type Resep = {
  produkId: number;
  bahanBakuId: number;
  jumlahDipakai: number;
  bahanBaku: BahanBaku;
};

export type Produk = {
  id: number;
  nama: string;
  kategori: string;
  hargaJual: number;
  resep: Resep[];
};

export type JenisBiaya = "tetap" | "persentase";

export type BiayaOperasional = {
  id: number;
  nama: string;
  jenis: JenisBiaya;
  nilai: number;
};

export type Pengaturan = {
  id: number;
  estimasiPorsiPerBulan: number;
  batasMarginAman: number;
};

/** Sama dengan `HppResult` di lib/hppCalculator.ts. */
export type HppResult = {
  produkId: number;
  hppTerhitung: number;
  marginPersen: number;
  statusAman: boolean;
};

export type HistoriHarga = {
  id: number;
  bahanBakuId: number;
  hargaLama: number;
  hargaBaru: number;
  /** Sudah dihitung backend: `hargaBaru - hargaLama`. Negatif berarti harga turun. */
  delta: number;
  tanggal: string;
};

export type StatusTren = "tren_naik" | "bukan_tren_naik" | "data_belum_cukup";

/** Response `GET /api/bahan-baku/[id]/histori`. Histori urut tanggal naik. */
export type HistoriHargaResponse = {
  bahanBaku: Pick<BahanBaku, "id" | "nama" | "satuan" | "hargaPerSatuan">;
  histori: HistoriHarga[];
  trenNaik: boolean;
  statusTren: StatusTren;
  /** Berapa perubahan terakhir yang dipakai untuk menilai tren (maksimal 3). */
  jumlahPerubahanDiperiksa: number;
};

/** Baris tabel dashboard: produk digabung hasil perhitungan HPP-nya. */
export type ProdukDenganHpp = Produk & {
  hppTerhitung: number;
  marginPersen: number;
  statusAman: boolean;
};

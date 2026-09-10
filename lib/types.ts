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
  tanggal: string;
};

/** Baris tabel dashboard: produk digabung hasil perhitungan HPP-nya. */
export type ProdukDenganHpp = Produk & {
  hppTerhitung: number;
  marginPersen: number;
  statusAman: boolean;
};

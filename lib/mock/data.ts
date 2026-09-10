import type {
  BahanBaku,
  BiayaOperasional,
  HistoriHarga,
  Pengaturan,
  Produk,
} from "@/lib/types";

/**
 * Data demo untuk pengembangan UI sebelum tersambung ke API.
 * Angka mengikuti prototipe "Ruang Margin" (8 produk, 10 bahan baku).
 */

const UPDATED_AT = "2026-09-09T00:00:00.000Z";

/** Identitas usaha untuk header sidebar (nanti dari session NextAuth). */
export const profilUsahaMock = {
  namaUsaha: "Dapur Bu Sari",
  kategoriUsaha: "Usaha kuliner",
  namaPemilik: "Bu Sari",
  peran: "Pemilik usaha",
};

export const bahanBakuMock: BahanBaku[] = [
  { id: 1, nama: "Ayam fillet", satuan: "kg", hargaPerSatuan: 42000, updatedAt: UPDATED_AT },
  { id: 2, nama: "Beras", satuan: "kg", hargaPerSatuan: 15000, updatedAt: UPDATED_AT },
  { id: 3, nama: "Minyak goreng", satuan: "liter", hargaPerSatuan: 20000, updatedAt: UPDATED_AT },
  { id: 4, nama: "Cabai rawit", satuan: "kg", hargaPerSatuan: 65000, updatedAt: UPDATED_AT },
  { id: 5, nama: "Tepung terigu", satuan: "kg", hargaPerSatuan: 12000, updatedAt: UPDATED_AT },
  { id: 6, nama: "Telur ayam", satuan: "butir", hargaPerSatuan: 2000, updatedAt: UPDATED_AT },
  { id: 7, nama: "Mi telur", satuan: "kg", hargaPerSatuan: 18000, updatedAt: UPDATED_AT },
  { id: 8, nama: "Teh", satuan: "gram", hargaPerSatuan: 100, updatedAt: UPDATED_AT },
  { id: 9, nama: "Gula pasir", satuan: "kg", hargaPerSatuan: 18000, updatedAt: UPDATED_AT },
  { id: 10, nama: "Bumbu racik", satuan: "gram", hargaPerSatuan: 80, updatedAt: UPDATED_AT },
];

const bahanById = new Map(bahanBakuMock.map((b) => [b.id, b]));

/** Bentuk resep ringkas -> dilengkapi relasi bahanBaku seperti response API. */
function buatProduk(
  id: number,
  nama: string,
  kategori: string,
  hargaJual: number,
  komposisi: Array<[bahanBakuId: number, jumlahDipakai: number]>,
): Produk {
  return {
    id,
    nama,
    kategori,
    hargaJual,
    resep: komposisi.map(([bahanBakuId, jumlahDipakai]) => ({
      produkId: id,
      bahanBakuId,
      jumlahDipakai,
      bahanBaku: bahanById.get(bahanBakuId)!,
    })),
  };
}

export const produkMock: Produk[] = [
  buatProduk(1, "Nasi Ayam Geprek", "Makanan utama", 22000, [
    [1, 0.18],
    [2, 0.2],
    [3, 0.05],
    [4, 0.05],
    [10, 20],
  ]),
  buatProduk(2, "Nasi Goreng Spesial", "Makanan utama", 20000, [
    [2, 0.25],
    [6, 1],
    [3, 0.04],
    [10, 25],
  ]),
  buatProduk(3, "Ayam Crispy", "Lauk & camilan", 15000, [
    [1, 0.2],
    [5, 0.08],
    [3, 0.06],
    [10, 15],
  ]),
  buatProduk(4, "Mi Goreng Jawa", "Makanan utama", 18000, [
    [7, 0.15],
    [6, 1],
    [3, 0.04],
    [10, 25],
  ]),
  buatProduk(5, "Telur Dadar Crispy", "Lauk & camilan", 10000, [
    [6, 2],
    [5, 0.03],
    [3, 0.05],
    [10, 10],
  ]),
  buatProduk(6, "Nasi Putih", "Pelengkap", 5000, [[2, 0.15]]),
  buatProduk(7, "Es Teh Manis", "Minuman", 6000, [
    [8, 5],
    [9, 0.02],
  ]),
  buatProduk(8, "Ayam Sambal Matah", "Makanan utama", 25000, [
    [1, 0.2],
    [2, 0.2],
    [4, 0.06],
    [3, 0.04],
    [10, 20],
  ]),
];

export const biayaOperasionalMock: BiayaOperasional[] = [
  { id: 1, nama: "Gas LPG", jenis: "tetap", nilai: 300000 },
  { id: 2, nama: "Listrik", jenis: "tetap", nilai: 250000 },
  { id: 3, nama: "Air", jenis: "tetap", nilai: 70000 },
  { id: 4, nama: "Kemasan", jenis: "tetap", nilai: 100000 },
  { id: 5, nama: "Komisi aplikasi pesan antar", jenis: "persentase", nilai: 5 },
];

export const pengaturanMock: Pengaturan = {
  id: 1,
  estimasiPorsiPerBulan: 1200,
  batasMarginAman: 30,
};

/** Histori harga 30 hari terakhir (widget dashboard & halaman tren). */
const historiHargaDasar: Omit<HistoriHarga, "delta">[] = [
  // Cabai rawit — naik terus
  { id: 1, bahanBakuId: 4, hargaLama: 57000, hargaBaru: 57000, tanggal: "2026-08-10T00:00:00.000Z" },
  { id: 2, bahanBakuId: 4, hargaLama: 57000, hargaBaru: 58500, tanggal: "2026-08-16T00:00:00.000Z" },
  { id: 3, bahanBakuId: 4, hargaLama: 58500, hargaBaru: 60000, tanggal: "2026-08-22T00:00:00.000Z" },
  { id: 4, bahanBakuId: 4, hargaLama: 60000, hargaBaru: 61500, tanggal: "2026-08-28T00:00:00.000Z" },
  { id: 5, bahanBakuId: 4, hargaLama: 61500, hargaBaru: 63000, tanggal: "2026-09-03T00:00:00.000Z" },
  { id: 6, bahanBakuId: 4, hargaLama: 63000, hargaBaru: 65000, tanggal: "2026-09-09T00:00:00.000Z" },

  // Ayam fillet — naik tipis lalu turun
  { id: 7, bahanBakuId: 1, hargaLama: 41000, hargaBaru: 41000, tanggal: "2026-08-11T00:00:00.000Z" },
  { id: 8, bahanBakuId: 1, hargaLama: 41000, hargaBaru: 43500, tanggal: "2026-08-19T00:00:00.000Z" },
  { id: 9, bahanBakuId: 1, hargaLama: 43500, hargaBaru: 44000, tanggal: "2026-08-27T00:00:00.000Z" },
  { id: 10, bahanBakuId: 1, hargaLama: 44000, hargaBaru: 42000, tanggal: "2026-09-06T00:00:00.000Z" },

  // Minyak goreng — stabil
  { id: 11, bahanBakuId: 3, hargaLama: 19500, hargaBaru: 19500, tanggal: "2026-08-12T00:00:00.000Z" },
  { id: 12, bahanBakuId: 3, hargaLama: 19500, hargaBaru: 20000, tanggal: "2026-08-24T00:00:00.000Z" },
  { id: 13, bahanBakuId: 3, hargaLama: 20000, hargaBaru: 20000, tanggal: "2026-09-05T00:00:00.000Z" },
];

/** `delta` ditambahkan di sini supaya bentuknya sama dengan response API asli. */
export const historiHargaMock: HistoriHarga[] = historiHargaDasar.map((h) => ({
  ...h,
  delta: h.hargaBaru - h.hargaLama,
}));

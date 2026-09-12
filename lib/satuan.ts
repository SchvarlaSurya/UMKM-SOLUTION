/**
 * Kelompok satuan yang bisa saling dikonversi.
 *
 * `faktorKeSatuanTerkecil` menyatakan nilai satu unit dalam unit terkecil di
 * kelompoknya. Tambahkan pasangan baru di sini tanpa mengubah form produk.
 */
export const KELOMPOK_KONVERSI_SATUAN = [
  {
    nama: "massa",
    satuan: [
      { nama: "kg", faktorKeSatuanTerkecil: 1000 },
      { nama: "gram", faktorKeSatuanTerkecil: 1 },
    ],
  },
  {
    nama: "volume",
    satuan: [
      { nama: "liter", faktorKeSatuanTerkecil: 1000 },
      { nama: "ml", faktorKeSatuanTerkecil: 1 },
    ],
  },
] as const;

export type PilihanSatuan = {
  nilai: string;
  label: string;
};

/** Cocokkan satuan bebas tanpa membedakan kapital dan spasi berlebih. */
export function normalisasiSatuan(satuan: string): string {
  return satuan.trim().replace(/\s+/g, " ").toLowerCase();
}

function cariSatuan(satuan: string) {
  const nama = normalisasiSatuan(satuan);

  for (const kelompok of KELOMPOK_KONVERSI_SATUAN) {
    const ditemukan = kelompok.satuan.find((item) => item.nama === nama);
    if (ditemukan) return { kelompok, satuan: ditemukan };
  }

  return null;
}

/**
 * Satuan dasar selalu menjadi opsi pertama. Satuan hitung atau teks bebas yang
 * tidak ada di pemetaan hanya menghasilkan satu opsi dan tidak dikonversi.
 */
export function pilihanSatuanUntuk(satuanDasar: string): PilihanSatuan[] {
  const dasar = cariSatuan(satuanDasar);
  const labelDasar = satuanDasar.trim();

  if (!dasar) {
    return [{ nilai: normalisasiSatuan(satuanDasar), label: labelDasar }];
  }

  return [
    { nilai: dasar.satuan.nama, label: labelDasar || dasar.satuan.nama },
    ...dasar.kelompok.satuan
      .filter((item) => item.nama !== dasar.satuan.nama)
      .map((item) => ({ nilai: item.nama, label: item.nama })),
  ];
}

/** Ubah jumlah dari satuan pilihan form kembali ke satuan dasar bahan. */
export function konversiKeSatuanDasar(
  jumlah: number,
  satuanDipilih: string,
  satuanDasar: string,
): number {
  const dasar = cariSatuan(satuanDasar);
  if (!dasar) return jumlah;

  const pilihan = dasar.kelompok.satuan.find(
    (item) => item.nama === normalisasiSatuan(satuanDipilih),
  );
  if (!pilihan) return jumlah;

  return (
    (jumlah * pilihan.faktorKeSatuanTerkecil) /
    dasar.satuan.faktorKeSatuanTerkecil
  );
}

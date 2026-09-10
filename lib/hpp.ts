import type { Pengaturan, Produk, ProdukDenganHpp } from "@/lib/types";

/**
 * Rumus HPP dalam bentuk fungsi murni, tanpa sentuhan database.
 *
 * Satu-satunya sumber rumus di aplikasi ini: lib/hppCalculator.ts memakainya
 * setelah mengambil data dari Prisma, dan lib/data.ts memakainya untuk
 * tampilan agregat supaya dashboard tidak perlu memanggil calculateHpp()
 * sekali per produk.
 *
 * HPP  = biaya bahan sesuai resep + alokasi biaya tetap per porsi
 * Margin = (harga jual − HPP − potongan persentase) ÷ harga jual
 */

/**
 * Bentuk minimal yang dibutuhkan rumus, sengaja longgar supaya baris hasil
 * Prisma (yang `jenis`-nya masih String dan `updatedAt`-nya Date) maupun tipe
 * UI di lib/types.ts sama-sama diterima tanpa konversi.
 */
export type MasukanBiaya = { jenis: string; nilai: number };
export type MasukanPengaturan = Pick<Pengaturan, "estimasiPorsiPerBulan" | "batasMarginAman">;
export type MasukanProduk = {
  hargaJual: number;
  resep: ReadonlyArray<{
    jumlahDipakai: number;
    bahanBaku: { hargaPerSatuan: number };
  }>;
};

export type KomponenBiaya = {
  biayaTetapPerPorsi: number;
  persenKomisi: number;
};

/** Bagian biaya operasional yang sama untuk semua produk, cukup dihitung sekali. */
export function komponenBiaya(
  biaya: readonly MasukanBiaya[],
  pengaturan: MasukanPengaturan,
): KomponenBiaya {
  const totalTetapPerBulan = biaya
    .filter((b) => b.jenis === "tetap")
    .reduce((total, b) => total + b.nilai, 0);

  return {
    biayaTetapPerPorsi:
      pengaturan.estimasiPorsiPerBulan > 0
        ? totalTetapPerBulan / pengaturan.estimasiPorsiPerBulan
        : 0,
    persenKomisi: biaya
      .filter((b) => b.jenis === "persentase")
      .reduce((total, b) => total + b.nilai, 0),
  };
}

export type HasilHpp = {
  hppTerhitung: number;
  marginPersen: number;
  statusAman: boolean;
};

export function hitungHpp(
  biayaBahan: number,
  hargaJual: number,
  { biayaTetapPerPorsi, persenKomisi }: KomponenBiaya,
  batasMarginAman: number,
): HasilHpp {
  const hppTerhitung = biayaBahan + biayaTetapPerPorsi;
  const potonganKomisi = hargaJual * (persenKomisi / 100);
  const marginPersen =
    hargaJual > 0 ? ((hargaJual - hppTerhitung - potonganKomisi) / hargaJual) * 100 : 0;

  return {
    hppTerhitung,
    marginPersen,
    statusAman: marginPersen >= batasMarginAman,
  };
}

/** Total biaya bahan satu porsi menurut resepnya. */
export function biayaBahanProduk(produk: MasukanProduk): number {
  return produk.resep.reduce(
    (total, r) => total + r.jumlahDipakai * r.bahanBaku.hargaPerSatuan,
    0,
  );
}

/** Gabungkan tiap produk dengan hasil perhitungannya. */
export function turunkanHpp(
  produk: readonly Produk[],
  biaya: readonly MasukanBiaya[],
  pengaturan: MasukanPengaturan,
): ProdukDenganHpp[] {
  const komponen = komponenBiaya(biaya, pengaturan);
  return produk.map((p) => ({
    ...p,
    ...hitungHpp(biayaBahanProduk(p), p.hargaJual, komponen, pengaturan.batasMarginAman),
  }));
}

export type BarisRincian = {
  nama: string;
  subInfo: string;
  nilai: number;
};

export type RincianHpp = HasilHpp & {
  baris: BarisRincian[];
  sisaPerPorsi: number;
};

/**
 * Uraian pembentuk HPP satu produk untuk modal "Rincian HPP":
 * tiap bahan baku, alokasi biaya tetap, potongan biaya persentase,
 * lalu sisa per porsi (profit bersih).
 */
export function rincianHpp(
  produk: Produk,
  biaya: readonly MasukanBiaya[],
  pengaturan: MasukanPengaturan,
): RincianHpp {
  const komponen = komponenBiaya(biaya, pengaturan);
  const hasil = hitungHpp(
    biayaBahanProduk(produk),
    produk.hargaJual,
    komponen,
    pengaturan.batasMarginAman,
  );

  const baris: BarisRincian[] = produk.resep.map((r) => ({
    nama: r.bahanBaku.nama,
    subInfo: `${r.jumlahDipakai.toLocaleString("id-ID")} ${r.bahanBaku.satuan}`,
    nilai: r.jumlahDipakai * r.bahanBaku.hargaPerSatuan,
  }));

  baris.push({
    nama: "Alokasi biaya tetap",
    subInfo: `${pengaturan.estimasiPorsiPerBulan.toLocaleString("id-ID")} porsi per bulan`,
    nilai: komponen.biayaTetapPerPorsi,
  });

  const potonganKomisi = produk.hargaJual * (komponen.persenKomisi / 100);
  if (komponen.persenKomisi > 0) {
    baris.push({
      nama: "Biaya persentase",
      subInfo: `${komponen.persenKomisi.toLocaleString("id-ID")}% dari harga jual produk`,
      nilai: potonganKomisi,
    });
  }

  return {
    ...hasil,
    baris,
    sisaPerPorsi: produk.hargaJual - hasil.hppTerhitung - potonganKomisi,
  };
}

/** Biaya tetap yang dialokasikan ke setiap porsi (dipakai panel Catatan Margin). */
export function biayaTetapPerPorsi(
  biaya: readonly MasukanBiaya[],
  pengaturan: MasukanPengaturan,
): number {
  return komponenBiaya(biaya, pengaturan).biayaTetapPerPorsi;
}

import type { BiayaOperasional, Pengaturan, Produk, ProdukDenganHpp } from "@/lib/types";

/**
 * Turunan HPP untuk DATA MOCK saja — meniru rumus `calculateHpp` di
 * lib/hppCalculator.ts supaya angka di UI konsisten sebelum API tersambung.
 * Bukan pengganti perhitungan backend: begitu halaman memakai API asli,
 * nilai HPP diambil dari endpoint /api/produk/hpp-semua.
 */
export function turunkanHpp(
  produk: Produk[],
  biaya: BiayaOperasional[],
  pengaturan: Pengaturan,
): ProdukDenganHpp[] {
  const totalBiayaTetapPerBulan = biaya
    .filter((b) => b.jenis === "tetap")
    .reduce((total, b) => total + b.nilai, 0);
  const biayaTetapPerPorsi = totalBiayaTetapPerBulan / pengaturan.estimasiPorsiPerBulan;
  const persenKomisi = biaya
    .filter((b) => b.jenis === "persentase")
    .reduce((total, b) => total + b.nilai, 0);

  return produk.map((p) => {
    const biayaBahan = p.resep.reduce(
      (total, r) => total + r.jumlahDipakai * r.bahanBaku.hargaPerSatuan,
      0,
    );
    const hppTerhitung = biayaBahan + biayaTetapPerPorsi;
    const potonganKomisi = p.hargaJual * (persenKomisi / 100);
    const marginPersen =
      ((p.hargaJual - hppTerhitung - potonganKomisi) / p.hargaJual) * 100;

    return {
      ...p,
      hppTerhitung,
      marginPersen,
      statusAman: marginPersen >= pengaturan.batasMarginAman,
    };
  });
}

export type BarisRincian = {
  nama: string;
  subInfo: string;
  nilai: number;
};

export type RincianHpp = {
  hppTerhitung: number;
  marginPersen: number;
  statusAman: boolean;
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
  biaya: BiayaOperasional[],
  pengaturan: Pengaturan,
): RincianHpp {
  const biayaTetap = biayaTetapPerPorsi(biaya, pengaturan);
  const persenKomisi = biaya
    .filter((b) => b.jenis === "persentase")
    .reduce((total, b) => total + b.nilai, 0);

  const barisBahan: BarisRincian[] = produk.resep.map((r) => ({
    nama: r.bahanBaku.nama,
    subInfo: `${r.jumlahDipakai.toLocaleString("id-ID")} ${r.bahanBaku.satuan}`,
    nilai: r.jumlahDipakai * r.bahanBaku.hargaPerSatuan,
  }));

  const biayaBahan = barisBahan.reduce((total, b) => total + b.nilai, 0);
  const hppTerhitung = biayaBahan + biayaTetap;
  const potonganKomisi = produk.hargaJual * (persenKomisi / 100);
  const marginPersen =
    ((produk.hargaJual - hppTerhitung - potonganKomisi) / produk.hargaJual) * 100;

  const baris: BarisRincian[] = [
    ...barisBahan,
    {
      nama: "Alokasi biaya tetap",
      subInfo: `${pengaturan.estimasiPorsiPerBulan.toLocaleString("id-ID")} porsi per bulan`,
      nilai: biayaTetap,
    },
  ];

  if (persenKomisi > 0) {
    baris.push({
      nama: "Biaya persentase",
      subInfo: `${persenKomisi.toLocaleString("id-ID")}% dari harga jual produk`,
      nilai: potonganKomisi,
    });
  }

  return {
    hppTerhitung,
    marginPersen,
    statusAman: marginPersen >= pengaturan.batasMarginAman,
    baris,
    sisaPerPorsi: produk.hargaJual - hppTerhitung - potonganKomisi,
  };
}

/** Biaya tetap yang dialokasikan ke setiap porsi (dipakai panel Catatan Margin). */
export function biayaTetapPerPorsi(
  biaya: BiayaOperasional[],
  pengaturan: Pengaturan,
): number {
  const total = biaya
    .filter((b) => b.jenis === "tetap")
    .reduce((jumlah, b) => jumlah + b.nilai, 0);
  return total / pengaturan.estimasiPorsiPerBulan;
}

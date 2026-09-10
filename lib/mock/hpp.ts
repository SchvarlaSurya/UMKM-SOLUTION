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

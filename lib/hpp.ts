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
  totalBiayaTetapBulanan: number;
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
    totalBiayaTetapBulanan: totalTetapPerBulan,
    biayaTetapPerPorsi:
      pengaturan.estimasiPorsiPerBulan > 0
        ? totalTetapPerBulan / pengaturan.estimasiPorsiPerBulan
        : 0,
    persenKomisi: biaya
      .filter((b) => b.jenis === "persentase")
      .reduce((total, b) => total + b.nilai, 0),
  };
}

/**
 * Bulatkan harga jual KE ATAS ke kelipatan tertentu: 8905 dengan kelipatan 500
 * menjadi 9000. Sengaja ke atas, bukan ke terdekat, supaya margin yang
 * dijanjikan tidak pernah berkurang gara-gara pembulatan.
 *
 * Kelipatan 0 (atau tidak sah) mengembalikan harga apa adanya.
 */
export function bulatkanHargaJual(harga: number, kelipatan: number): number {
  if (!Number.isFinite(harga) || !Number.isFinite(kelipatan) || kelipatan <= 0) {
    return harga;
  }
  return Math.ceil(harga / kelipatan) * kelipatan;
}

/**
 * Kelipatan pembulatan menurut besaran harganya. Harga kecil dibulatkan halus
 * supaya tidak melonjak jauh; harga besar dibulatkan kasar supaya angkanya
 * lazim dibaca di daftar menu.
 */
const TANGGA_PEMBULATAN = [
  { batasBawah: 50_000, kelipatan: 1_000 },
  { batasBawah: 10_000, kelipatan: 500 },
  { batasBawah: 1_000, kelipatan: 100 },
] as const;

/**
 * Pembulatan otomatis untuk harga hasil kalkulasi target margin. Tidak ada
 * pilihan untuk pemilik: kelipatannya ditentukan sistem dari besaran harga.
 *
 *   < 1.000          apa adanya
 *   1.000 – 9.999    kelipatan 100    (8.905 -> 9.000)
 *   10.000 – 49.999  kelipatan 500    (14.235 -> 14.500)
 *   >= 50.000        kelipatan 1.000  (62.300 -> 63.000)
 *
 * Selalu ke atas, jadi margin aktualnya sedikit di atas target — tidak pernah
 * di bawah janji yang sudah ditetapkan pemilik. Hanya dipakai pada harga yang
 * dihitung sistem; harga manual yang diketik pemilik tidak pernah diubah.
 */
export function bulatkanHargaJualOtomatis(harga: number): number {
  if (!Number.isFinite(harga)) return harga;

  const tangga = TANGGA_PEMBULATAN.find((t) => harga >= t.batasBawah);
  return tangga ? bulatkanHargaJual(harga, tangga.kelipatan) : harga;
}

/**
 * Jumlah porsi per bulan yang perlu terjual untuk menutup seluruh biaya tetap.
 * Biaya variabel hanya terdiri dari bahan dan komisi harga jual; alokasi biaya
 * tetap per porsi sengaja tidak dipakai agar biaya tetap tidak dihitung dua kali.
 */
export function hitungTitikImpas(
  biayaBahan: number,
  hargaJual: number,
  { totalBiayaTetapBulanan, persenKomisi }: KomponenBiaya,
): number | null {
  const potonganKomisi = hargaJual * (persenKomisi / 100);
  const biayaVariabelPerPorsi = biayaBahan + potonganKomisi;
  const kontribusiPerPorsi = hargaJual - biayaVariabelPerPorsi;

  if (kontribusiPerPorsi <= 0 || !Number.isFinite(kontribusiPerPorsi)) {
    return null;
  }

  const titikImpasPorsi = totalBiayaTetapBulanan / kontribusiPerPorsi;
  return Number.isFinite(titikImpasPorsi) ? titikImpasPorsi : null;
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
  titikImpasPorsi: number | null;
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
  const biayaBahan = biayaBahanProduk(produk);
  const hasil = hitungHpp(
    biayaBahan,
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
    titikImpasPorsi: hitungTitikImpas(biayaBahan, produk.hargaJual, komponen),
  };
}

/** Biaya tetap yang dialokasikan ke setiap porsi (dipakai panel Catatan Margin). */
export function biayaTetapPerPorsi(
  biaya: readonly MasukanBiaya[],
  pengaturan: MasukanPengaturan,
): number {
  return komponenBiaya(biaya, pengaturan).biayaTetapPerPorsi;
}

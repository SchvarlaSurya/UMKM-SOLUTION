/**
 * Rumus simulasi satu porsi nasi ayam di landing page.
 *
 * Asumsinya dikunci supaya angka di halaman selalu bisa dicocokkan dengan
 * rincian di bawah simulasinya: 100 gram ayam, bahan lain Rp6.500, dan alokasi
 * biaya tetap Rp1.500 per porsi (Rp1.800.000 dibagi 1.200 porsi).
 *
 * Dipisah dari komponennya supaya bisa diuji tanpa merender apa pun.
 */

export const GRAM_AYAM_KG = 0.1;
export const BAHAN_LAIN = 6_500;
export const ALOKASI_TETAP = 1_500;
export const BIAYA_TETAP_BULANAN = 1_800_000;
export const KELIPATAN_HARGA = 500;

export const AYAM_MIN = 40_000;
export const AYAM_MAKS = 60_000;
export const JUAL_MIN = 1_000;
export const JUAL_MAKS = 1_000_000;
export const TARGET_MAKS = 80;

/** Isian mentah dari form: digit polos, boleh kosong saat sedang diketik. */
export type IsianSimulasi = { ayam: string; jual: string; target: string };

export type KolomSimulasi = keyof IsianSimulasi;

export const ISIAN_AWAL: IsianSimulasi = { ayam: "55000", jual: "20000", target: "40" };

export type HasilSimulasi =
  | { sah: false; kolom: KolomSimulasi; pesan: string }
  | {
      sah: true;
      bahan: number;
      hpp: number;
      selisih: number;
      margin: number;
      target: number;
      rekomendasi: number;
      kontribusi: number;
      /** null bila harga jual belum menutup biaya bahan. */
      titikImpas: number | null;
    };

function diLuarRentang(teks: string, min: number, maks: number): boolean {
  if (!/^\d+$/.test(teks)) return true;
  const nilai = Number(teks);
  return nilai < min || nilai > maks;
}

export function hitungSimulasi(isian: IsianSimulasi): HasilSimulasi {
  if (diLuarRentang(isian.ayam, AYAM_MIN, AYAM_MAKS)) {
    return { sah: false, kolom: "ayam", pesan: "Isi harga ayam antara Rp 40.000 dan Rp 60.000." };
  }
  if (diLuarRentang(isian.jual, JUAL_MIN, JUAL_MAKS)) {
    return {
      sah: false,
      kolom: "jual",
      pesan: "Isi harga jual antara Rp 1.000 dan Rp 1.000.000.",
    };
  }
  if (diLuarRentang(isian.target, 0, TARGET_MAKS)) {
    return { sah: false, kolom: "target", pesan: "Isi target margin dari 0 sampai 80%." };
  }

  const jual = Number(isian.jual);
  const target = Number(isian.target);
  const bahan = Number(isian.ayam) * GRAM_AYAM_KG + BAHAN_LAIN;
  const hpp = bahan + ALOKASI_TETAP;
  const selisih = jual - hpp;
  const kontribusi = jual - bahan;

  // HPP ÷ (1 − target) sering menghasilkan ekor float seperti 20000.000000000004;
  // tanpa pengurang kecil itu harga yang tepat di kelipatan naik satu tingkat.
  const rekomendasi =
    Math.ceil((hpp / (1 - target / 100) - 1e-8) / KELIPATAN_HARGA) * KELIPATAN_HARGA;

  return {
    sah: true,
    bahan,
    hpp,
    selisih,
    margin: (selisih / jual) * 100,
    target,
    rekomendasi,
    kontribusi,
    // Alokasi biaya tetap tidak ikut dikurangkan supaya biaya tetap tidak
    // dihitung dua kali.
    titikImpas: kontribusi > 0 ? Math.ceil(BIAYA_TETAP_BULANAN / kontribusi) : null,
  };
}

/** Margin dianggap memenuhi target, dengan toleransi galat float. */
export function targetTercapai(margin: number, target: number): boolean {
  return margin + 1e-8 >= target;
}

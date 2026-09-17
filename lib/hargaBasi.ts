import type { BahanBaku } from "@/lib/types";

/**
 * Batas umur sebuah harga sebelum dianggap perlu dicek ulang.
 *
 * Sebulan, mengikuti irama rilis data harga BPS: perubahan harga bahan pangan
 * dirangkum per bulan, jadi harga yang belum disentuh lebih lama dari itu
 * berpeluang besar sudah tidak sama dengan harga beli di lapangan.
 *
 * Yang bisa diketahui aplikasi hanya kapan pemiliknya terakhir memeriksa, bukan
 * berapa harga pasar sekarang — semua kalimat yang memakai angka ini harus
 * berbunyi "belum diperbarui", bukan "sudah tidak akurat".
 */
export const HARI_HARGA_BASI = 30;

const MS_PER_HARI = 86_400_000;

export type BahanBasi = BahanBaku & { umurHari: number };

/** Umur harga dalam hari penuh sejak terakhir diperbarui. */
export function umurHarga(updatedAt: string, sekarang = Date.now()): number {
  return Math.floor((sekarang - new Date(updatedAt).getTime()) / MS_PER_HARI);
}

/**
 * Umur harga tiap bahan, berkunci id.
 *
 * Dihitung di komponen server lalu diturunkan sebagai prop, bukan dihitung
 * ulang di komponen klien: jam server saat render dan jam peramban saat hidrasi
 * tidak sama, dan bahan yang umurnya pas di batas bisa terbaca basi di satu
 * sisi dan belum basi di sisi lain.
 */
export function petaUmurHarga(bahan: BahanBaku[], sekarang = Date.now()): Record<number, number> {
  return Object.fromEntries(bahan.map((b) => [b.id, umurHarga(b.updatedAt, sekarang)]));
}

/** Bahan yang sudah lewat batas, yang paling lama tidak diperbarui lebih dulu. */
export function bahanHargaBasi(bahan: BahanBaku[], sekarang = Date.now()): BahanBasi[] {
  return bahan
    .map((b) => ({ ...b, umurHari: umurHarga(b.updatedAt, sekarang) }))
    .filter((b) => b.umurHari >= HARI_HARGA_BASI)
    .sort((a, b) => b.umurHari - a.umurHari);
}

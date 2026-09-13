/**
 * Pilihan jenis usaha, dipakai bersama oleh form pendaftaran dan route yang
 * menyimpannya. Ditaruh di satu tempat supaya daftar di layar dan daftar yang
 * divalidasi server tidak pernah berbeda.
 *
 * Semuanya usaha kuliner karena perhitungan HPP di aplikasi ini memang
 * dirancang untuk resep dan porsi.
 */
export const JENIS_USAHA_KULINER = [
  "Warung Makan",
  "Katering",
  "Kedai Minuman",
  "Toko Kue & Roti",
  "Jajanan/Camilan",
  "Lainnya (Kuliner)",
] as const;

export type JenisUsaha = (typeof JENIS_USAHA_KULINER)[number];

export function adalahJenisUsaha(nilai: string): nilai is JenisUsaha {
  return (JENIS_USAHA_KULINER as readonly string[]).includes(nilai);
}

import { revalidatePath } from "next/cache";

/**
 * Halaman yang menampilkan angka turunan produk.
 *
 * Route API produk perlu ini karena halaman Produk menyimpan lewat `fetch`,
 * lalu hanya memanggil `router.refresh()` — yang menyegarkan halaman yang
 * sedang dibuka saja. Tanpa revalidasi di sisi server, Dashboard tetap
 * menampilkan HPP, harga jual, dan margin yang lama.
 */
const HALAMAN_TERDAMPAK_PRODUK = ["/produk", "/dashboard"] as const;

export function segarkanHalamanProduk(sertakanBahanBaku = false) {
  for (const halaman of HALAMAN_TERDAMPAK_PRODUK) revalidatePath(halaman);
  // Halaman bahan baku hanya menampilkan jumlah produk pemakai, jadi cukup
  // disegarkan saat kaitan resep ikut berubah.
  if (sertakanBahanBaku) revalidatePath("/bahan-baku");
}

/**
 * Cara pemilik memasukkan takaran resep.
 *
 * Resep selalu disimpan per porsi. Dua nilai di bawah hanya merekam cara
 * pengisiannya supaya form edit bisa dibuka kembali dengan angka yang sama
 * seperti yang dulu diketik — 5 kg untuk 50 porsi, bukan 0,1 kg.
 *
 * Ditaruh di satu berkas karena produk bisa disimpan lewat dua jalur: Server
 * Action `lib/actions/produk.ts` (dipakai tombol di dashboard) dan route
 * `app/api/produk` (dipakai halaman Produk & Resep). Keduanya harus memutuskan
 * hal yang sama; kalau aturannya ditulis dua kali, salah satunya pasti
 * tertinggal saat diperbarui.
 */

export type ModeTakaran = "per-porsi" | "sekali-produksi";

export type CaraTakaran = {
  modeTakaran: ModeTakaran;
  /** Hanya terisi pada mode sekali-produksi; selain itu null. */
  jumlahPorsiProduksi: number | null;
};

export function isModeTakaran(nilai: unknown): nilai is ModeTakaran {
  return nilai === "per-porsi" || nilai === "sekali-produksi";
}

/**
 * Bersihkan masukan mentah jadi bentuk yang aman disimpan.
 *
 * Mode yang tidak dikenal, kosong, atau jumlah porsi yang tidak masuk akal
 * jatuh ke "per-porsi" tanpa jumlah porsi — sama dengan perilaku sebelum kolom
 * ini ada, jadi data lama dan data baru tetap dibaca dengan cara yang sama.
 */
export function bacaCaraTakaran(mode: unknown, jumlahPorsi: unknown): CaraTakaran {
  if (!isModeTakaran(mode) || mode === "per-porsi") {
    return { modeTakaran: "per-porsi", jumlahPorsiProduksi: null };
  }

  const jumlah = typeof jumlahPorsi === "number" ? jumlahPorsi : Number(jumlahPorsi);
  const jumlahValid = Number.isFinite(jumlah) && jumlah > 0;

  // Mode sekali produksi tanpa jumlah porsi tidak bisa dipulihkan jadi angka
  // aslinya, jadi diperlakukan seperti per porsi daripada menyimpan setengah.
  return jumlahValid
    ? { modeTakaran: "sekali-produksi", jumlahPorsiProduksi: jumlah }
    : { modeTakaran: "per-porsi", jumlahPorsiProduksi: null };
}

/**
 * Ubah angka jadi teks untuk `<input type="number">`.
 *
 * Isian itu hanya menerima titik sebagai pemisah desimal. Format lokal
 * Indonesia memakai koma ("0,1"), yang dianggap tidak sah oleh peramban lalu
 * diam-diam dikosongkan — itu yang dulu membuat seluruh takaran berubah jadi 0
 * setelah pemiliknya berpindah mode.
 *
 * Pembulatan delapan angka di belakang koma membuang sisa pembagian biner
 * seperti 0.30000000000000004 tanpa menyentuh takaran yang wajar.
 */
export function nilaiIsian(nilai: number): string {
  if (!Number.isFinite(nilai)) return "";
  return String(Number(nilai.toFixed(8)));
}

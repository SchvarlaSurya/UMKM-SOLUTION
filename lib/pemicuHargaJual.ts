/**
 * Kalimat penjelas untuk alasan harga jual berubah sendiri.
 *
 * Notifikasi menyimpan alasannya sebagai potongan kata seperti "perubahan
 * target margin". Ditampilkan apa adanya, itu terbaca seperti catatan sistem:
 * benar, tapi tidak memberi tahu pemiliknya apa yang barusan ia lakukan.
 *
 * Daftarnya tertutup — alasannya hanya ditulis di dua tempat, recalculateProduk
 * dan PUT produk — jadi pemetaan ini selalu tepat. Alasan yang belum terdaftar
 * tetap ditampilkan mentah, bukan dibuang: lebih baik kalimat kaku daripada
 * pemiliknya tidak tahu apa pun penyebabnya.
 */
const KALIMAT: Record<string, string> = {
  "perubahan harga bahan":
    "Harga bahan yang kamu perbarui mengubah modal per porsinya.",
  "perubahan biaya operasional":
    "Biaya operasional yang kamu ubah mengubah modal per porsinya.",
  "perubahan resep": "Resep yang kamu ubah mengubah modal per porsinya.",
  "perubahan target margin":
    "Target margin yang kamu ubah dipakai menghitung ulang harga jualnya.",
  "mode target margin diaktifkan":
    "Mode target margin baru dinyalakan, jadi harga jualnya dihitung ulang.",
  "perhitungan ulang target margin":
    "Harga jualnya dihitung ulang mengikuti target margin yang tersimpan.",
};

export function kalimatPemicu(pemicu: string): string {
  return KALIMAT[pemicu.trim().toLowerCase()] ?? `Penyebabnya: ${pemicu}.`;
}

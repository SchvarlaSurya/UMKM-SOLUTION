/**
 * Keputusan pencatatan histori harga bahan baku, dalam bentuk fungsi murni.
 *
 * Dulu histori hanya ditulis kalau nominalnya berbeda. Akibatnya, menyimpan
 * ulang harga yang sama — yang di lapangan berarti "sudah dicek ke pemasok,
 * harganya masih segini" — tidak meninggalkan jejak apa pun: bahannya tidak
 * pernah muncul di halaman tren maupun widget dashboard, dan trennya tetap
 * dianggap belum cukup data.
 *
 * Sekarang setiap penyimpanan harga menghasilkan satu baris histori. Yang
 * membedakan hanyalah apakah nominalnya ikut berubah, dan itu dikabarkan
 * lewat penanda terpisah supaya satu boolean tidak dipakai untuk dua arti
 * sekaligus ("ada histori baru" dan "harganya berubah").
 */

export type RencanaHistori = {
  /** Selalu true kalau harga ikut dikirim: tiap penyimpanan meninggalkan jejak. */
  catatHistori: boolean;
  /** Nominalnya benar-benar bergeser. Penentu perlu tidaknya HPP dihitung ulang. */
  hargaBerubah: boolean;
  hargaLama: number;
  hargaBaru: number;
};

/**
 * @param hargaSekarang harga yang tersimpan sebelum permintaan ini
 * @param hargaBaru nilai dari permintaan; `undefined` berarti harga tidak ikut dikirim
 */
export function rencanaHistoriHarga(
  hargaSekarang: number,
  hargaBaru: number | undefined,
): RencanaHistori {
  if (hargaBaru === undefined) {
    return {
      catatHistori: false,
      hargaBerubah: false,
      hargaLama: hargaSekarang,
      hargaBaru: hargaSekarang,
    };
  }

  return {
    catatHistori: true,
    hargaBerubah: hargaBaru !== hargaSekarang,
    hargaLama: hargaSekarang,
    hargaBaru,
  };
}

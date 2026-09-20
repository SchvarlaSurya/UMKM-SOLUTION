import { biayaBahanProduk, hitungHpp, type KomponenBiaya } from "@/lib/hpp";
import {
  hitungHargaJualTargetMargin,
  PerhitunganHargaTargetError,
} from "@/lib/hppCalculator";
import type { ModePenentuanHarga } from "@/lib/types";

/**
 * Simulasi "bagaimana kalau harga bahan ini naik X%": murni kalkulasi dari
 * data yang sudah ada, tanpa menulis apa pun. Rumus HPP dan harga target
 * dipakai dari lib/hpp.ts dan lib/hppCalculator.ts, tidak ditulis ulang.
 */

/** Batas atas masuk akal; 1000% berarti harga naik 11 kali lipat. */
export const PERSEN_KENAIKAN_MAKSIMUM = 1000;

export function isPersenKenaikan(nilai: unknown): nilai is number {
  return (
    typeof nilai === "number" &&
    Number.isFinite(nilai) &&
    nilai > 0 &&
    nilai <= PERSEN_KENAIKAN_MAKSIMUM
  );
}

export function hitungHargaHipotetis(hargaSekarang: number, persenKenaikan: number): number {
  return hargaSekarang * (1 + persenKenaikan / 100);
}

export type ProdukUntukSimulasi = {
  id: number;
  nama: string;
  kategori: string;
  hargaJual: number;
  modePenentuanHarga: string;
  targetMarginPersen: number | null;
  resep: ReadonlyArray<{
    bahanBakuId: number;
    jumlahDipakai: number;
    bahanBaku: { hargaPerSatuan: number };
  }>;
};

export type DampakProduk = {
  produkId: number;
  nama: string;
  kategori: string;
  modePenentuanHarga: ModePenentuanHarga;
  hargaJualLama: number;
  /**
   * Sama dengan harga lama untuk produk manual. Untuk produk target margin,
   * harga jual yang akan dihitung ulang otomatis oleh aplikasi saat harga
   * bahan benar-benar naik.
   */
  hargaJualHipotetis: number;
  hppLama: number;
  hppHipotetis: number;
  marginLama: number;
  marginHipotetis: number;
  /** marginHipotetis - marginLama, dalam poin persen. Negatif = margin turun. */
  selisihMargin: number;
  statusAmanLama: boolean;
  statusAmanHipotetis: boolean;
};

export type HasilSimulasiKenaikan = {
  bahanBaku: {
    id: number;
    nama: string;
    satuan: string;
    hargaSekarang: number;
    hargaHipotetis: number;
  };
  persenKenaikan: number;
  batasMarginAman: number;
  /** Urut dari margin yang turun paling banyak. */
  produk: DampakProduk[];
};

/**
 * Hitung HPP dan margin setiap produk sebelum dan sesudah harga satu bahan
 * diganti `hargaHipotetis`.
 *
 * Produk bermode target margin mengikuti perilaku aplikasi sesungguhnya:
 * saat harga bahan naik, harga jualnya dihitung ulang supaya margin tetap di
 * target (lihat recalculateAllAffectedByBahan). Tanpa ini simulasi akan
 * menunjukkan margin anjlok yang tidak pernah terjadi.
 */
export function hitungDampakKenaikan({
  produk,
  bahanBakuId,
  hargaHipotetis,
  komponen,
  batasMarginAman,
}: {
  produk: readonly ProdukUntukSimulasi[];
  bahanBakuId: number;
  hargaHipotetis: number;
  komponen: KomponenBiaya;
  batasMarginAman: number;
}): DampakProduk[] {
  const dampak = produk.map((p): DampakProduk => {
    const resepHipotetis = p.resep.map((r) =>
      r.bahanBakuId === bahanBakuId
        ? { ...r, bahanBaku: { hargaPerSatuan: hargaHipotetis } }
        : r,
    );

    const lama = hitungHpp(biayaBahanProduk(p), p.hargaJual, komponen, batasMarginAman);
    const biayaBahanHipotetis = biayaBahanProduk({ ...p, resep: resepHipotetis });

    const modePenentuanHarga: ModePenentuanHarga =
      p.modePenentuanHarga === "targetMargin" ? "targetMargin" : "manual";

    let hargaJualHipotetis = p.hargaJual;
    if (modePenentuanHarga === "targetMargin") {
      try {
        hargaJualHipotetis = hitungHargaJualTargetMargin(
          biayaBahanHipotetis + komponen.biayaTetapPerPorsi,
          komponen.persenKomisi,
          p.targetMarginPersen ?? Number.NaN,
        );
      } catch (error) {
        // Target yang tidak sah juga menggagalkan hitung ulang sungguhan;
        // simulasi memakai harga jual yang ada alih-alih gagal seluruhnya.
        if (!(error instanceof PerhitunganHargaTargetError)) throw error;
      }
    }

    const hipotetis = hitungHpp(
      biayaBahanHipotetis,
      hargaJualHipotetis,
      komponen,
      batasMarginAman,
    );

    return {
      produkId: p.id,
      nama: p.nama,
      kategori: p.kategori,
      modePenentuanHarga,
      hargaJualLama: p.hargaJual,
      hargaJualHipotetis,
      hppLama: lama.hppTerhitung,
      hppHipotetis: hipotetis.hppTerhitung,
      marginLama: lama.marginPersen,
      marginHipotetis: hipotetis.marginPersen,
      selisihMargin: hipotetis.marginPersen - lama.marginPersen,
      statusAmanLama: lama.statusAman,
      statusAmanHipotetis: hipotetis.statusAman,
    };
  });

  return dampak.sort(
    (a, b) => a.selisihMargin - b.selisihMargin || a.nama.localeCompare(b.nama, "id"),
  );
}

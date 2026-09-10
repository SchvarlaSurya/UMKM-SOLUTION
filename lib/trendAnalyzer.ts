/** Structural subset of Prisma HistoriHarga; no database dependency. */
export type HistoriHargaInput = Readonly<{
  id: number;
  bahanBakuId: number;
  hargaLama: number;
  hargaBaru: number;
  tanggal: Date;
}>;

export type TrendResult = Readonly<{
  bahanBakuId: number;
  status: "tren_naik" | "bukan_tren_naik" | "data_belum_cukup";
  trenNaik: boolean;
  jumlahPerubahanDiperiksa: number;
}>;

/**
 * Analyze the latest three changes for ONE ingredient.
 * Sort by tanggal, then id to break timestamp ties. Input is never mutated.
 * Equal prices count as a non-increase. Fewer than three records is insufficient.
 * Pass complete history or the latest >= 3 records, never an arbitrary slice.
 * Invalid matching records throw; records for other ingredients are ignored.
 */
export function analyzePriceTrend(
  bahanBakuId: number,
  histori: readonly HistoriHargaInput[],
): TrendResult {
  if (!Number.isSafeInteger(bahanBakuId) || bahanBakuId <= 0) {
    throw new RangeError("bahanBakuId harus bilangan bulat positif.");
  }

  const records = histori.filter((row) => row.bahanBakuId === bahanBakuId);
  const ids = new Set<number>();
  for (const row of records) {
    if (!Number.isSafeInteger(row.id) || row.id <= 0 || ids.has(row.id)) {
      throw new RangeError("ID histori harus bilangan bulat positif dan unik.");
    }
    ids.add(row.id);
    if (
      !Number.isFinite(row.hargaLama) || row.hargaLama <= 0 ||
      !Number.isFinite(row.hargaBaru) || row.hargaBaru <= 0
    ) {
      throw new RangeError("Harga histori harus angka positif dan terbatas.");
    }
    if (!(row.tanggal instanceof Date) || !Number.isFinite(row.tanggal.getTime())) {
      throw new TypeError("Tanggal histori harus objek Date yang valid.");
    }
  }

  const latest = records
    .sort((a, b) => b.tanggal.getTime() - a.tanggal.getTime() || b.id - a.id)
    .slice(0, 3);
  const enough = latest.length === 3;
  const trenNaik = enough && latest.every((row) => row.hargaBaru > row.hargaLama);

  return {
    bahanBakuId,
    status: !enough ? "data_belum_cukup" : trenNaik ? "tren_naik" : "bukan_tren_naik",
    trenNaik,
    jumlahPerubahanDiperiksa: latest.length,
  };
}

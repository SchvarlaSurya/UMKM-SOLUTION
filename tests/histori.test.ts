import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { rencanaHistoriHarga } from "../lib/histori";
import { analyzePriceTrend } from "../lib/trendAnalyzer";

/**
 * Regresi BUG-REG-01: menyimpan harga dengan nominal yang sama tidak pernah
 * tercatat sebagai histori, sehingga bahannya hilang dari halaman tren dan
 * widget dashboard, dan trennya selamanya "data_belum_cukup".
 */
describe("rencanaHistoriHarga", () => {
  it("mencatat histori saat harga sama, tanpa menandai harga berubah", () => {
    const rencana = rencanaHistoriHarga(15000, 15000);

    assert.equal(rencana.catatHistori, true);
    assert.equal(rencana.hargaBerubah, false);
    assert.equal(rencana.hargaLama, 15000);
    assert.equal(rencana.hargaBaru, 15000);
  });

  it("mencatat histori dan menandai perubahan saat harga naik", () => {
    const rencana = rencanaHistoriHarga(15000, 17000);

    assert.equal(rencana.catatHistori, true);
    assert.equal(rencana.hargaBerubah, true);
    assert.equal(rencana.hargaLama, 15000);
    assert.equal(rencana.hargaBaru, 17000);
  });

  it("mencatat histori dan menandai perubahan saat harga turun", () => {
    const rencana = rencanaHistoriHarga(15000, 12000);

    assert.equal(rencana.catatHistori, true);
    assert.equal(rencana.hargaBerubah, true);
    assert.equal(rencana.hargaBaru, 12000);
  });

  it("tidak menulis histori kalau harga tidak ikut dikirim", () => {
    // Menyunting nama atau satuan saja tidak boleh mengotori grafik tren.
    const rencana = rencanaHistoriHarga(15000, undefined);

    assert.equal(rencana.catatHistori, false);
    assert.equal(rencana.hargaBerubah, false);
  });
});

describe("analyzePriceTrend setelah histori harga tetap dicatat", () => {
  const tanggal = (iso: string) => new Date(iso);

  it("tidak lagi data_belum_cukup begitu ada tiga catatan bernilai tetap", () => {
    const hasil = analyzePriceTrend(74, [
      { id: 1, bahanBakuId: 74, hargaLama: 20000, hargaBaru: 20000, tanggal: tanggal("2026-09-15T01:00:00Z") },
      { id: 2, bahanBakuId: 74, hargaLama: 20000, hargaBaru: 20000, tanggal: tanggal("2026-09-15T02:00:00Z") },
      { id: 3, bahanBakuId: 74, hargaLama: 20000, hargaBaru: 20000, tanggal: tanggal("2026-09-15T03:00:00Z") },
    ]);

    assert.notEqual(hasil.status, "data_belum_cukup");
    assert.equal(hasil.status, "bukan_tren_naik");
    assert.equal(hasil.trenNaik, false);
    assert.equal(hasil.jumlahPerubahanDiperiksa, 3);
  });

  it("tetap menandai tren naik untuk tiga kenaikan berturut-turut", () => {
    const hasil = analyzePriceTrend(74, [
      { id: 1, bahanBakuId: 74, hargaLama: 20000, hargaBaru: 21000, tanggal: tanggal("2026-09-13T00:00:00Z") },
      { id: 2, bahanBakuId: 74, hargaLama: 21000, hargaBaru: 22000, tanggal: tanggal("2026-09-14T00:00:00Z") },
      { id: 3, bahanBakuId: 74, hargaLama: 22000, hargaBaru: 23000, tanggal: tanggal("2026-09-15T00:00:00Z") },
    ]);

    assert.equal(hasil.status, "tren_naik");
    assert.equal(hasil.trenNaik, true);
  });

  it("satu catatan tetap dianggap belum cukup", () => {
    const hasil = analyzePriceTrend(74, [
      { id: 1, bahanBakuId: 74, hargaLama: 20000, hargaBaru: 20000, tanggal: tanggal("2026-09-15T01:00:00Z") },
    ]);

    assert.equal(hasil.status, "data_belum_cukup");
  });
});

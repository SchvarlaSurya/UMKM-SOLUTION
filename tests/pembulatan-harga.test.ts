import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { bulatkanHargaJual, hitungHpp, komponenBiaya } from "../lib/hpp";
import { hitungHargaJualTargetMargin } from "../lib/hppCalculator";

describe("bulatkanHargaJual", () => {
  it("membulatkan ke atas, bukan ke terdekat", () => {
    assert.equal(bulatkanHargaJual(8_905, 500), 9_000);
    assert.equal(bulatkanHargaJual(8_905, 1_000), 9_000);
    assert.equal(bulatkanHargaJual(8_905, 100), 9_000);
    // 8.100 ke kelipatan 500 tetap naik ke 8.500, tidak turun ke 8.000.
    assert.equal(bulatkanHargaJual(8_100, 500), 8_500);
  });

  it("mengembalikan harga apa adanya tanpa pembulatan", () => {
    assert.equal(bulatkanHargaJual(8_905, 0), 8_905);
    assert.equal(bulatkanHargaJual(8_905, -100), 8_905);
  });

  it("tidak mengubah harga yang sudah pas di kelipatan", () => {
    assert.equal(bulatkanHargaJual(9_000, 500), 9_000);
  });
});

describe("harga target margin dengan pembulatan", () => {
  it("contoh verifikasi: HPP 6.679, target 25%, komisi 0%", () => {
    const tanpaPembulatan = hitungHargaJualTargetMargin(6_679, 0, 25);
    const denganPembulatan = hitungHargaJualTargetMargin(6_679, 0, 25, 500);

    assert.equal(tanpaPembulatan, 8_905);
    assert.equal(denganPembulatan, 9_000);

    // Margin aktual naik karena harga dibulatkan ke atas.
    const komponen = komponenBiaya([], { estimasiPorsiPerBulan: 1_000, batasMarginAman: 10 });
    const margin = hitungHpp(6_679, 9_000, komponen, 10).marginPersen;
    assert.ok(Math.abs(margin - 25.79) < 0.01);
  });
});

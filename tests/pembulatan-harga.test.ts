import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { bulatkanHargaJualOtomatis, hitungHpp, komponenBiaya } from "../lib/hpp";
import { hitungHargaJualTargetMargin } from "../lib/hppCalculator";

describe("bulatkanHargaJualOtomatis", () => {
  it("memakai kelipatan sesuai besaran harga, selalu ke atas", () => {
    // < 1.000: apa adanya
    assert.equal(bulatkanHargaJualOtomatis(850), 850);
    assert.equal(bulatkanHargaJualOtomatis(999), 999);

    // 1.000 - 9.999: kelipatan 100
    assert.equal(bulatkanHargaJualOtomatis(4_617), 4_700);
    assert.equal(bulatkanHargaJualOtomatis(8_905), 9_000);

    // 10.000 - 49.999: kelipatan 500
    assert.equal(bulatkanHargaJualOtomatis(14_235), 14_500);

    // >= 50.000: kelipatan 1.000
    assert.equal(bulatkanHargaJualOtomatis(62_300), 63_000);
  });

  it("tidak menaikkan harga yang sudah pas di kelipatannya", () => {
    assert.equal(bulatkanHargaJualOtomatis(4_700), 4_700);
    assert.equal(bulatkanHargaJualOtomatis(14_500), 14_500);
    assert.equal(bulatkanHargaJualOtomatis(63_000), 63_000);
  });

  it("memakai batas rentang secara tepat", () => {
    // 1.000 masuk rentang kelipatan 100, bukan lagi "apa adanya".
    assert.equal(bulatkanHargaJualOtomatis(1_000), 1_000);
    assert.equal(bulatkanHargaJualOtomatis(1_001), 1_100);
    // 10.000 pindah ke kelipatan 500.
    assert.equal(bulatkanHargaJualOtomatis(10_001), 10_500);
    // 50.000 pindah ke kelipatan 1.000.
    assert.equal(bulatkanHargaJualOtomatis(49_999), 50_000);
    assert.equal(bulatkanHargaJualOtomatis(50_001), 51_000);
  });
});

describe("harga target margin selalu dibulatkan otomatis", () => {
  it("HPP 6.679, target 25%, komisi 0% -> 9.000 dan margin aktual naik", () => {
    // Rumus mentahnya 6.679 / 0,75 = 8.905, lalu dibulatkan ke atas.
    assert.equal(hitungHargaJualTargetMargin(6_679, 0, 25), 9_000);

    const komponen = komponenBiaya([], { estimasiPorsiPerBulan: 1_000, batasMarginAman: 10 });
    const margin = hitungHpp(6_679, 9_000, komponen, 10).marginPersen;
    assert.ok(margin > 25, "margin aktual harus di atas target");
    assert.ok(Math.abs(margin - 25.79) < 0.01);
  });

  it("margin aktual tidak pernah turun di bawah target", () => {
    for (const hpp of [800, 2_345, 7_777, 12_000, 33_333, 90_100]) {
      for (const target of [10, 25, 40]) {
        const harga = hitungHargaJualTargetMargin(hpp, 0, target);
        const margin = ((harga - hpp) / harga) * 100;
        assert.ok(
          margin >= target - 1e-9,
          `HPP ${hpp} target ${target}%: margin ${margin.toFixed(2)}% di bawah target`,
        );
      }
    }
  });
});

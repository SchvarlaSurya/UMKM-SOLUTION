import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  ISIAN_AWAL,
  hitungSimulasi,
  targetTercapai,
  type HasilSimulasi,
  type IsianSimulasi,
} from "../lib/simulasiLanding";

function sah(isian: Partial<IsianSimulasi>) {
  const hasil: HasilSimulasi = hitungSimulasi({ ...ISIAN_AWAL, ...isian });
  assert.ok(hasil.sah, `isian seharusnya sah: ${JSON.stringify(isian)}`);
  return hasil;
}

describe("hitungSimulasi — contoh bawaan landing page", () => {
  it("ayam Rp55.000/kg, jual Rp20.000, target 40%", () => {
    const hasil = sah({});
    assert.equal(hasil.bahan, 12_000);
    assert.equal(hasil.hpp, 13_500);
    assert.equal(hasil.selisih, 6_500);
    assert.equal(hasil.margin, 32.5);
    assert.equal(hasil.rekomendasi, 22_500);
    assert.equal(hasil.kontribusi, 8_000);
    assert.equal(hasil.titikImpas, 225);
    assert.equal(targetTercapai(hasil.margin, hasil.target), false);
  });

  it("harga sebelum kenaikan (Rp40.000/kg) memenuhi target 40% tepat", () => {
    const hasil = sah({ ayam: "40000" });
    assert.equal(hasil.hpp, 12_000);
    assert.equal(hasil.margin, 40);
    assert.equal(targetTercapai(hasil.margin, hasil.target), true);
    // 12.000 ÷ 0,6 = 20.000 — tidak boleh naik ke 20.500 karena galat float.
    assert.equal(hasil.rekomendasi, 20_000);
  });

  it("memakai harga rekomendasi membuat target tercapai", () => {
    const awal = sah({});
    const sesudah = sah({ jual: String(awal.rekomendasi) });
    assert.ok(targetTercapai(sesudah.margin, sesudah.target));
    assert.equal(sesudah.titikImpas, 172); // 1.800.000 ÷ 10.500 = 171,4 → 172
  });

  it("membulatkan rekomendasi ke atas ke kelipatan Rp500", () => {
    // HPP 12.500 ÷ 0,6 = 20.833,33 → 21.000
    assert.equal(sah({ ayam: "45000" }).rekomendasi, 21_000);
  });

  it("target 0% merekomendasikan harga sama dengan HPP yang dibulatkan", () => {
    assert.equal(sah({ target: "0" }).rekomendasi, 13_500);
  });
});

describe("hitungSimulasi — batas dan kasus rugi", () => {
  it("harga jual di bawah HPP menghasilkan margin negatif", () => {
    const hasil = sah({ jual: "13000" });
    assert.ok(hasil.margin < 0);
    // Masih di atas biaya bahan, jadi titik impas tetap ada.
    assert.equal(hasil.titikImpas, 1_800);
  });

  it("titik impas null bila harga jual tidak melebihi biaya bahan", () => {
    assert.equal(sah({ jual: "12000" }).titikImpas, null);
    assert.equal(sah({ jual: "1000" }).titikImpas, null);
  });

  it("menerima nilai tepat di batas rentang", () => {
    sah({ ayam: "40000" });
    sah({ ayam: "60000" });
    sah({ jual: "1000000" });
    sah({ target: "80" });
  });
});

describe("hitungSimulasi — isian tidak sah menandai kolomnya", () => {
  const kasus: [Partial<IsianSimulasi>, keyof IsianSimulasi][] = [
    [{ ayam: "" }, "ayam"],
    [{ ayam: "5" }, "ayam"],
    [{ ayam: "39999" }, "ayam"],
    [{ ayam: "60001" }, "ayam"],
    [{ jual: "" }, "jual"],
    [{ jual: "999" }, "jual"],
    [{ jual: "1000001" }, "jual"],
    [{ target: "" }, "target"],
    [{ target: "81" }, "target"],
    [{ target: "abc" }, "target"],
  ];

  for (const [isian, kolom] of kasus) {
    it(`${JSON.stringify(isian)} → kolom ${kolom}`, () => {
      const hasil = hitungSimulasi({ ...ISIAN_AWAL, ...isian });
      assert.equal(hasil.sah, false);
      if (!hasil.sah) {
        assert.equal(hasil.kolom, kolom);
        assert.ok(hasil.pesan.length > 0);
      }
    });
  }

  it("kolom pertama yang salah yang dilaporkan", () => {
    const hasil = hitungSimulasi({ ayam: "", jual: "", target: "" });
    assert.equal(hasil.sah, false);
    if (!hasil.sah) assert.equal(hasil.kolom, "ayam");
  });
});

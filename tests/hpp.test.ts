import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { hitungHpp, hitungTitikImpas, komponenBiaya } from "../lib/hpp";

describe("hitungTitikImpas", () => {
  it("sesuai contoh manual dan tidak menghitung alokasi biaya tetap dua kali", () => {
    const komponen = komponenBiaya(
      [{ jenis: "tetap", nilai: 120_000 }],
      { estimasiPorsiPerBulan: 1_000, batasMarginAman: 10 },
    );

    const hasilHpp = hitungHpp(10_000, 22_000, komponen, 10);

    assert.equal(komponen.biayaTetapPerPorsi, 120);
    assert.equal(hasilHpp.hppTerhitung, 10_120);
    assert.equal(hitungTitikImpas(10_000, 22_000, komponen), 10);
  });

  it("memasukkan komisi persentase sebagai biaya variabel", () => {
    const komponen = komponenBiaya(
      [
        { jenis: "tetap", nilai: 120_000 },
        { jenis: "persentase", nilai: 10 },
      ],
      { estimasiPorsiPerBulan: 1_000, batasMarginAman: 10 },
    );

    assert.equal(hitungTitikImpas(10_000, 22_000, komponen), 120_000 / 9_800);
  });

  it("mengembalikan null saat harga jual tidak menutup biaya variabel", () => {
    const komponen = komponenBiaya(
      [
        { jenis: "tetap", nilai: 120_000 },
        { jenis: "persentase", nilai: 5 },
      ],
      { estimasiPorsiPerBulan: 1_000, batasMarginAman: 10 },
    );

    assert.equal(hitungTitikImpas(9_500, 10_000, komponen), null);
    assert.equal(hitungTitikImpas(10_000, 10_000, komponen), null);
  });
});

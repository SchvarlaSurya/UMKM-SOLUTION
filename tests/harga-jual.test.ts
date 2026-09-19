import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { hitungDampakKenaikan } from "../lib/simulasiKenaikan";

describe("harga jual mode target margin", () => {
  it("ikut dihitung ulang saat harga bahan naik, margin tetap di target", () => {
    const [hasil] = hitungDampakKenaikan({
      produk: [
        {
          id: 1,
          nama: "Nasi Kulit",
          kategori: "Makanan utama",
          hargaJual: 22_000,
          modePenentuanHarga: "targetMargin",
          targetMarginPersen: 15,
          resep: [
            {
              bahanBakuId: 1,
              jumlahDipakai: 0.1,
              bahanBaku: { hargaPerSatuan: 45_000 },
            },
          ],
        },
      ],
      bahanBakuId: 1,
      hargaHipotetis: 54_000,
      komponen: {
        totalBiayaTetapBulanan: 120_000,
        biayaTetapPerPorsi: 120,
        persenKomisi: 0,
      },
      batasMarginAman: 10,
    });

    // HPP naik dari 4.620 ke 5.520, harga jual mengikuti supaya margin 15%.
    assert.equal(hasil.hargaJualLama, 22_000);
    assert.ok(hasil.hargaJualHipotetis > hasil.hppHipotetis);
    assert.equal(hasil.hargaJualHipotetis, Math.round(5_520 / 0.85));
    assert.ok(hasil.hppHipotetis > hasil.hppLama);
    assert.ok(Math.abs(hasil.marginHipotetis - 15) < 0.01);
  });

  it("membulatkan harga ke atas sesuai pembulatan produk", () => {
    const [hasil] = hitungDampakKenaikan({
      produk: [
        {
          id: 1,
          nama: "Nasi Kulit",
          kategori: "Makanan utama",
          hargaJual: 22_000,
          modePenentuanHarga: "targetMargin",
          targetMarginPersen: 15,
          pembulatanHarga: 500,
          resep: [
            {
              bahanBakuId: 1,
              jumlahDipakai: 0.1,
              bahanBaku: { hargaPerSatuan: 45_000 },
            },
          ],
        },
      ],
      bahanBakuId: 1,
      hargaHipotetis: 54_000,
      komponen: {
        totalBiayaTetapBulanan: 120_000,
        biayaTetapPerPorsi: 120,
        persenKomisi: 0,
      },
      batasMarginAman: 10,
    });

    assert.equal(hasil.hargaJualHipotetis % 500, 0);
    // Dibulatkan ke atas, jadi margin aktualnya tidak pernah di bawah target.
    assert.ok(hasil.marginHipotetis >= 15);
  });
});

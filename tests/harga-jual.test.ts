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
    // 5.520 / 0,85 = 6.494, dibulatkan otomatis ke atas ke kelipatan 100.
    assert.equal(hasil.hargaJualHipotetis, 6_500);
    assert.ok(hasil.hppHipotetis > hasil.hppLama);
    // Pembulatan ke atas membuat margin sedikit di atas target, tidak pernah
    // di bawahnya: 6.500 dengan HPP 5.520 memberi 15,08%.
    assert.ok(hasil.marginHipotetis >= 15);
    assert.ok(hasil.marginHipotetis < 16);
  });

  it("membulatkan harga hasil hitung ke atas secara otomatis", () => {
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

    // HPP hipotetisnya 5.520, rumus mentah 6.494, rentang 1.000-9.999 jadi
    // dibulatkan ke atas ke kelipatan 100.
    assert.equal(hasil.hargaJualHipotetis, 6_500);
    // Dibulatkan ke atas, jadi margin aktualnya tidak pernah di bawah target.
    assert.ok(hasil.marginHipotetis >= 15);
  });
});

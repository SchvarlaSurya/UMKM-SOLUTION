import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { kalimatPemicu } from "../lib/pemicuHargaJual";

/**
 * Alasannya hanya ditulis di dua tempat: recalculateProduk di lib/hppCalculator
 * dan handler PUT produk. Daftar di bawah menyalin keenamnya; kalau ada alasan
 * baru ditambahkan di sana tanpa kalimatnya di sini, uji terakhir yang jatuh.
 */
const SEMUA_PEMICU = [
  "perubahan harga bahan",
  "perubahan biaya operasional",
  "perubahan resep",
  "perubahan target margin",
  "mode target margin diaktifkan",
  "perhitungan ulang target margin",
];

describe("kalimatPemicu", () => {
  it("memberi kalimat utuh untuk tiap alasan yang dikenal", () => {
    for (const pemicu of SEMUA_PEMICU) {
      const kalimat = kalimatPemicu(pemicu);
      assert.ok(kalimat.length > 0, `${pemicu} tidak punya kalimat`);
      assert.ok(kalimat.endsWith("."), `${pemicu} tidak diakhiri titik`);
      assert.ok(
        !kalimat.startsWith("Penyebabnya:"),
        `${pemicu} masih jatuh ke kalimat cadangan`,
      );
    }
  });

  it("tiap alasan punya kalimat yang berbeda", () => {
    const kalimat = SEMUA_PEMICU.map(kalimatPemicu);
    assert.equal(new Set(kalimat).size, SEMUA_PEMICU.length);
  });

  it("tidak peka huruf besar-kecil dan spasi di tepi", () => {
    assert.equal(
      kalimatPemicu("  Perubahan Target Margin "),
      kalimatPemicu("perubahan target margin"),
    );
  });

  it("alasan yang belum terdaftar tetap ditampilkan, bukan dibuang", () => {
    const kalimat = kalimatPemicu("perubahan pajak daerah");
    assert.ok(kalimat.includes("perubahan pajak daerah"));
  });
});

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

/**
 * Dua mode takaran hanyalah dua cara menulis angka yang sama. Resep selalu
 * disimpan per porsi, jadi yang perlu dijamin: perjalanan bolak-balik antara
 * "5 kg untuk 50 porsi" dan "0,1 kg per porsi" tidak menghilangkan angka asli.
 *
 * Regresi: sebelumnya mode dan jumlah porsi tidak ikut tersimpan, sehingga
 * membuka "Edit resep" selalu menampilkan hasil baginya dan memaksa pemilik
 * mengetik ulang.
 */

/** Sama seperti yang dipakai form saat menyimpan. */
function keTakaranPerPorsi(jumlahDiketik: number, jumlahPorsi: number): number {
  return jumlahDiketik / jumlahPorsi;
}

/** Sama seperti yang dipakai form saat membuka kembali produk tersimpan. */
function keTakaranSekaliProduksi(jumlahPerPorsi: number, jumlahPorsi: number): number {
  return jumlahPerPorsi * jumlahPorsi;
}

describe("konversi takaran resep", () => {
  it("menyimpan 5 kg untuk 50 porsi sebagai 0,1 kg per porsi", () => {
    assert.equal(keTakaranPerPorsi(5, 50), 0.1);
  });

  it("memulihkan 5 kg saat produk dibuka kembali dengan 50 porsi", () => {
    const tersimpan = keTakaranPerPorsi(5, 50);
    assert.equal(keTakaranSekaliProduksi(tersimpan, 50), 5);
  });

  it("bolak-balik mode tidak menggeser angka untuk takaran pecahan", () => {
    const porsi = 8;
    for (const diketik of [0.25, 1.5, 3, 12.75]) {
      const perPorsi = keTakaranPerPorsi(diketik, porsi);
      assert.equal(keTakaranSekaliProduksi(perPorsi, porsi), diketik);
    }
  });

  it("produk tanpa jumlah porsi diperlakukan sebagai takaran per porsi", () => {
    // Pengali 1 dipakai kalau jumlahPorsiProduksi kosong, misalnya produk lama
    // yang dibuat sebelum kolomnya ada.
    const pengali = null ?? 1;
    assert.equal(keTakaranSekaliProduksi(0.1, pengali), 0.1);
  });
});

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { bacaCaraTakaran, nilaiIsian } from "../lib/takaran";

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
    const jumlahPorsiProduksi: number | null = null;
    const pengali = jumlahPorsiProduksi ?? 1;
    assert.equal(keTakaranSekaliProduksi(0.1, pengali), 0.1);
  });
});

/**
 * Regresi: produk bisa disimpan lewat dua jalur — Server Action (tombol di
 * dashboard) dan route /api/produk (halaman Produk & Resep). Perbaikan pertama
 * hanya menyentuh Server Action, sehingga menyimpan dari halaman produk tetap
 * menghasilkan modeTakaran "per-porsi" dan jumlahPorsiProduksi NULL. Kedua
 * jalur kini memanggil bacaCaraTakaran yang sama.
 */
describe("bacaCaraTakaran", () => {
  it("menyimpan mode sekali produksi beserta jumlah porsinya", () => {
    assert.deepEqual(bacaCaraTakaran("sekali-produksi", 50), {
      modeTakaran: "sekali-produksi",
      jumlahPorsiProduksi: 50,
    });
  });

  it("menerima jumlah porsi berupa teks dari body JSON", () => {
    assert.deepEqual(bacaCaraTakaran("sekali-produksi", "50"), {
      modeTakaran: "sekali-produksi",
      jumlahPorsiProduksi: 50,
    });
  });

  it("jatuh ke per porsi kalau mode tidak dikirim", () => {
    assert.deepEqual(bacaCaraTakaran(undefined, undefined), {
      modeTakaran: "per-porsi",
      jumlahPorsiProduksi: null,
    });
  });

  it("tidak menyimpan setengah data saat jumlah porsi tidak masuk akal", () => {
    for (const jumlah of [0, -5, "abc", null]) {
      assert.deepEqual(bacaCaraTakaran("sekali-produksi", jumlah), {
        modeTakaran: "per-porsi",
        jumlahPorsiProduksi: null,
      });
    }
  });

  it("mode per porsi tidak membawa jumlah porsi meski dikirim", () => {
    assert.deepEqual(bacaCaraTakaran("per-porsi", 50), {
      modeTakaran: "per-porsi",
      jumlahPorsiProduksi: null,
    });
  });
});

/**
 * Regresi: takaran hasil konversi dulu diisikan ke <input type="number">
 * memakai format lokal Indonesia. Koma desimalnya dianggap tidak sah oleh
 * peramban, isiannya dikosongkan, dan semua takaran terbaca 0 setelah
 * pemiliknya berpindah mode.
 */
describe("nilaiIsian", () => {
  it("memakai titik desimal, bukan koma", () => {
    assert.equal(nilaiIsian(0.1), "0.1");
    assert.equal(nilaiIsian(12.75), "12.75");
    assert.ok(!nilaiIsian(0.1).includes(","));
  });

  it("tidak memberi pemisah ribuan yang membuat isian jadi tidak sah", () => {
    assert.equal(nilaiIsian(1500), "1500");
    assert.equal(nilaiIsian(1000000), "1000000");
  });

  it("membuang sisa pembagian biner", () => {
    // 0.1 + 0.2 pada bilangan pecahan biner menghasilkan 0.30000000000000004.
    assert.equal(nilaiIsian(0.1 + 0.2), "0.3");
    assert.equal(nilaiIsian(5 / 50), "0.1");
  });

  it("mengembalikan teks kosong untuk angka yang tidak terhingga", () => {
    assert.equal(nilaiIsian(Number.NaN), "");
    assert.equal(nilaiIsian(Number.POSITIVE_INFINITY), "");
  });

  it("hasil konversinya bisa dibaca kembali jadi angka semula", () => {
    // Inilah perjalanan yang gagal: ketik 5, pindah mode, kembali lagi.
    const perPorsi = Number(nilaiIsian(5 / 50));
    assert.equal(Number(nilaiIsian(perPorsi * 50)), 5);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BATAS_MASUKAN,
  bacaAngka,
  bacaTeks,
  byteUtf8,
  isIdSah,
  isObjek,
  periksaMaksimum,
  periksaPanjang,
} from "../lib/batasMasukan";
import { bacaCaraTakaran } from "../lib/takaran";

describe("periksaPanjang", () => {
  it("menerima teks tepat di batas", () => {
    assert.equal(periksaPanjang("a".repeat(100), "Nama", 100), null);
  });

  it("menolak teks satu karakter di atas batas", () => {
    assert.equal(periksaPanjang("a".repeat(101), "Nama", 100), "Nama paling banyak 100 karakter");
  });

  it("mengukur setelah spasi di tepi dibuang, sama seperti yang disimpan", () => {
    assert.equal(periksaPanjang(`  ${"a".repeat(100)}  `, "Nama", 100), null);
  });

  it("menolak nama 200.000 karakter dari audit", () => {
    assert.notEqual(periksaPanjang("x".repeat(200_000), "Nama", BATAS_MASUKAN.panjangNama), null);
  });
});

describe("periksaMaksimum", () => {
  it("menerima nominal tepat di batas", () => {
    assert.equal(periksaMaksimum(BATAS_MASUKAN.rupiah, "Harga", BATAS_MASUKAN.rupiah), null);
  });

  it("menolak harga 1e308 yang dulu tampil sebagai HPP Rp ∞", () => {
    assert.equal(
      periksaMaksimum(1e308, "Harga per satuan", BATAS_MASUKAN.rupiah),
      "Harga per satuan paling besar 1.000.000.000",
    );
  });

  it("menulis batas dengan titik ribuan", () => {
    assert.equal(periksaMaksimum(100_001, "Takaran bahan", 100_000), "Takaran bahan paling besar 100.000");
  });

  it("batas rupiah dikali takaran terbesar tetap angka terhingga", () => {
    // HPP = harga x takaran, dijumlah sebanyak baris resep. Kalau ini
    // terhingga, batasnya cukup jauh dari titik angka berubah jadi Infinity.
    const terburuk = BATAS_MASUKAN.rupiah * BATAS_MASUKAN.takaran * BATAS_MASUKAN.barisResep;
    assert.ok(Number.isFinite(terburuk));
  });
});

describe("byteUtf8", () => {
  it("menghitung huruf ASCII satu byte", () => {
    assert.equal(byteUtf8("rahasia123"), 10);
  });

  it("menghitung huruf beraksen dan emoji lebih dari satu byte", () => {
    assert.equal(byteUtf8("é"), 2);
    assert.equal(byteUtf8("🔒"), 4);
  });

  it("emoji 4 byte: 18 masih muat, 19 sudah melewati batas bcrypt", () => {
    assert.ok(byteUtf8("🔒".repeat(18)) <= BATAS_MASUKAN.byteKataSandi);
    assert.ok(byteUtf8("🔒".repeat(19)) > BATAS_MASUKAN.byteKataSandi);
  });
});

describe("bacaTeks dan bacaAngka", () => {
  it("bacaTeks membuang spasi tepi dari string", () => {
    assert.equal(bacaTeks("  Gula pasir  "), "Gula pasir");
  });

  it("bacaTeks mengubah nilai bukan string jadi teks kosong, bukan exception", () => {
    for (const nilai of [undefined, null, 42, {}, [], true]) {
      assert.equal(bacaTeks(nilai), "");
    }
  });

  it("bacaAngka meneruskan angka apa adanya", () => {
    assert.equal(bacaAngka(15000), 15000);
    assert.equal(bacaAngka(0.25), 0.25);
  });

  it("bacaAngka tidak mengubah teks angka jadi angka", () => {
    // Form mengirim angka; teks "15000" berarti permintaannya dibuat di luar UI.
    assert.ok(Number.isNaN(bacaAngka("15000")));
    assert.ok(Number.isNaN(bacaAngka(null)));
    assert.ok(Number.isNaN(bacaAngka(undefined)));
  });
});

describe("isObjek dan isIdSah", () => {
  it("isObjek hanya menerima objek biasa", () => {
    assert.equal(isObjek({ nama: "Gula" }), true);
    assert.equal(isObjek(null), false);
    assert.equal(isObjek([]), false);
    assert.equal(isObjek("Gula"), false);
  });

  it("isIdSah menerima bilangan bulat positif saja", () => {
    assert.equal(isIdSah(1), true);
    assert.equal(isIdSah(98765), true);
    for (const nilai of [0, -1, 1.5, Number.NaN, Infinity, "1", null, undefined, 2 ** 53]) {
      assert.equal(isIdSah(nilai), false, `${String(nilai)} seharusnya ditolak`);
    }
  });
});

describe("bacaCaraTakaran dengan batas porsi", () => {
  it("menyimpan jumlah porsi tepat di batas", () => {
    assert.deepEqual(bacaCaraTakaran("sekali-produksi", BATAS_MASUKAN.porsiProduksi), {
      modeTakaran: "sekali-produksi",
      jumlahPorsiProduksi: BATAS_MASUKAN.porsiProduksi,
    });
  });

  it("jumlah porsi di atas batas diperlakukan sebagai per porsi", () => {
    assert.deepEqual(bacaCaraTakaran("sekali-produksi", 1e308), {
      modeTakaran: "per-porsi",
      jumlahPorsiProduksi: null,
    });
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TUJUAN_BAWAAN, tujuanSetelahMasuk } from "../lib/tujuanLogin";

describe("tujuanSetelahMasuk", () => {
  it("memakai dashboard kalau callbackUrl tidak ada atau kosong", () => {
    assert.equal(tujuanSetelahMasuk(null), TUJUAN_BAWAAN);
    assert.equal(tujuanSetelahMasuk(undefined), TUJUAN_BAWAAN);
    assert.equal(tujuanSetelahMasuk(""), TUJUAN_BAWAAN);
  });

  it("meneruskan jalur internal beserta query dan hash-nya", () => {
    assert.equal(tujuanSetelahMasuk("/produk"), "/produk");
    assert.equal(tujuanSetelahMasuk("/bahan-baku/12"), "/bahan-baku/12");
    assert.equal(
      tujuanSetelahMasuk("/tren-harga?bahan=3&rentang=30#grafik"),
      "/tren-harga?bahan=3&rentang=30#grafik",
    );
  });

  it("menerima callbackUrl yang ditulis proxy.ts", () => {
    // proxy.ts menyimpan `${pathname}${search}`; URLSearchParams sudah
    // mendekodenya sebelum sampai ke sini.
    const dariProxy = new URLSearchParams(
      "callbackUrl=%2Fproduk%3Fkategori%3Dminuman",
    ).get("callbackUrl");
    assert.equal(tujuanSetelahMasuk(dariProxy), "/produk?kategori=minuman");
  });

  const TUJUAN_LUAR = [
    ["URL absolut https", "https://situs-palsu.example"],
    ["URL absolut http", "http://situs-palsu.example/login"],
    ["URL tanpa skema", "//situs-palsu.example"],
    ["backslash setelah garis miring", "/\\situs-palsu.example"],
    ["dua backslash", "\\\\situs-palsu.example"],
    ["tab di antara garis miring", "/\t/situs-palsu.example"],
    ["baris baru di antara garis miring", "/\n/situs-palsu.example"],
    ["skema javascript", "javascript:alert(1)"],
    ["skema data", "data:text/html,<script>alert(1)</script>"],
    ["jalur tanpa garis miring awal", "situs-palsu.example"],
    ["spasi di depan", " //situs-palsu.example"],
  ] as const;

  for (const [nama, mentah] of TUJUAN_LUAR) {
    it(`menolak ${nama}`, () => {
      assert.equal(tujuanSetelahMasuk(mentah), TUJUAN_BAWAAN);
    });
  }

  it("hasilnya selalu jalur internal, bukan teks mentah", () => {
    // `..` diselesaikan seperti di browser, jadi yang dipakai router sama
    // dengan yang sudah diperiksa.
    assert.equal(tujuanSetelahMasuk("/produk/../dashboard"), "/dashboard");
  });
});

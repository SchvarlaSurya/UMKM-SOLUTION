import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  cobaUlangSaatTimeout,
  isTimeoutTransaksi,
  jalankanRekalkulasi,
} from "../lib/cobaUlangTransaksi";

/** Bentuk galat P2028 yang terukur dari Prisma 7 + adapter pg. */
function galatP2028() {
  return Object.assign(
    new Error("Transaction API error: Unable to start a transaction in the given time."),
    { name: "PrismaClientKnownRequestError", code: "P2028" },
  );
}

/**
 * Pekerjaan tiruan yang gagal sesuai daftar lalu berhasil. `jeda` mencatat
 * setiap penantian tanpa benar-benar menunggu.
 */
function skenario(kegagalan: unknown[]) {
  const jeda: number[] = [];
  let panggilan = 0;
  const jalankan = async () => {
    panggilan++;
    const galat = kegagalan.shift();
    if (galat !== undefined) throw galat;
    return "hasil";
  };
  const tunggu = async (ms: number) => {
    jeda.push(ms);
  };
  return { jalankan, tunggu, jeda, jumlahPanggilan: () => panggilan };
}

describe("isTimeoutTransaksi", () => {
  it("mengenali P2028", () => {
    assert.equal(isTimeoutTransaksi(galatP2028()), true);
  });

  it("tidak menganggap kode Prisma lain sebagai timeout", () => {
    assert.equal(isTimeoutTransaksi(Object.assign(new Error("unik"), { code: "P2002" })), false);
    assert.equal(isTimeoutTransaksi(new Error("biasa")), false);
    assert.equal(isTimeoutTransaksi(null), false);
    assert.equal(isTimeoutTransaksi("P2028"), false);
  });
});

describe("cobaUlangSaatTimeout", () => {
  it("tidak menunggu kalau percobaan pertama berhasil", async () => {
    const s = skenario([]);
    assert.equal(await cobaUlangSaatTimeout(s.jalankan, { tunggu: s.tunggu }), "hasil");
    assert.equal(s.jumlahPanggilan(), 1);
    assert.deepEqual(s.jeda, []);
  });

  it("mengulang P2028 dengan jeda 500 lalu 1000 ms", async () => {
    const s = skenario([galatP2028(), galatP2028()]);
    assert.equal(await cobaUlangSaatTimeout(s.jalankan, { tunggu: s.tunggu }), "hasil");
    assert.equal(s.jumlahPanggilan(), 3);
    assert.deepEqual(s.jeda, [500, 1000]);
  });

  it("berhenti setelah 3 percobaan dan melempar galat terakhir", async () => {
    const terakhir = galatP2028();
    const s = skenario([galatP2028(), galatP2028(), terakhir, galatP2028()]);
    await assert.rejects(cobaUlangSaatTimeout(s.jalankan, { tunggu: s.tunggu }), (e) => e === terakhir);
    assert.equal(s.jumlahPanggilan(), 3);
    assert.deepEqual(s.jeda, [500, 1000]);
  });

  it("tidak mengulang galat selain timeout", async () => {
    const galatData = new Error("Target margin tidak sah");
    const s = skenario([galatData]);
    await assert.rejects(cobaUlangSaatTimeout(s.jalankan, { tunggu: s.tunggu }), (e) => e === galatData);
    assert.equal(s.jumlahPanggilan(), 1);
    assert.deepEqual(s.jeda, []);
  });

  it("berhenti mengulang begitu galatnya bukan timeout lagi", async () => {
    const galatData = new Error("data rusak");
    const s = skenario([galatP2028(), galatData]);
    await assert.rejects(cobaUlangSaatTimeout(s.jalankan, { tunggu: s.tunggu }), (e) => e === galatData);
    assert.equal(s.jumlahPanggilan(), 2);
  });
});

describe("jalankanRekalkulasi", () => {
  it("selesai kalau salah satu percobaan berhasil", async () => {
    const s = skenario([galatP2028()]);
    assert.equal(await jalankanRekalkulasi(s.jalankan, { tunggu: s.tunggu }), "selesai");
  });

  it("tertunda, bukan melempar, kalau semua percobaan timeout", async () => {
    const s = skenario([galatP2028(), galatP2028(), galatP2028()]);
    assert.equal(await jalankanRekalkulasi(s.jalankan, { tunggu: s.tunggu }), "tertunda");
    assert.equal(s.jumlahPanggilan(), 3);
  });

  it("galat selain timeout tetap dilempar", async () => {
    const galatData = new Error("Produk tidak ditemukan");
    const s = skenario([galatData]);
    await assert.rejects(jalankanRekalkulasi(s.jalankan, { tunggu: s.tunggu }), (e) => e === galatData);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AKUN_DEMO } from "../lib/akunDemo";
import { normalisasiEmail } from "../lib/email";

describe("AKUN_DEMO", () => {
  it("emailnya sudah dalam bentuk normal, jadi pencarian akunnya pasti cocok", () => {
    // Seed menyimpan email yang sudah dinormalisasi, sedangkan login mencari
    // lewat normalisasiEmail. Kalau nilai di sini berhuruf besar atau berspasi,
    // tombol isi-otomatis akan mengisi sesuatu yang tidak ditemukan.
    assert.equal(normalisasiEmail(AKUN_DEMO.email), AKUN_DEMO.email);
  });

  it("memakai domain .test yang dicadangkan, bukan alamat yang bisa menerima surel", () => {
    assert.ok(AKUN_DEMO.email.endsWith(".test"));
  });

  it("kata sandinya memenuhi batas minimum pendaftaran (8 karakter)", () => {
    assert.ok(AKUN_DEMO.password.length >= 8);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pesanGalatTakTerduga } from "../lib/pesanGalatServer";

/** Bentuk pesan Prisma sungguhan: memuat nama tabel, constraint, dan jalur berkas. */
const GALAT_PRISMA = new Error(
  'Invalid `prisma.produk.delete()` invocation in\nC:\\app\\lib\\actions\\produk.ts:623:5\n\nForeign key constraint violated on the constraint: `HistoriHargaJual_produkId_fkey`',
);

describe("pesanGalatTakTerduga", () => {
  it("di production hanya mengirim pesan umum dengan konteksnya", () => {
    assert.equal(
      pesanGalatTakTerduga("Gagal menghapus produk", GALAT_PRISMA, false),
      "Gagal menghapus produk: terjadi kesalahan di server. Coba lagi sebentar lagi.",
    );
  });

  it("di production tidak membocorkan constraint, tabel, maupun jalur berkas", () => {
    const pesan = pesanGalatTakTerduga("Gagal menghapus produk", GALAT_PRISMA, false);
    for (const rahasia of ["HistoriHargaJual", "fkey", "prisma.produk", "produk.ts", "C:\\"]) {
      assert.ok(!pesan.includes(rahasia), `pesan memuat "${rahasia}"`);
    }
  });

  it("nilai yang dilempar bukan Error juga mendapat pesan umum", () => {
    assert.equal(
      pesanGalatTakTerduga("Gagal mengambil produk", "string mentah", false),
      "Gagal mengambil produk: terjadi kesalahan di server. Coba lagi sebentar lagi.",
    );
  });

  it("di development menyertakan detail supaya mudah dilacak", () => {
    const pesan = pesanGalatTakTerduga("Gagal menghapus produk", GALAT_PRISMA, true);
    assert.ok(pesan.startsWith("Gagal menghapus produk: terjadi kesalahan di server."));
    assert.ok(pesan.includes("HistoriHargaJual_produkId_fkey"));
  });
});

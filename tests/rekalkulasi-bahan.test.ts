import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { rencanaHistoriHarga } from "../lib/histori";
import {
  PerhitunganHargaTargetError,
  recalculateAllAffectedByBahan,
  rencanakanRekalkulasi,
  type ProdukRekalkulasi,
} from "../lib/hppCalculator";
import { komponenBiaya } from "../lib/hpp";
import {
  simpanPerubahanBahan,
  ubahBahanLaluRekalkulasi,
  type JalankanTransaksi,
} from "../lib/perubahanBahan";

const USER = 7;
const BAHAN = 3;

function produk(ubah: Partial<ProdukRekalkulasi> & { id: number }): ProdukRekalkulasi {
  return {
    hargaJual: 20_000,
    modePenentuanHarga: "manual",
    targetMarginPersen: null,
    pembulatanHarga: 0,
    resep: [{ jumlahDipakai: 0.1, bahanBaku: { hargaPerSatuan: 50_000 } }],
    ...ubah,
  };
}

type Panggilan = { metode: string; args: unknown };

/**
 * Client transaksi tiruan. Setiap panggilan dicatat berurutan supaya test bisa
 * memastikan semua baca dan tulis lewat client yang sama — client itulah
 * transaksinya — dan tidak ada tulisan sebelum validasi selesai.
 */
function txTiruan(opsi: {
  produk: ProdukRekalkulasi[];
  biaya?: { jenis: string; nilai: number }[];
  jumlahDiperbarui?: number;
}) {
  const panggilan: Panggilan[] = [];
  const catat =
    <T>(metode: string, hasil: (args: never) => T) =>
    async (args: unknown) => {
      panggilan.push({ metode, args });
      return hasil(args as never);
    };

  const tx = {
    produk: { findMany: catat("produk.findMany", () => opsi.produk) },
    pengaturan: {
      findUnique: catat("pengaturan.findUnique", () => ({
        estimasiPorsiPerBulan: 100,
        batasMarginAman: 10,
      })),
    },
    biayaOperasional: { findMany: catat("biayaOperasional.findMany", () => opsi.biaya ?? []) },
    $executeRaw: catat("$executeRaw", (sql: { values: unknown[] }) =>
      opsi.jumlahDiperbarui ?? (sql.values.length - 1) / 2,
    ),
    historiHargaJual: { createMany: catat("historiHargaJual.createMany", () => ({ count: 0 })) },
    hppSnapshot: { createMany: catat("hppSnapshot.createMany", () => ({ count: 0 })) },
    notifikasi: {
      createMany: catat("notifikasi.createMany", () => ({ count: 1 })),
      deleteMany: catat("notifikasi.deleteMany", () => ({ count: 0 })),
    },
    historiHarga: { create: catat("historiHarga.create", () => ({})) },
    bahanBaku: { update: catat("bahanBaku.update", () => ({ id: BAHAN })) },
  };

  return {
    tx: tx as unknown as Parameters<typeof recalculateAllAffectedByBahan>[2] &
      Parameters<typeof simpanPerubahanBahan>[0],
    panggilan,
    metode: () => panggilan.map((p) => p.metode),
    args: (metode: string) => panggilan.find((p) => p.metode === metode)?.args as never,
  };
}

const TULIS = [
  "$executeRaw",
  "historiHargaJual.createMany",
  "hppSnapshot.createMany",
  "notifikasi.createMany",
  "notifikasi.deleteMany",
];

describe("rencanakanRekalkulasi", () => {
  const komponen = komponenBiaya([{ jenis: "persentase", nilai: 10 }], {
    estimasiPorsiPerBulan: 100,
    batasMarginAman: 10,
  });

  it("harga jual mode target margin mengikuti HPP baru", () => {
    const [hasil] = rencanakanRekalkulasi(
      [produk({ id: 1, modePenentuanHarga: "targetMargin", targetMarginPersen: 20 })],
      komponen,
      10,
    );
    // HPP 5.000 ÷ (1 − (10% komisi + 20% target)) = 7.142,86 → 7.143
    assert.equal(hasil.hppTerhitung, 5_000);
    assert.equal(hasil.hargaJualLama, 20_000);
    assert.equal(hasil.hargaJualBaru, 7_143);
  });

  it("harga jual manual dipertahankan, hanya marginnya yang dihitung ulang", () => {
    const [hasil] = rencanakanRekalkulasi([produk({ id: 2 })], komponen, 10);
    assert.equal(hasil.hargaJualBaru, 20_000);
    // (20.000 − 5.000 − 2.000 komisi) ÷ 20.000
    assert.equal(hasil.marginPersen, 65);
  });

  it("memakai pembulatan harga produk", () => {
    const [hasil] = rencanakanRekalkulasi(
      [
        produk({
          id: 3,
          modePenentuanHarga: "targetMargin",
          targetMarginPersen: 20,
          pembulatanHarga: 500,
        }),
      ],
      komponen,
      10,
    );
    assert.equal(hasil.hargaJualBaru, 7_500);
  });

  it("target margin yang tidak sah menggagalkan seluruh rencana", () => {
    assert.throws(
      () =>
        rencanakanRekalkulasi(
          [
            produk({ id: 1 }),
            produk({ id: 2, modePenentuanHarga: "targetMargin", targetMarginPersen: null }),
          ],
          komponen,
          10,
        ),
      PerhitunganHargaTargetError,
    );
  });
});

describe("recalculateAllAffectedByBahan", () => {
  it("hanya membaca produk yang resepnya memakai bahan itu, dalam satu query", async () => {
    const { tx, metode, args } = txTiruan({ produk: [] });
    await recalculateAllAffectedByBahan(BAHAN, USER, tx);

    assert.equal(metode().filter((m) => m === "produk.findMany").length, 1);
    const { where } = args("produk.findMany") as { where: Record<string, unknown> };
    assert.equal(where.userId, USER);
    assert.deepEqual(where.resep, {
      some: { bahanBakuId: BAHAN, bahanBaku: { userId: USER } },
    });
  });

  it("menulis harga target baru, HistoriHargaJual, snapshot, dan notifikasi", async () => {
    const { tx, metode, args } = txTiruan({
      produk: [
        produk({ id: 1, modePenentuanHarga: "targetMargin", targetMarginPersen: 20 }),
        produk({ id: 2 }),
      ],
    });

    const hasil = await recalculateAllAffectedByBahan(BAHAN, USER, tx);

    assert.deepEqual(hasil, { jumlahProdukDihitung: 2, jumlahHargaBerubah: 1 });
    assert.deepEqual(metode().filter((m) => TULIS.includes(m)), TULIS);
    assert.deepEqual(args("historiHargaJual.createMany"), {
      data: [{ produkId: 1, hargaLama: 20_000, hargaBaru: 6_250, alasan: "perubahan harga bahan" }],
    });
    const snapshot = args("hppSnapshot.createMany") as { data: { produkId: number }[] };
    assert.deepEqual(
      snapshot.data.map((s) => s.produkId),
      [1, 2],
    );
  });

  it("tanpa harga yang berubah hanya snapshot yang ditulis", async () => {
    const { tx, metode } = txTiruan({ produk: [produk({ id: 2 })] });
    await recalculateAllAffectedByBahan(BAHAN, USER, tx);
    assert.deepEqual(
      metode().filter((m) => TULIS.includes(m)),
      ["hppSnapshot.createMany"],
    );
  });

  it("target margin yang tidak sah dilempar sebelum ada tulisan", async () => {
    const { tx, metode } = txTiruan({
      produk: [produk({ id: 1, modePenentuanHarga: "targetMargin", targetMarginPersen: 90 })],
    });
    await assert.rejects(recalculateAllAffectedByBahan(BAHAN, USER, tx), PerhitunganHargaTargetError);
    assert.deepEqual(
      metode().filter((m) => TULIS.includes(m)),
      [],
    );
  });

  it("gagal kalau jumlah baris yang diperbarui tidak cocok", async () => {
    const { tx } = txTiruan({
      produk: [produk({ id: 1, modePenentuanHarga: "targetMargin", targetMarginPersen: 20 })],
      jumlahDiperbarui: 0,
    });
    await assert.rejects(recalculateAllAffectedByBahan(BAHAN, USER, tx), /gagal diperbarui/);
  });
});

describe("simpanPerubahanBahan", () => {
  it("hanya menulis histori dan harga bahan, tanpa rekalkulasi produk", async () => {
    const { tx, metode, args } = txTiruan({
      produk: [produk({ id: 1, modePenentuanHarga: "targetMargin", targetMarginPersen: 20 })],
    });

    await simpanPerubahanBahan(tx, {
      id: BAHAN,
      userId: USER,
      data: { nama: "Tepung" },
      rencana: rencanaHistoriHarga(40_000, 50_000),
    });

    assert.deepEqual(metode(), ["historiHarga.create", "bahanBaku.update"]);
    assert.deepEqual(args("bahanBaku.update"), {
      where: { id: BAHAN, userId: USER },
      data: { nama: "Tepung", hargaPerSatuan: 50_000 },
      omit: { userId: true },
    });
  });

  it("harga yang sama tetap dicatat di histori tanpa mengubah harga", async () => {
    const { tx, metode, args } = txTiruan({ produk: [produk({ id: 1 })] });

    await simpanPerubahanBahan(tx, {
      id: BAHAN,
      userId: USER,
      data: { nama: "Tepung" },
      rencana: rencanaHistoriHarga(50_000, 50_000),
    });

    assert.deepEqual(metode(), ["historiHarga.create", "bahanBaku.update"]);
    assert.deepEqual((args("bahanBaku.update") as { data: unknown }).data, { nama: "Tepung" });
  });
});

function galatP2028() {
  return Object.assign(new Error("Transaction API error: Transaction already closed"), {
    code: "P2028",
  });
}

type Transaksi = { metode: string[]; commit: boolean };

/**
 * `prisma.$transaction` tiruan. Setiap pemanggilan dicatat sebagai satu
 * transaksi beserta query di dalamnya. Transaksi kedua dan seterusnya
 * (rekalkulasi) bisa dibuat gagal saat commit dengan galat dari `gagalCommit`,
 * yang berarti tulisannya di-rollback.
 */
function klienTiruan(produkAda: ProdukRekalkulasi[], gagalCommit: unknown[] = []) {
  const { tx, metode } = txTiruan({ produk: produkAda });
  const transaksi: Transaksi[] = [];
  const jalankanTransaksi: JalankanTransaksi = async (kerja) => {
    const awal = metode().length;
    const catatan: Transaksi = { metode: [], commit: false };
    transaksi.push(catatan);
    try {
      const hasil = await kerja(tx as never);
      const galat = transaksi.length > 1 ? gagalCommit.shift() : undefined;
      if (galat !== undefined) throw galat;
      catatan.commit = true;
      return hasil;
    } finally {
      catatan.metode = metode().slice(awal);
    }
  };
  return { jalankanTransaksi, transaksi };
}

const TANPA_JEDA = { tunggu: async () => {} };

describe("ubahBahanLaluRekalkulasi", () => {
  const perubahan = {
    id: BAHAN,
    userId: USER,
    data: {},
    rencana: rencanaHistoriHarga(40_000, 50_000),
  };
  const produkTarget = [produk({ id: 1, modePenentuanHarga: "targetMargin", targetMarginPersen: 20 })];

  it("harga bahan commit di transaksi pertama, rekalkulasi di transaksi kedua", async () => {
    const { jalankanTransaksi, transaksi } = klienTiruan(produkTarget);

    const hasil = await ubahBahanLaluRekalkulasi(jalankanTransaksi, perubahan, TANPA_JEDA);

    assert.equal(hasil.rekalkulasi, "selesai");
    assert.equal(transaksi.length, 2);
    assert.deepEqual(transaksi[0], {
      metode: ["historiHarga.create", "bahanBaku.update"],
      commit: true,
    });
    assert.equal(transaksi[1].metode[0], "produk.findMany");
    assert.ok(transaksi[1].metode.includes("historiHargaJual.createMany"));
  });

  it("harga tetap tersimpan dan rekalkulasi tertunda setelah 3 kali P2028", async () => {
    const { jalankanTransaksi, transaksi } = klienTiruan(produkTarget, [
      galatP2028(),
      galatP2028(),
      galatP2028(),
    ]);
    const errorAsli = console.error;
    console.error = () => {};
    try {
      const hasil = await ubahBahanLaluRekalkulasi(jalankanTransaksi, perubahan, TANPA_JEDA);

      assert.equal(hasil.rekalkulasi, "tertunda");
      assert.deepEqual(hasil.bahan, { id: BAHAN });
    } finally {
      console.error = errorAsli;
    }
    assert.deepEqual(
      transaksi.map((t) => t.commit),
      [true, false, false, false],
    );
    assert.ok(transaksi[0].metode.includes("bahanBaku.update"));
  });

  it("rekalkulasi yang P2028 sekali lalu berhasil tetap selesai", async () => {
    const { jalankanTransaksi, transaksi } = klienTiruan(produkTarget, [galatP2028()]);

    const hasil = await ubahBahanLaluRekalkulasi(jalankanTransaksi, perubahan, TANPA_JEDA);

    assert.equal(hasil.rekalkulasi, "selesai");
    assert.deepEqual(
      transaksi.map((t) => t.commit),
      [true, false, true],
    );
  });

  it("harga yang sama tidak membuka transaksi rekalkulasi", async () => {
    const { jalankanTransaksi, transaksi } = klienTiruan(produkTarget);

    const hasil = await ubahBahanLaluRekalkulasi(
      jalankanTransaksi,
      { ...perubahan, rencana: rencanaHistoriHarga(50_000, 50_000) },
      TANPA_JEDA,
    );

    assert.equal(hasil.rekalkulasi, "selesai");
    assert.equal(transaksi.length, 1);
  });

  it("target margin tidak sah dilempar tanpa dicoba ulang, harga bahan tetap tersimpan", async () => {
    const { jalankanTransaksi, transaksi } = klienTiruan([
      produk({ id: 1, modePenentuanHarga: "targetMargin", targetMarginPersen: 90 }),
    ]);

    await assert.rejects(
      ubahBahanLaluRekalkulasi(jalankanTransaksi, perubahan, TANPA_JEDA),
      PerhitunganHargaTargetError,
    );
    assert.deepEqual(
      transaksi.map((t) => t.commit),
      [true, false],
    );
    assert.ok(!transaksi[1].metode.some((m) => TULIS.includes(m)));
  });
});

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { cariUserLewatEmail, normalisasiEmail } from "../lib/email";

type UserTiruan = { id: number; email: string };

/**
 * Prisma tiruan secukupnya: findUnique cocok persis (seperti indeks unik
 * Postgres), findFirst dengan mode insensitive mengabaikan huruf besar-kecil.
 */
function prismaTiruan(daftar: UserTiruan[]) {
  const panggilan: string[] = [];
  const prisma = {
    user: {
      findUnique: async ({ where }: { where: { email: string } }) => {
        panggilan.push("findUnique");
        return daftar.find((u) => u.email === where.email) ?? null;
      },
      findFirst: async ({ where }: { where: { email: { equals: string } } }) => {
        panggilan.push("findFirst");
        const dicari = where.email.equals.toLowerCase();
        return daftar.find((u) => u.email.toLowerCase() === dicari) ?? null;
      },
    },
  };
  // Cukup untuk dua method yang dipakai; tipe lengkap Prisma tidak diperlukan.
  return { prisma: prisma as unknown as Parameters<typeof cariUserLewatEmail>[0], panggilan };
}

describe("normalisasiEmail", () => {
  it("membuang spasi di tepi dan mengecilkan huruf", () => {
    assert.equal(normalisasiEmail("  Budi@Mail.COM "), "budi@mail.com");
  });

  it("tidak mengubah email yang sudah baku", () => {
    assert.equal(normalisasiEmail("budi@mail.com"), "budi@mail.com");
  });
});

describe("cariUserLewatEmail", () => {
  it("menemukan akun baru walau diketik dengan huruf besar", async () => {
    const { prisma, panggilan } = prismaTiruan([{ id: 1, email: "budi@mail.com" }]);
    const user = await cariUserLewatEmail(prisma, "Budi@Mail.com");
    assert.equal(user?.id, 1);
    // Bentuk baku ketemu lewat indeks unik; cadangan tidak perlu dijalankan.
    assert.deepEqual(panggilan, ["findUnique"]);
  });

  it("menemukan akun lama yang tersimpan dengan huruf besar", async () => {
    const { prisma, panggilan } = prismaTiruan([{ id: 7, email: "Sari@Warung.id" }]);
    const user = await cariUserLewatEmail(prisma, "sari@warung.id");
    assert.equal(user?.id, 7);
    assert.deepEqual(panggilan, ["findUnique", "findFirst"]);
  });

  it("membuang spasi yang ikut tertempel", async () => {
    const { prisma } = prismaTiruan([{ id: 2, email: "ani@mail.com" }]);
    assert.equal((await cariUserLewatEmail(prisma, " ani@mail.com "))?.id, 2);
  });

  it("mengembalikan null bila email tidak terdaftar", async () => {
    const { prisma } = prismaTiruan([{ id: 1, email: "budi@mail.com" }]);
    assert.equal(await cariUserLewatEmail(prisma, "tono@mail.com"), null);
  });
});

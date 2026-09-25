import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { cariUserLewatEmail, normalisasiEmail } from "../lib/email";

type UserTiruan = { id: number; email: string };

/**
 * `$queryRaw` tiruan yang meniru `WHERE lower(email) = $1 ORDER BY (email = $1)
 * DESC, id` — perbandingan persis, tanpa pola. Setiap panggilan dicatat
 * beserta teks SQL dan parameternya.
 */
function prismaTiruan(daftar: UserTiruan[]) {
  const panggilan: { sql: string; nilai: unknown[] }[] = [];
  const prisma = {
    $queryRaw: async (bagian: TemplateStringsArray, ...nilai: unknown[]) => {
      panggilan.push({ sql: bagian.join("?"), nilai });
      const dicari = nilai[0] as string;
      return daftar
        .filter((u) => u.email.toLowerCase() === dicari)
        .sort((a, b) => Number(b.email === dicari) - Number(a.email === dicari) || a.id - b.id)
        .slice(0, 1);
    },
  };
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
  it("menemukan akun walau diketik dengan huruf besar", async () => {
    const { prisma } = prismaTiruan([{ id: 1, email: "budi@mail.com" }]);
    assert.equal((await cariUserLewatEmail(prisma, "Budi@Mail.com"))?.id, 1);
  });

  it("menemukan akun lama yang tersimpan dengan huruf besar", async () => {
    const { prisma } = prismaTiruan([{ id: 7, email: "Sari@Warung.id" }]);
    assert.equal((await cariUserLewatEmail(prisma, "sari@warung.id"))?.id, 7);
  });

  it("mendahulukan akun yang tersimpan persis dalam bentuk baku", async () => {
    const { prisma } = prismaTiruan([
      { id: 3, email: "Ani@Mail.com" },
      { id: 9, email: "ani@mail.com" },
    ]);
    assert.equal((await cariUserLewatEmail(prisma, "ANI@mail.com"))?.id, 9);
  });

  it("membuang spasi yang ikut tertempel", async () => {
    const { prisma } = prismaTiruan([{ id: 2, email: "ani@mail.com" }]);
    assert.equal((await cariUserLewatEmail(prisma, " ani@mail.com "))?.id, 2);
  });

  it("mengembalikan null bila email tidak terdaftar", async () => {
    const { prisma } = prismaTiruan([{ id: 1, email: "budi@mail.com" }]);
    assert.equal(await cariUserLewatEmail(prisma, "tono@mail.com"), null);
  });

  it("selalu tepat satu query, ada atau tidak akunnya", async () => {
    const { prisma, panggilan } = prismaTiruan([{ id: 1, email: "budi@mail.com" }]);
    await cariUserLewatEmail(prisma, "budi@mail.com");
    await cariUserLewatEmail(prisma, "tono@mail.com");
    assert.equal(panggilan.length, 2);
  });
});

describe("cariUserLewatEmail — % dan _ bukan wildcard", () => {
  const akun = [
    { id: 1, email: "budi@mail.com" },
    { id: 2, email: "johnxdoe@mail.com" },
  ];

  for (const pola of ["%", "%@mail.com", "b%", "_udi@mail.com", "john_doe@mail.com"]) {
    it(`"${pola}" tidak cocok dengan akun mana pun`, async () => {
      const { prisma } = prismaTiruan(akun);
      assert.equal(await cariUserLewatEmail(prisma, pola), null);
    });
  }

  it("email dikirim sebagai parameter, tidak disisipkan ke teks SQL", async () => {
    const { prisma, panggilan } = prismaTiruan(akun);
    await cariUserLewatEmail(prisma, "Budi@Mail.com");
    const [{ sql, nilai }] = panggilan;
    assert.ok(!/like/i.test(sql), "SQL tidak boleh memakai LIKE/ILIKE");
    assert.ok(!sql.includes("budi@mail.com"));
    assert.ok(nilai.every((n) => n === "budi@mail.com"));
  });
});

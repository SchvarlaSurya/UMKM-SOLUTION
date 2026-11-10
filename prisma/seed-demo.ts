import "dotenv/config";
import bcrypt from "bcryptjs";
import { normalisasiEmail, cariUserLewatEmail } from "../lib/email";
import { AKUN_DEMO } from "../lib/akunDemo";
import { prisma } from "../lib/prisma";

/**
 * Membuat (atau menyegarkan) akun demo untuk juri, lalu mengisinya dengan data
 * demo dari prisma/seed.ts.
 *
 * Aman dijalankan berulang: akun dibuat kalau belum ada, kata sandinya
 * dikembalikan ke nilai di lib/akunDemo.ts kalau sudah ada, dan data usaha akun ini
 * selalu diisi ulang dari nol. Akun lain tidak disentuh.
 *
 * Jalankan: npm run seed:demo
 */

// Nilai akun ada di lib/akunDemo.ts supaya tombol isi-otomatis di halaman masuk
// memakai persis yang sama.

async function siapkanAkun() {
  const email = normalisasiEmail(AKUN_DEMO.email);
  const hash = await bcrypt.hash(AKUN_DEMO.password, 10);

  const ada = await cariUserLewatEmail(prisma, email);

  const user = ada
    ? await prisma.user.update({
        where: { id: ada.id },
        data: { password: hash, nama: AKUN_DEMO.nama },
      })
    : await prisma.user.create({
        data: { email, password: hash, nama: AKUN_DEMO.nama },
      });

  await prisma.usaha.upsert({
    where: { userId: user.id },
    update: { namaUsaha: AKUN_DEMO.namaUsaha, jenisUsaha: AKUN_DEMO.jenisUsaha },
    create: {
      userId: user.id,
      namaUsaha: AKUN_DEMO.namaUsaha,
      jenisUsaha: AKUN_DEMO.jenisUsaha,
    },
  });

  console.log(`${ada ? "Akun demo diperbarui" : "Akun demo dibuat"}: ${email} (id ${user.id}).`);
  return email;
}

async function main() {
  const email = await siapkanAkun();

  // seed.ts membaca env ini saat dimuat, lalu mengisi data akun tersebut.
  process.env.SEED_EMAIL = email;
  process.env.SEED_RESET = "1";
  await import("./seed");
}

main().catch(async (galat) => {
  console.error("Seed demo gagal:", galat);
  process.exitCode = 1;
  await prisma.$disconnect();
});

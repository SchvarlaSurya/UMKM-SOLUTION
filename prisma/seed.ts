import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

/**
 * Mengisi database dengan data demo usaha kuliner: 10 bahan baku, 8 produk
 * beserta resepnya, 5 pos biaya operasional, pengaturan, dan histori harga
 * untuk tiga bahan.
 *
 * Sejak data dipisah per akun, seluruh isian dimiliki satu akun. Akun tujuan
 * ditentukan SEED_EMAIL; kalau tidak diisi, dipakai akun paling awal.
 *
 * Jalankan: npm run seed
 * Pilih akun: SEED_EMAIL=nama@usaha.com npm run seed
 * Isi ulang dari nol: SEED_RESET=1 npm run seed
 *
 * Tabel User tidak pernah disentuh, jadi akun yang sudah terdaftar aman.
 */

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const BAHAN = [
  { nama: "Ayam fillet", satuan: "kg", hargaPerSatuan: 42000 },
  { nama: "Beras", satuan: "kg", hargaPerSatuan: 15000 },
  { nama: "Minyak goreng", satuan: "liter", hargaPerSatuan: 20000 },
  { nama: "Cabai rawit", satuan: "kg", hargaPerSatuan: 65000 },
  { nama: "Tepung terigu", satuan: "kg", hargaPerSatuan: 12000 },
  { nama: "Telur ayam", satuan: "butir", hargaPerSatuan: 2000 },
  { nama: "Mi telur", satuan: "kg", hargaPerSatuan: 18000 },
  { nama: "Teh", satuan: "gram", hargaPerSatuan: 100 },
  { nama: "Gula pasir", satuan: "kg", hargaPerSatuan: 18000 },
  { nama: "Bumbu racik", satuan: "gram", hargaPerSatuan: 80 },
];

const BIAYA = [
  { nama: "Gas LPG", jenis: "tetap", nilai: 300000 },
  { nama: "Listrik", jenis: "tetap", nilai: 250000 },
  { nama: "Air", jenis: "tetap", nilai: 70000 },
  { nama: "Kemasan", jenis: "tetap", nilai: 100000 },
  { nama: "Komisi aplikasi pesan antar", jenis: "persentase", nilai: 5 },
];

/** Resep memakai nama bahan; id-nya diambil setelah bahan tersimpan. */
const PRODUK = [
  {
    nama: "Nasi Ayam Geprek",
    kategori: "Makanan utama",
    hargaJual: 22000,
    resep: [
      ["Ayam fillet", 0.18],
      ["Beras", 0.2],
      ["Minyak goreng", 0.05],
      ["Cabai rawit", 0.05],
      ["Bumbu racik", 20],
    ],
  },
  {
    nama: "Nasi Goreng Spesial",
    kategori: "Makanan utama",
    hargaJual: 20000,
    resep: [
      ["Beras", 0.25],
      ["Telur ayam", 1],
      ["Minyak goreng", 0.04],
      ["Bumbu racik", 25],
    ],
  },
  {
    nama: "Ayam Crispy",
    kategori: "Lauk & camilan",
    hargaJual: 15000,
    resep: [
      ["Ayam fillet", 0.2],
      ["Tepung terigu", 0.08],
      ["Minyak goreng", 0.06],
      ["Bumbu racik", 15],
    ],
  },
  {
    nama: "Mi Goreng Jawa",
    kategori: "Makanan utama",
    hargaJual: 18000,
    resep: [
      ["Mi telur", 0.15],
      ["Telur ayam", 1],
      ["Minyak goreng", 0.04],
      ["Bumbu racik", 25],
    ],
  },
  {
    nama: "Telur Dadar Crispy",
    kategori: "Lauk & camilan",
    hargaJual: 10000,
    resep: [
      ["Telur ayam", 2],
      ["Tepung terigu", 0.03],
      ["Minyak goreng", 0.05],
      ["Bumbu racik", 10],
    ],
  },
  {
    nama: "Nasi Putih",
    kategori: "Pelengkap",
    hargaJual: 5000,
    resep: [["Beras", 0.15]],
  },
  {
    nama: "Es Teh Manis",
    kategori: "Minuman",
    hargaJual: 6000,
    resep: [
      ["Teh", 5],
      ["Gula pasir", 0.02],
    ],
  },
  {
    nama: "Ayam Sambal Matah",
    kategori: "Makanan utama",
    hargaJual: 25000,
    resep: [
      ["Ayam fillet", 0.2],
      ["Beras", 0.2],
      ["Cabai rawit", 0.06],
      ["Minyak goreng", 0.04],
      ["Bumbu racik", 20],
    ],
  },
] satisfies Array<{
  nama: string;
  kategori: string;
  hargaJual: number;
  resep: Array<[string, number]>;
}>;

/** Perubahan harga 30 hari terakhir, dipakai halaman tren dan widget dashboard. */
const HISTORI: Array<[nama: string, hargaLama: number, hargaBaru: number, tanggal: string]> = [
  ["Cabai rawit", 57000, 57000, "2026-08-10"],
  ["Cabai rawit", 57000, 58500, "2026-08-16"],
  ["Cabai rawit", 58500, 60000, "2026-08-22"],
  ["Cabai rawit", 60000, 61500, "2026-08-28"],
  ["Cabai rawit", 61500, 63000, "2026-09-03"],
  ["Cabai rawit", 63000, 65000, "2026-09-09"],
  ["Ayam fillet", 41000, 41000, "2026-08-11"],
  ["Ayam fillet", 41000, 43500, "2026-08-19"],
  ["Ayam fillet", 43500, 44000, "2026-08-27"],
  ["Ayam fillet", 44000, 42000, "2026-09-06"],
  ["Minyak goreng", 19500, 19500, "2026-08-12"],
  ["Minyak goreng", 19500, 20000, "2026-08-24"],
  ["Minyak goreng", 20000, 20000, "2026-09-05"],
];

/**
 * Hapus data demo milik SATU akun saja. Akun lain tidak boleh ikut terhapus,
 * karena sejak pemisahan data tiap akun punya ruangnya sendiri.
 */
async function kosongkan(userId: number) {
  await prisma.hppSnapshot.deleteMany({ where: { produk: { userId } } });
  await prisma.resep.deleteMany({ where: { produk: { userId } } });
  await prisma.historiHarga.deleteMany({ where: { bahanBaku: { userId } } });
  await prisma.produk.deleteMany({ where: { userId } });
  await prisma.bahanBaku.deleteMany({ where: { userId } });
  await prisma.biayaOperasional.deleteMany({ where: { userId } });
  await prisma.pengaturan.deleteMany({ where: { userId } });
}

/** Akun tujuan seed: SEED_EMAIL kalau diisi, selain itu akun paling awal. */
async function tentukanPemilik() {
  const email = process.env.SEED_EMAIL;

  if (email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error(`Tidak ada akun dengan email "${email}". Daftarkan dulu lewat /register.`);
    }
    return user;
  }

  const pertama = await prisma.user.findFirst({ orderBy: { id: "asc" } });
  if (!pertama) {
    throw new Error(
      "Belum ada satu pun akun. Daftar dulu lewat /register, " +
        "lalu jalankan ulang seed (boleh sekalian pilih akunnya dengan SEED_EMAIL).",
    );
  }
  return pertama;
}

async function main() {
  const reset = process.env.SEED_RESET === "1";
  const pemilik = await tentukanPemilik();
  const userId = pemilik.id;

  const sudahAdaIsi =
    (await prisma.bahanBaku.count({ where: { userId } })) > 0 ||
    (await prisma.produk.count({ where: { userId } })) > 0;

  if (sudahAdaIsi && !reset) {
    console.log(
      `Akun ${pemilik.email} sudah punya bahan baku atau produk, seed dilewati.\n` +
        "Jalankan dengan SEED_RESET=1 kalau memang mau menimpa data akun itu.",
    );
    return;
  }

  console.log(`Mengisi data demo untuk akun ${pemilik.email} (id ${userId}).`);

  if (reset) {
    console.log("SEED_RESET=1 — menghapus data demo lama milik akun ini…");
    await kosongkan(userId);
  }

  // Baris Pengaturan bisa sudah dibuat lebih dulu oleh GET /api/pengaturan
  // saat akun pertama kali membuka aplikasi, jadi upsert bukan create.
  await prisma.pengaturan.upsert({
    where: { userId },
    update: { estimasiPorsiPerBulan: 1200, batasMarginAman: 30 },
    create: { estimasiPorsiPerBulan: 1200, batasMarginAman: 30, userId },
  });

  await prisma.bahanBaku.createMany({ data: BAHAN.map((b) => ({ ...b, userId })) });
  await prisma.biayaOperasional.createMany({ data: BIAYA.map((b) => ({ ...b, userId })) });

  const bahanTersimpan = await prisma.bahanBaku.findMany({ where: { userId } });
  const idBahan = new Map(bahanTersimpan.map((b) => [b.nama, b.id]));

  for (const produk of PRODUK) {
    await prisma.produk.create({
      data: {
        nama: produk.nama,
        kategori: produk.kategori,
        hargaJual: produk.hargaJual,
        userId,
        resep: {
          create: produk.resep.map(([nama, jumlah]) => ({
            bahanBakuId: idBahan.get(nama)!,
            jumlahDipakai: jumlah,
          })),
        },
      },
    });
  }

  await prisma.historiHarga.createMany({
    data: HISTORI.map(([nama, hargaLama, hargaBaru, tanggal]) => ({
      bahanBakuId: idBahan.get(nama)!,
      hargaLama,
      hargaBaru,
      tanggal: new Date(`${tanggal}T00:00:00.000Z`),
    })),
  });

  console.log(
    `Selesai: ${BAHAN.length} bahan baku, ${PRODUK.length} produk, ` +
      `${BIAYA.length} biaya operasional, ${HISTORI.length} catatan harga.`,
  );
}

main()
  .catch((galat) => {
    console.error("Seed gagal:", galat);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

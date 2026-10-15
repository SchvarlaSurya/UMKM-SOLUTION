import type { Prisma } from '@/app/generated/prisma/client'
import type { RencanaHistori } from '@/lib/histori'
import { PerhitunganHargaTargetError, recalculateAllAffectedByBahan } from '@/lib/hppCalculator'
import { JUDUL_REKALKULASI_TERTUNDA, pangkasNotifikasiTerbaca } from '@/lib/notifikasi'
import {
  cobaUlangSaatTimeout,
  jalankanRekalkulasi,
  type OpsiCobaUlang,
  type StatusRekalkulasi,
} from '@/lib/cobaUlangTransaksi'

type KlienPerubahanBahan = Pick<Prisma.TransactionClient, 'historiHarga' | 'bahanBaku'>

export type PerubahanBahan = {
  id: number
  userId: number
  /** Kolom selain harga yang ikut disimpan; yang `undefined` tidak disentuh. */
  data: { nama?: string; satuan?: string }
  rencana: RencanaHistori
}

/**
 * Tulis histori harga dan harga bahannya sendiri. `db` harus client transaksi
 * supaya keduanya atomik: tidak ada histori tanpa harga, atau sebaliknya.
 *
 * Rekalkulasi produk sengaja TIDAK ikut di sini, lihat `ubahBahanLaluRekalkulasi`.
 */
export async function simpanPerubahanBahan(
  db: KlienPerubahanBahan,
  { id, userId, data, rencana }: PerubahanBahan
) {
  if (rencana.catatHistori) {
    await db.historiHarga.create({
      data: {
        bahanBakuId: id,
        hargaLama: rencana.hargaLama,
        hargaBaru: rencana.hargaBaru,
      },
    })
  }

  return db.bahanBaku.update({
    where: { id, userId },
    data: {
      ...(data.nama !== undefined ? { nama: data.nama } : {}),
      ...(data.satuan !== undefined ? { satuan: data.satuan } : {}),
      ...(rencana.hargaBerubah ? { hargaPerSatuan: rencana.hargaBaru } : {}),
    },
    omit: { userId: true },
  })
}

/** Biasanya `(fn) => prisma.$transaction(fn)`; di tes diganti tiruan. */
export type JalankanTransaksi = <T>(
  kerja: (tx: Prisma.TransactionClient) => Promise<T>
) => Promise<T>

/**
 * Simpan perubahan bahan, lalu hitung ulang produk yang memakainya, dalam dua
 * transaksi terpisah. Dipakai Server Action dan PUT /api/bahan-baku/[id]
 * supaya kedua jalur tidak bisa berbeda urutan.
 *
 * Harga bahan commit lebih dulu dan tidak pernah di-rollback karena
 * rekalkulasi: harga itu sudah dicek pemilik usaha ke pemasok. Rekalkulasi
 * dicoba ulang saat P2028; kalau tetap timeout, hasilnya `tertunda` dan
 * pemanggil memberi tanda ke pengguna. Galat rekalkulasi lain (target margin
 * yang tidak sah) tetap dilempar, meski harga bahannya sudah tersimpan.
 *
 * Dalam kedua kasus itu satu notifikasi juga ditulis. Pesan di respons hanya
 * terlihat sekali, di layar yang mungkin langsung ditutup, padahal harga jual
 * produk mode target margin tetap salah sampai dihitung ulang.
 */
export async function ubahBahanLaluRekalkulasi(
  jalankanTransaksi: JalankanTransaksi,
  perubahan: PerubahanBahan,
  opsi?: OpsiCobaUlang
): Promise<{ bahan: Awaited<ReturnType<typeof simpanPerubahanBahan>>; rekalkulasi: StatusRekalkulasi }> {
  const bahan = await cobaUlangSaatTimeout(
    () => jalankanTransaksi((tx) => simpanPerubahanBahan(tx, perubahan)),
    opsi
  )

  // Tanpa harga, misalnya ganti nama saja, angka HPP tidak mungkin berubah.
  // Harga yang dikirim ulang dengan nominal sama tetap dihitung ulang: itu
  // satu-satunya jalan pemilik usaha mengulang rekalkulasi yang dulu tertunda,
  // dan notifikasinya memang menyuruh menyimpan ulang harga bahan.
  if (!perubahan.rencana.catatHistori) return { bahan, rekalkulasi: 'selesai' }

  let rekalkulasi: StatusRekalkulasi
  try {
    rekalkulasi = await jalankanRekalkulasi(
      () =>
        jalankanTransaksi((tx) =>
          recalculateAllAffectedByBahan(perubahan.id, perubahan.userId, tx)
        ),
      opsi
    )
  } catch (galat) {
    if (galat instanceof PerhitunganHargaTargetError) {
      await kabarkanRekalkulasiGagal(
        jalankanTransaksi,
        perubahan.userId,
        `Harga ${bahan.nama} sudah tersimpan, tetapi harga jual produk yang memakainya gagal dihitung ulang: ${galat.message}. Periksa target margin produknya, lalu simpan ulang harga ${bahan.nama} di halaman Bahan baku.`,
        opsi
      )
    }
    throw galat
  }

  if (rekalkulasi === 'tertunda') {
    console.error(
      `[hpp] Rekalkulasi bahan ${perubahan.id} milik user ${perubahan.userId} tertunda: masih P2028 setelah dicoba ulang`
    )
    await kabarkanRekalkulasiGagal(
      jalankanTransaksi,
      perubahan.userId,
      `Harga ${bahan.nama} sudah tersimpan, tetapi harga jual produk yang memakainya belum ikut dihitung ulang karena koneksi ke database lambat. Simpan ulang harga ${bahan.nama} di halaman Bahan baku untuk menghitungnya lagi.`,
      opsi
    )
  }
  return { bahan, rekalkulasi }
}

/**
 * Tulis notifikasi bahwa harga jual belum mengikuti harga bahan terbaru.
 *
 * Usaha terbaik: kalau database masih tersendat sampai notifikasinya pun
 * gagal ditulis, galatnya dicatat di log dan tidak dilempar. Harga bahannya
 * sudah tersimpan, dan pemanggil tetap menerima status atau galat aslinya.
 */
async function kabarkanRekalkulasiGagal(
  jalankanTransaksi: JalankanTransaksi,
  userId: number,
  pesan: string,
  opsi?: OpsiCobaUlang
) {
  try {
    await cobaUlangSaatTimeout(
      () =>
        jalankanTransaksi(async (tx) => {
          await tx.notifikasi.createMany({
            data: [{ userId, judul: JUDUL_REKALKULASI_TERTUNDA, pesan }],
          })
          await pangkasNotifikasiTerbaca(tx, userId)
        }),
      opsi
    )
  } catch (galat) {
    console.error(`[hpp] Notifikasi rekalkulasi tertunda untuk user ${userId} gagal ditulis`, galat)
  }
}

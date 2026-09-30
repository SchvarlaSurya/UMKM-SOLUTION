import type { Prisma } from '@/app/generated/prisma/client'
import type { RencanaHistori } from '@/lib/histori'
import { recalculateAllAffectedByBahan } from '@/lib/hppCalculator'
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

  // Nominal yang sama menghasilkan HPP yang sama, jadi tidak perlu dihitung
  // ulang meski historinya tetap dicatat. Ganti nama juga tidak mengubah angka.
  if (!perubahan.rencana.hargaBerubah) return { bahan, rekalkulasi: 'selesai' }

  const rekalkulasi = await jalankanRekalkulasi(
    () =>
      jalankanTransaksi((tx) =>
        recalculateAllAffectedByBahan(perubahan.id, perubahan.userId, tx)
      ),
    opsi
  )
  if (rekalkulasi === 'tertunda') {
    console.error(
      `[hpp] Rekalkulasi bahan ${perubahan.id} milik user ${perubahan.userId} tertunda: masih P2028 setelah dicoba ulang`
    )
  }
  return { bahan, rekalkulasi }
}

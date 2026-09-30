import type { Prisma } from '@/app/generated/prisma/client'
import type { RencanaHistori } from '@/lib/histori'
import { recalculateAllAffectedByBahan } from '@/lib/hppCalculator'

type KlienPerubahanBahan = Parameters<typeof recalculateAllAffectedByBahan>[2] &
  Pick<Prisma.TransactionClient, 'historiHarga'>

export type PerubahanBahan = {
  id: number
  userId: number
  /** Kolom selain harga yang ikut disimpan; yang `undefined` tidak disentuh. */
  data: { nama?: string; satuan?: string }
  rencana: RencanaHistori
}

/**
 * Simpan perubahan bahan baku beserta seluruh turunannya: histori harga bahan,
 * harga bahannya sendiri, lalu HPP, harga target, HistoriHargaJual, dan
 * notifikasi produk yang memakainya.
 *
 * `db` harus client transaksi. Semuanya satu unit: kalau rekalkulasi gagal —
 * target margin yang tidak sah, atau transaksi kehabisan waktu — harga bahan
 * ikut batal, jadi tidak ada lagi bahan berharga baru dengan produk yang masih
 * memakai harga jual lama. Dipakai Server Action dan PUT /api/bahan-baku/[id]
 * supaya kedua jalur tidak bisa berbeda urutan.
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

  const bahan = await db.bahanBaku.update({
    where: { id, userId },
    data: {
      ...(data.nama !== undefined ? { nama: data.nama } : {}),
      ...(data.satuan !== undefined ? { satuan: data.satuan } : {}),
      ...(rencana.hargaBerubah ? { hargaPerSatuan: rencana.hargaBaru } : {}),
    },
    omit: { userId: true },
  })

  // Nominal yang sama menghasilkan HPP yang sama, jadi tidak perlu dihitung
  // ulang meski historinya tetap dicatat. Ganti nama juga tidak mengubah angka.
  if (rencana.hargaBerubah) {
    await recalculateAllAffectedByBahan(id, userId, db)
  }

  return bahan
}

import { prisma } from '@/lib/prisma'
import { biayaBahanProduk, hitungHpp, komponenBiaya } from '@/lib/hpp'
import type { Prisma } from '@/app/generated/prisma/client'

export type HppResult = {
  produkId: number
  hppTerhitung: number
  marginPersen: number
  statusAman: boolean
}

export type CalculateHppOptions = {
  /** Override `batasMarginAman` dari tabel Pengaturan. */
  thresholdOverride?: number
  /**
   * Tulis hasil ke tabel `HppSnapshot`. Default `false` supaya endpoint GET
   * tetap read-only. Jalur mutasi menyimpan snapshot saat biaya berubah.
   */
  simpanSnapshot?: boolean
}

export const MODE_PENENTUAN_HARGA = ['manual', 'targetMargin'] as const
export type ModePenentuanHarga = (typeof MODE_PENENTUAN_HARGA)[number]

export const TARGET_MARGIN_MIN = 0
export const TARGET_MARGIN_MAX = 80

export class PerhitunganHargaTargetError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PerhitunganHargaTargetError'
  }
}

export function isModePenentuanHarga(nilai: unknown): nilai is ModePenentuanHarga {
  return (
    typeof nilai === 'string' &&
    (MODE_PENENTUAN_HARGA as readonly string[]).includes(nilai)
  )
}

export function isTargetMarginPersen(nilai: unknown): nilai is number {
  return (
    typeof nilai === 'number' &&
    Number.isFinite(nilai) &&
    nilai >= TARGET_MARGIN_MIN &&
    nilai <= TARGET_MARGIN_MAX
  )
}

/** Hitung harga jual target dan bulatkan ke rupiah penuh. */
export function hitungHargaJualTargetMargin(
  hpp: number,
  persenKomisi: number,
  targetMarginPersen: number
): number {
  if (!Number.isFinite(hpp) || hpp < 0) {
    throw new PerhitunganHargaTargetError('HPP harus berupa angka yang valid dan tidak negatif')
  }
  if (!Number.isFinite(persenKomisi) || persenKomisi < 0) {
    throw new PerhitunganHargaTargetError(
      'Persentase komisi harus berupa angka yang valid dan tidak negatif'
    )
  }
  if (!isTargetMarginPersen(targetMarginPersen)) {
    throw new PerhitunganHargaTargetError(
      `Target margin harus antara ${TARGET_MARGIN_MIN} sampai ${TARGET_MARGIN_MAX} persen`
    )
  }

  const totalPersen = persenKomisi + targetMarginPersen
  if (totalPersen >= 100) {
    throw new PerhitunganHargaTargetError(
      'Jumlah persentase komisi dan target margin harus kurang dari 100 persen'
    )
  }

  const hargaJual = Math.round(hpp / (1 - totalPersen / 100))
  if (!Number.isFinite(hargaJual)) {
    throw new PerhitunganHargaTargetError('Harga jual target tidak dapat dihitung')
  }
  return hargaJual
}

export type ResepHargaTarget = {
  bahanBakuId: number
  jumlahDipakai: number
}

export type HasilHargaTarget = {
  hppTerhitung: number
  persenKomisi: number
  hargaJual: number
}

type DatabaseClient = Pick<
  Prisma.TransactionClient,
  | 'pengaturan'
  | 'biayaOperasional'
  | 'bahanBaku'
  | 'produk'
  | 'resep'
  | 'hppSnapshot'
  | 'historiHargaJual'
  | 'notifikasi'
>

/** Default harus sama dengan `@default` di prisma/schema.prisma model Pengaturan. */
const PENGATURAN_DEFAULT = { estimasiPorsiPerBulan: 1200, batasMarginAman: 10 }

/**
 * Baca saja, jangan pernah membuat baris. Kalau tabel Pengaturan masih kosong,
 * pakai nilai default supaya perhitungan tetap jalan tanpa menulis ke DB
 * (GET /api/pengaturan yang bertugas membuat baris pertama).
 */
async function getPengaturan(userId: number, db: DatabaseClient = prisma) {
  const pengaturan = await db.pengaturan.findUnique({ where: { userId } })
  return pengaturan ?? PENGATURAN_DEFAULT
}

async function getKonteksBiaya(userId: number, db: DatabaseClient = prisma) {
  const [pengaturan, semuaBiaya] = await Promise.all([
    getPengaturan(userId, db),
    db.biayaOperasional.findMany({ where: { userId } }),
  ])
  return { pengaturan, komponen: komponenBiaya(semuaBiaya, pengaturan) }
}

/**
 * Hitung harga target dari resep tanpa menyimpan data. Semua bahan dan biaya
 * selalu dibatasi ke akun yang sama.
 */
export async function calculateHargaJualTargetMarginDariResep(
  resep: readonly ResepHargaTarget[],
  userId: number,
  targetMarginPersen: number,
  db: DatabaseClient = prisma
): Promise<HasilHargaTarget> {
  const [bahan, konteks] = await Promise.all([
    db.bahanBaku.findMany({
      where: { userId, id: { in: resep.map((baris) => baris.bahanBakuId) } },
      select: { id: true, hargaPerSatuan: true },
    }),
    getKonteksBiaya(userId, db),
  ])

  const hargaBahan = new Map(bahan.map((item) => [item.id, item.hargaPerSatuan]))
  const idHilang = resep
    .map((baris) => baris.bahanBakuId)
    .filter((id) => !hargaBahan.has(id))
  if (idHilang.length > 0) {
    throw new PerhitunganHargaTargetError(
      `Bahan baku tidak ditemukan: id ${[...new Set(idHilang)].join(', ')}`
    )
  }

  const biayaBahan = resep.reduce(
    (total, baris) =>
      total + baris.jumlahDipakai * (hargaBahan.get(baris.bahanBakuId) ?? 0),
    0
  )
  const hppTerhitung = biayaBahan + konteks.komponen.biayaTetapPerPorsi

  return {
    hppTerhitung,
    persenKomisi: konteks.komponen.persenKomisi,
    hargaJual: hitungHargaJualTargetMargin(
      hppTerhitung,
      konteks.komponen.persenKomisi,
      targetMarginPersen
    ),
  }
}

export async function calculateHpp(
  produkId: number,
  userId: number,
  options: CalculateHppOptions = {}
): Promise<HppResult> {
  const { thresholdOverride, simpanSnapshot = false } = options

  const produk = await prisma.produk.findFirst({
    where: { id: produkId, userId },
    include: {
      resep: {
        where: { bahanBaku: { userId } },
        include: { bahanBaku: true },
      },
    },
  })
  if (!produk) throw new Error('Produk tidak ditemukan')

  const pengaturan = await getPengaturan(userId)
  const threshold = thresholdOverride ?? pengaturan.batasMarginAman

  const semuaBiaya = await prisma.biayaOperasional.findMany({ where: { userId } })

  // Rumusnya sendiri ada di lib/hpp.ts supaya halaman bisa memakai perhitungan
  // yang sama tanpa memanggil fungsi ini sekali per produk:
  // biaya tetap dibagi estimasi porsi per bulan, komisi persentase dipotong
  // dari HARGA JUAL (bukan dari HPP).
  const { hppTerhitung, marginPersen } = hitungHpp(
    biayaBahanProduk(produk),
    produk.hargaJual,
    komponenBiaya(semuaBiaya, pengaturan),
    threshold
  )

  if (simpanSnapshot) {
    await prisma.hppSnapshot.create({
      data: { produkId, hppTerhitung, marginPersen },
    })
  }

  return {
    produkId,
    hppTerhitung,
    marginPersen,
    statusAman: marginPersen >= threshold,
  }
}

type HasilRecalculate = {
  jumlahProdukDihitung: number
  jumlahHargaBerubah: number
}

async function recalculateProduk(
  userId: number,
  alasan: string,
  db: DatabaseClient,
  produkIds?: readonly number[]
): Promise<HasilRecalculate> {
  if (produkIds && produkIds.length === 0) {
    return { jumlahProdukDihitung: 0, jumlahHargaBerubah: 0 }
  }

  const [semuaProduk, konteks] = await Promise.all([
    db.produk.findMany({
      where: {
        userId,
        ...(produkIds ? { id: { in: [...produkIds] } } : {}),
      },
      include: {
        resep: {
          where: { bahanBaku: { userId } },
          include: { bahanBaku: true },
        },
      },
    }),
    getKonteksBiaya(userId, db),
  ])

  // Selesaikan seluruh validasi sebelum menulis, supaya satu target margin
  // yang tidak sah membatalkan pemicu secara utuh.
  const hasil = semuaProduk.map((produk) => {
    const biayaBahan = biayaBahanProduk(produk)
    const hppTerhitung = biayaBahan + konteks.komponen.biayaTetapPerPorsi
    const hargaJualBaru =
      produk.modePenentuanHarga === 'targetMargin'
        ? hitungHargaJualTargetMargin(
            hppTerhitung,
            konteks.komponen.persenKomisi,
            produk.targetMarginPersen ?? Number.NaN
          )
        : produk.hargaJual
    const rincian = hitungHpp(
      biayaBahan,
      hargaJualBaru,
      konteks.komponen,
      konteks.pengaturan.batasMarginAman
    )

    return { produk, hargaJualBaru, rincian }
  })

  let jumlahHargaBerubah = 0
  for (const item of hasil) {
    if (item.hargaJualBaru !== item.produk.hargaJual) {
      await db.produk.update({
        where: { id: item.produk.id, userId },
        data: { hargaJual: item.hargaJualBaru },
      })
      await db.historiHargaJual.create({
        data: {
          produkId: item.produk.id,
          hargaLama: item.produk.hargaJual,
          hargaBaru: item.hargaJualBaru,
          alasan,
        },
      })
      jumlahHargaBerubah += 1
    }

    await db.hppSnapshot.create({
      data: {
        produkId: item.produk.id,
        hppTerhitung: item.rincian.hppTerhitung,
        marginPersen: item.rincian.marginPersen,
      },
    })
  }

  if (jumlahHargaBerubah > 0) {
    await db.notifikasi.create({
      data: {
        userId,
        judul: 'Harga jual diperbarui otomatis',
        pesan: `${jumlahHargaBerubah} produk mengalami perubahan harga jual karena ${alasan}.`,
      },
    })
  }

  return {
    jumlahProdukDihitung: hasil.length,
    jumlahHargaBerubah,
  }
}

/**
 * Dipanggil setelah harga bahan baku berubah dan menyimpan snapshot baru untuk
 * setiap produk milik user yang memakai bahan tersebut.
 */
export async function recalculateAllAffectedByBahan(
  bahanBakuId: number,
  userId: number
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const resepTerkait = await tx.resep.findMany({
      where: {
        bahanBakuId,
        bahanBaku: { userId },
        produk: { userId },
      },
    })
    const produkIdUnik = [...new Set(resepTerkait.map((r) => r.produkId))]
    await recalculateProduk(userId, 'perubahan harga bahan', tx, produkIdUnik)
  })
}

/**
 * Dipanggil setelah POST/PUT/DELETE biaya operasional, idealnya dengan client
 * transaksi yang sama agar perubahan biaya dan seluruh turunannya atomik.
 */
export async function recalculateAllByBiayaOperasional(
  userId: number,
  db: DatabaseClient = prisma
): Promise<HasilRecalculate> {
  return recalculateProduk(userId, 'perubahan biaya operasional', db)
}

/** Read-only: tidak menulis snapshot. Dipakai dashboard. */
export async function calculateAllHpp(
  userId: number,
  thresholdOverride?: number
): Promise<HppResult[]> {
  const semuaProduk = await prisma.produk.findMany({
    where: { userId },
    select: { id: true },
  })
  const hasil: HppResult[] = []
  for (const p of semuaProduk) {
    hasil.push(await calculateHpp(p.id, userId, { thresholdOverride }))
  }
  return hasil
}

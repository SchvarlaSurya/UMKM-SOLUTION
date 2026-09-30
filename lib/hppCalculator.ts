import { prisma } from '@/lib/prisma'
import {
  biayaBahanProduk,
  bulatkanHargaJual,
  hitungHpp,
  hitungTitikImpas,
  komponenBiaya,
  type KomponenBiaya,
  type MasukanProduk,
} from '@/lib/hpp'
import { pangkasNotifikasiTerbaca } from '@/lib/notifikasi'
import { Prisma } from '@/app/generated/prisma/client'

export type HppResult = {
  produkId: number
  hppTerhitung: number
  marginPersen: number
  statusAman: boolean
  /** Porsi per bulan untuk menutup biaya tetap; null kalau tidak terhingga. */
  titikImpasPorsi: number | null
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

/**
 * Hitung harga jual yang memenuhi target margin, dibulatkan ke rupiah penuh.
 *
 * `pembulatan` membulatkan hasilnya KE ATAS ke kelipatan pasaran (100, 500,
 * 1000). Karena ke atas, margin aktualnya sedikit lebih tinggi dari target —
 * yang ditampilkan ke pengguna harus margin aktual, bukan angka target.
 */
export function hitungHargaJualTargetMargin(
  hpp: number,
  persenKomisi: number,
  targetMarginPersen: number,
  pembulatan = 0
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

  const hargaJual = bulatkanHargaJual(
    Math.round(hpp / (1 - totalPersen / 100)),
    pembulatan
  )
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
  /** Harga yang akan disimpan; sudah dibulatkan sesuai `pembulatanHarga`. */
  hargaJual: number
  pembulatanHarga: number
  /** Sebelum dibulatkan; sama dengan `hargaJual` kalau tanpa pembulatan. */
  hargaJualSebelumPembulatan: number
  /**
   * Margin di harga jual yang benar-benar dipakai. Setelah pembulatan ke atas,
   * angkanya sedikit di atas target, jadi inilah yang layak ditampilkan.
   */
  marginAktualPersen: number
}

type DatabaseClient = Pick<
  Prisma.TransactionClient,
  | '$executeRaw'
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

/**
 * Pengaturan dan komponen biaya operasional milik satu user. Diekspor untuk
 * simulasi kenaikan bahan, supaya default pengaturan dan pemilahan biaya
 * tetap berasal dari satu tempat.
 */
export async function getKonteksBiaya(userId: number, db: DatabaseClient = prisma) {
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
  db: DatabaseClient = prisma,
  pembulatanHarga = 0
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

  const hargaJualSebelumPembulatan = hitungHargaJualTargetMargin(
    hppTerhitung,
    konteks.komponen.persenKomisi,
    targetMarginPersen
  )
  const hargaJual = hitungHargaJualTargetMargin(
    hppTerhitung,
    konteks.komponen.persenKomisi,
    targetMarginPersen,
    pembulatanHarga
  )

  return {
    hppTerhitung,
    persenKomisi: konteks.komponen.persenKomisi,
    hargaJual,
    pembulatanHarga,
    hargaJualSebelumPembulatan,
    // Margin dihitung ulang dari harga yang benar-benar dipakai, lewat rumus
    // margin yang sama dengan seluruh aplikasi.
    marginAktualPersen: hitungHpp(
      biayaBahan,
      hargaJual,
      konteks.komponen,
      konteks.pengaturan.batasMarginAman
    ).marginPersen,
  }
}

export async function calculateHpp(
  produkId: number,
  userId: number,
  options: CalculateHppOptions = {}
): Promise<HppResult> {
  const { thresholdOverride, simpanSnapshot = false } = options

  const [produk, konteks] = await Promise.all([
    prisma.produk.findFirst({
      where: { id: produkId, userId },
      include: {
        resep: {
          where: { bahanBaku: { userId } },
          include: { bahanBaku: true },
        },
      },
    }),
    getKonteksBiaya(userId),
  ])
  if (!produk) throw new Error('Produk tidak ditemukan')

  const threshold = thresholdOverride ?? konteks.pengaturan.batasMarginAman

  // Rumusnya sendiri ada di lib/hpp.ts supaya halaman bisa memakai perhitungan
  // yang sama tanpa memanggil fungsi ini sekali per produk:
  // biaya tetap dibagi estimasi porsi per bulan, komisi persentase dipotong
  // dari HARGA JUAL (bukan dari HPP).
  const biayaBahan = biayaBahanProduk(produk)
  const { hppTerhitung, marginPersen } = hitungHpp(
    biayaBahan,
    produk.hargaJual,
    konteks.komponen,
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
    titikImpasPorsi: hitungTitikImpas(biayaBahan, produk.hargaJual, konteks.komponen),
  }
}

export type HasilRecalculate = {
  jumlahProdukDihitung: number
  jumlahHargaBerubah: number
}

/** Bentuk produk yang dibutuhkan rekalkulasi; baris Prisma memenuhinya apa adanya. */
export type ProdukRekalkulasi = MasukanProduk & {
  id: number
  modePenentuanHarga: string
  targetMarginPersen: number | null
  pembulatanHarga: number
}

export type HasilRekalkulasiProduk = {
  produkId: number
  hargaJualLama: number
  hargaJualBaru: number
  hppTerhitung: number
  marginPersen: number
}

/**
 * Bagian murni rekalkulasi: harga jual baru dan snapshot HPP tiap produk,
 * tanpa menyentuh database. Produk mode target margin mengikuti HPP terbaru;
 * produk manual mempertahankan harganya dan hanya marginnya yang bergeser.
 *
 * Seluruh produk dihitung sebelum apa pun ditulis, supaya satu target margin
 * yang tidak sah (melempar PerhitunganHargaTargetError) membatalkan pemicu
 * secara utuh.
 */
export function rencanakanRekalkulasi(
  semuaProduk: readonly ProdukRekalkulasi[],
  komponen: KomponenBiaya,
  batasMarginAman: number
): HasilRekalkulasiProduk[] {
  return semuaProduk.map((produk) => {
    const biayaBahan = biayaBahanProduk(produk)
    const hppTerhitung = biayaBahan + komponen.biayaTetapPerPorsi
    const hargaJualBaru =
      produk.modePenentuanHarga === 'targetMargin'
        ? hitungHargaJualTargetMargin(
            hppTerhitung,
            komponen.persenKomisi,
            produk.targetMarginPersen ?? Number.NaN,
            produk.pembulatanHarga
          )
        : produk.hargaJual
    const rincian = hitungHpp(biayaBahan, hargaJualBaru, komponen, batasMarginAman)

    return {
      produkId: produk.id,
      hargaJualLama: produk.hargaJual,
      hargaJualBaru,
      hppTerhitung: rincian.hppTerhitung,
      marginPersen: rincian.marginPersen,
    }
  })
}

/**
 * Baca, hitung, lalu tulis turunan HPP untuk produk milik user yang cocok
 * dengan `filterProduk` (semua produk kalau tidak diisi).
 *
 * Dijalankan di dalam transaksi pemicunya, jadi jumlah round trip di sini
 * langsung menentukan berapa lama transaksi itu menahan koneksi: 5 baca
 * (produk, resep, bahan, pengaturan, biaya) dan paling banyak 5 tulis.
 */
async function recalculateProduk(
  userId: number,
  alasan: string,
  db: DatabaseClient,
  filterProduk: Prisma.ProdukWhereInput = {}
): Promise<HasilRecalculate> {
  const [semuaProduk, konteks] = await Promise.all([
    db.produk.findMany({
      where: { ...filterProduk, userId },
      include: {
        resep: {
          where: { bahanBaku: { userId } },
          include: { bahanBaku: true },
        },
      },
    }),
    getKonteksBiaya(userId, db),
  ])

  const hasil = rencanakanRekalkulasi(
    semuaProduk,
    konteks.komponen,
    konteks.pengaturan.batasMarginAman
  )
  const hargaBerubah = hasil.filter((item) => item.hargaJualBaru !== item.hargaJualLama)

  if (hargaBerubah.length > 0) {
    // Setiap produk mempunyai harga baru yang berbeda, jadi updateMany() tidak
    // cukup. UPDATE ... FROM VALUES mempertahankan satu nilai per produk tetapi
    // mengirim seluruh perubahan dalam satu round-trip yang tetap terparameter.
    const pasanganHarga = hargaBerubah.map((item) =>
      Prisma.sql`(${item.produkId}::integer, ${item.hargaJualBaru}::double precision)`
    )
    const jumlahDiperbarui = await db.$executeRaw(
      Prisma.sql`
        UPDATE "Produk" AS produk
        SET "hargaJual" = perubahan."hargaJual"
        FROM (VALUES ${Prisma.join(pasanganHarga)}) AS perubahan("id", "hargaJual")
        WHERE produk."id" = perubahan."id"
          AND produk."userId" = ${userId}
      `
    )
    if (jumlahDiperbarui !== hargaBerubah.length) {
      throw new Error('Sebagian harga jual produk gagal diperbarui')
    }

    await db.historiHargaJual.createMany({
      data: hargaBerubah.map((item) => ({
        produkId: item.produkId,
        hargaLama: item.hargaJualLama,
        hargaBaru: item.hargaJualBaru,
        alasan,
      })),
    })
  }

  if (hasil.length > 0) {
    await db.hppSnapshot.createMany({
      data: hasil.map((item) => ({
        produkId: item.produkId,
        hppTerhitung: item.hppTerhitung,
        marginPersen: item.marginPersen,
      })),
    })
  }

  if (hargaBerubah.length > 0) {
    await db.notifikasi.createMany({
      data: [
        {
          userId,
          judul: 'Harga jual diperbarui otomatis',
          pesan: `${hargaBerubah.length} produk mengalami perubahan harga jual karena ${alasan}.`,
        },
      ],
    })

    // Tabelnya hanya tumbuh di sini, jadi di sini pula yang lama dibuang.
    await pangkasNotifikasiTerbaca(db, userId)
  }

  return {
    jumlahProdukDihitung: hasil.length,
    jumlahHargaBerubah: hargaBerubah.length,
  }
}

/**
 * Hitung ulang HPP dan harga target setiap produk milik user yang memakai
 * bahan ini, lalu simpan snapshot barunya.
 *
 * `db` sebaiknya client transaksi supaya harga jual, snapshot, dan
 * HistoriHargaJual tertulis utuh atau tidak sama sekali. Transaksi ini
 * sengaja terpisah dari penulisan harga bahan dan berjalan setelah harga itu
 * commit (lihat `ubahBahanLaluRekalkulasi`), jadi harga bahan yang baru sudah
 * terbaca di sini.
 */
export async function recalculateAllAffectedByBahan(
  bahanBakuId: number,
  userId: number,
  db: DatabaseClient
): Promise<HasilRecalculate> {
  // Syarat resep digabung ke query produk, bukan dicari dulu lewat
  // resep.findMany: satu round trip lebih sedikit di dalam transaksi.
  return recalculateProduk(userId, 'perubahan harga bahan', db, {
    resep: { some: { bahanBakuId, bahanBaku: { userId } } },
  })
}

/**
 * Dipanggil setelah POST/PUT/DELETE biaya operasional dan perubahan
 * pengaturan, idealnya dengan client transaksi yang sama agar perubahan dan
 * seluruh turunannya atomik. Karena atomik, P2028 membatalkan perubahannya
 * juga, jadi pemanggil mengulang transaksinya utuh lewat `cobaUlangSaatTimeout`.
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
  const [semuaProduk, konteks] = await Promise.all([
    prisma.produk.findMany({
      where: { userId },
      include: {
        resep: {
          where: { bahanBaku: { userId } },
          include: { bahanBaku: true },
        },
      },
    }),
    getKonteksBiaya(userId),
  ])
  const threshold = thresholdOverride ?? konteks.pengaturan.batasMarginAman

  return semuaProduk.map((produk) => {
    const biayaBahan = biayaBahanProduk(produk)
    const rincian = hitungHpp(biayaBahan, produk.hargaJual, konteks.komponen, threshold)

    return {
      produkId: produk.id,
      hppTerhitung: rincian.hppTerhitung,
      marginPersen: rincian.marginPersen,
      statusAman: rincian.marginPersen >= threshold,
      titikImpasPorsi: hitungTitikImpas(biayaBahan, produk.hargaJual, konteks.komponen),
    }
  })
}

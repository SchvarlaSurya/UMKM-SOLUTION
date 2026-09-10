import { prisma } from '@/lib/prisma'
import { biayaBahanProduk, hitungHpp, komponenBiaya } from '@/lib/hpp'

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
   * tetap read-only. Hanya `recalculateAllAffectedByBahan()` yang menyalakan
   * ini, karena di situ memang ada perubahan nyata (harga bahan berubah).
   */
  simpanSnapshot?: boolean
}

/** Default harus sama dengan `@default` di prisma/schema.prisma model Pengaturan. */
const PENGATURAN_DEFAULT = { estimasiPorsiPerBulan: 1200, batasMarginAman: 10 }

/**
 * Baca saja, jangan pernah membuat baris. Kalau tabel Pengaturan masih kosong,
 * pakai nilai default supaya perhitungan tetap jalan tanpa menulis ke DB
 * (GET /api/pengaturan yang bertugas membuat baris pertama).
 */
async function getPengaturan() {
  const pengaturan = await prisma.pengaturan.findFirst()
  return pengaturan ?? PENGATURAN_DEFAULT
}

export async function calculateHpp(
  produkId: number,
  options: CalculateHppOptions = {}
): Promise<HppResult> {
  const { thresholdOverride, simpanSnapshot = false } = options

  const produk = await prisma.produk.findUnique({
    where: { id: produkId },
    include: { resep: { include: { bahanBaku: true } } },
  })
  if (!produk) throw new Error('Produk tidak ditemukan')

  const pengaturan = await getPengaturan()
  const threshold = thresholdOverride ?? pengaturan.batasMarginAman

  const semuaBiaya = await prisma.biayaOperasional.findMany()

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

/**
 * Dipanggil setelah harga bahan baku berubah. Ini satu-satunya jalur yang
 * menulis `HppSnapshot`, karena di sini ada perubahan nyata yang layak dicatat.
 */
export async function recalculateAllAffectedByBahan(bahanBakuId: number): Promise<void> {
  const resepTerkait = await prisma.resep.findMany({ where: { bahanBakuId } })
  const produkIdUnik = [...new Set(resepTerkait.map((r) => r.produkId))]
  for (const produkId of produkIdUnik) {
    await calculateHpp(produkId, { simpanSnapshot: true })
  }
}

/** Read-only: tidak menulis snapshot. Dipakai dashboard. */
export async function calculateAllHpp(thresholdOverride?: number): Promise<HppResult[]> {
  const semuaProduk = await prisma.produk.findMany({ select: { id: true } })
  const hasil: HppResult[] = []
  for (const p of semuaProduk) {
    hasil.push(await calculateHpp(p.id, { thresholdOverride }))
  }
  return hasil
}

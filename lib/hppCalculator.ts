import { prisma } from '@/lib/prisma'

export type HppResult = {
  produkId: number
  hppTerhitung: number
  marginPersen: number
  statusAman: boolean
}

async function getPengaturan() {
  let pengaturan = await prisma.pengaturan.findFirst()
  if (!pengaturan) {
    pengaturan = await prisma.pengaturan.create({ data: {} })
  }
  return pengaturan
}

export async function calculateHpp(produkId: number, thresholdOverride?: number): Promise<HppResult> {
  const produk = await prisma.produk.findUnique({
    where: { id: produkId },
    include: { resep: { include: { bahanBaku: true } } },
  })
  if (!produk) throw new Error('Produk tidak ditemukan')

  const pengaturan = await getPengaturan()
  const threshold = thresholdOverride ?? pengaturan.batasMarginAman

  // 1. Total biaya bahan baku sesuai resep
  const biayaBahan = produk.resep.reduce(
    (total, r) => total + r.jumlahDipakai * r.bahanBaku.hargaPerSatuan,
    0
  )

  const semuaBiaya = await prisma.biayaOperasional.findMany()

  // 2. Biaya tetap dialokasikan berdasarkan estimasi porsi terjual per bulan
  //    (bukan dibagi jumlah produk aktif ? ini metode yang lebih realistis)
  const totalBiayaTetapPerBulan = semuaBiaya
    .filter((b) => b.jenis === 'tetap')
    .reduce((total, b) => total + b.nilai, 0)
  const biayaTetap = totalBiayaTetapPerBulan / pengaturan.estimasiPorsiPerBulan

  // 3. Komisi/persentase dihitung dari HARGA JUAL, bukan dari HPP
  const persenKomisi = semuaBiaya
    .filter((b) => b.jenis === 'persentase')
    .reduce((total, b) => total + b.nilai, 0)

  const hppTerhitung = biayaBahan + biayaTetap
  const potonganKomisi = produk.hargaJual * (persenKomisi / 100)
  const marginPersen = ((produk.hargaJual - hppTerhitung - potonganKomisi) / produk.hargaJual) * 100

  await prisma.hppSnapshot.create({
    data: { produkId, hppTerhitung, marginPersen },
  })

  return {
    produkId,
    hppTerhitung,
    marginPersen,
    statusAman: marginPersen >= threshold,
  }
}

export async function recalculateAllAffectedByBahan(bahanBakuId: number): Promise<void> {
  const resepTerkait = await prisma.resep.findMany({ where: { bahanBakuId } })
  const produkIdUnik = [...new Set(resepTerkait.map((r) => r.produkId))]
  for (const produkId of produkIdUnik) {
    await calculateHpp(produkId)
  }
}

export async function calculateAllHpp(thresholdOverride?: number): Promise<HppResult[]> {
  const semuaProduk = await prisma.produk.findMany({ select: { id: true } })
  const hasil: HppResult[] = []
  for (const p of semuaProduk) {
    hasil.push(await calculateHpp(p.id, thresholdOverride))
  }
  return hasil
}

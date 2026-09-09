import { prisma } from '@/lib/prisma'

export type HppResult = {
  produkId: number
  hppTerhitung: number
  marginPersen: number
  statusAman: boolean
}

const THRESHOLD_DEFAULT = 10

export async function calculateHpp(produkId: number, threshold = THRESHOLD_DEFAULT): Promise<HppResult> {
  const produk = await prisma.produk.findUnique({
    where: { id: produkId },
    include: { resep: { include: { bahanBaku: true } } },
  })
  if (!produk) throw new Error('Produk tidak ditemukan')

  const biayaBahan = produk.resep.reduce(
    (total, r) => total + r.jumlahDipakai * r.bahanBaku.hargaPerSatuan,
    0
  )

  const semuaBiaya = await prisma.biayaOperasional.findMany()
  const totalProdukAktif = await prisma.produk.count()
  const biayaTetap = semuaBiaya
    .filter((b) => b.jenis === 'tetap')
    .reduce((total, b) => total + b.nilai / totalProdukAktif, 0)

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

// Untuk dashboard: hitung HPP semua produk sekaligus dalam satu panggilan
export async function calculateAllHpp(threshold = THRESHOLD_DEFAULT): Promise<HppResult[]> {
  const semuaProduk = await prisma.produk.findMany({ select: { id: true } })
  const hasil: HppResult[] = []
  for (const p of semuaProduk) {
    hasil.push(await calculateHpp(p.id, threshold))
  }
  return hasil
}

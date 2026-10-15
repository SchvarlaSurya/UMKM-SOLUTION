import { isAngkaPositif } from '@/lib/apiHelpers'
import { BATAS_MASUKAN, periksaMaksimum } from '@/lib/batasMasukan'

export type ResepInput = { bahanBakuId: number; jumlahDipakai: number }

/**
 * Validasi array resep yang dikirim POST/PUT produk. Dipakai kedua route
 * supaya aturannya tidak pernah berbeda antara tambah dan edit.
 */
export function validasiResep(
  resep: unknown
): { ok: true; data: ResepInput[] } | { ok: false; error: string } {
  if (!Array.isArray(resep) || resep.length === 0) {
    return { ok: false, error: 'Produk harus punya minimal 1 bahan baku di resep' }
  }
  if (resep.length > BATAS_MASUKAN.barisResep) {
    return { ok: false, error: `Resep paling banyak ${BATAS_MASUKAN.barisResep} bahan` }
  }

  const hasil: ResepInput[] = []
  const idTerpakai = new Set<number>()

  for (const baris of resep) {
    if (baris === null || typeof baris !== 'object') {
      return { ok: false, error: 'Setiap baris resep harus berupa objek' }
    }
    const { bahanBakuId, jumlahDipakai } = baris as Record<string, unknown>

    if (!Number.isSafeInteger(bahanBakuId) || (bahanBakuId as number) <= 0) {
      return { ok: false, error: 'Setiap resep wajib punya bahanBakuId yang valid' }
    }
    if (!isAngkaPositif(jumlahDipakai)) {
      return { ok: false, error: 'jumlahDipakai harus angka lebih dari 0' }
    }
    const takaranBerlebih = periksaMaksimum(jumlahDipakai, 'Takaran bahan', BATAS_MASUKAN.takaran)
    if (takaranBerlebih) return { ok: false, error: takaranBerlebih }
    if (idTerpakai.has(bahanBakuId as number)) {
      return { ok: false, error: `Bahan baku id ${bahanBakuId} ditulis dua kali di resep` }
    }

    idTerpakai.add(bahanBakuId as number)
    hasil.push({ bahanBakuId: bahanBakuId as number, jumlahDipakai })
  }

  return { ok: true, data: hasil }
}

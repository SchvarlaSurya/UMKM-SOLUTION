/**
 * Pesan untuk galat tak terduga (status 500) yang dikirim ke klien.
 *
 * `error.message` mentah tidak pernah dikirim di luar development. Pesan
 * Prisma bisa memuat potongan query, nama tabel dan constraint, sampai jalur
 * berkas di server, dan itu informasi gratis bagi siapa pun yang mencari
 * celah. Detailnya tetap utuh di log server lewat console.error di
 * handleError, jadi tidak ada yang hilang untuk keperluan debugging.
 *
 * Tanpa impor apa pun supaya bisa dites tanpa Next dan Prisma.
 */
export function pesanGalatTakTerduga(
  konteks: string,
  error: unknown,
  tampilkanDetail: boolean
): string {
  const umum = `${konteks}: terjadi kesalahan di server. Coba lagi sebentar lagi.`
  if (!tampilkanDetail) return umum

  const detail = error instanceof Error ? error.message : String(error)
  return `${umum} (detail development: ${detail})`
}

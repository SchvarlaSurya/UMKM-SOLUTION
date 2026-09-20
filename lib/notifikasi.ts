import type { Prisma } from '@/app/generated/prisma/client'

/**
 * Umur notifikasi yang sudah dibaca sebelum dibuang sendiri.
 *
 * Tiga puluh hari. Notifikasi di aplikasi ini hanya pemberitahuan — catatan
 * sebenarnya tetap tersimpan di HistoriHargaJual dan HistoriHarga, dan itu
 * tidak ikut dipangkas. Jadi yang hilang cuma salinan kabarnya, bukan jejak
 * perubahannya.
 */
export const HARI_SIMPAN_NOTIFIKASI = 30

const MS_PER_HARI = 86_400_000

type KlienNotifikasi = Pick<Prisma.TransactionClient, 'notifikasi'>

/**
 * Buang notifikasi terbaca milik satu pemilik yang sudah lewat masa simpan.
 *
 * Dipanggil tepat setelah notifikasi baru dibuat, bukan dari jadwal terpisah
 * maupun dari endpoint baca. Alasannya dua: tabelnya hanya tumbuh di saat itu,
 * dan proyek ini tidak punya penjadwal. Menaruhnya di jalur baca juga bukan
 * pilihan — GET notifikasi ditarik ulang tiap menit oleh NotifikasiProvider,
 * dan endpoint baca yang diam-diam menulis adalah jalur tercepat membuat
 * sesuatu yang aman dipoll jadi tidak aman lagi.
 *
 * Yang belum dibaca tidak pernah ikut, berapa pun umurnya: pemiliknya belum
 * sempat melihatnya.
 *
 * Berjalan di transaksi yang sama dengan pembuatan notifikasinya. Itu berarti
 * kegagalan pemangkasan ikut membatalkan perubahan harga yang memicunya —
 * pertukaran yang disengaja: menaruhnya di luar transaksi berarti menyisipkan
 * panggilan tambahan di delapan pemanggil yang berbeda, dan satu yang terlewat
 * akan diam-diam berhenti memangkas.
 */
export async function pangkasNotifikasiTerbaca(
  db: KlienNotifikasi,
  userId: number,
): Promise<number> {
  const batas = new Date(Date.now() - HARI_SIMPAN_NOTIFIKASI * MS_PER_HARI)

  const hasil = await db.notifikasi.deleteMany({
    where: { userId, sudahDibaca: true, tanggal: { lt: batas } },
  })

  return hasil.count
}

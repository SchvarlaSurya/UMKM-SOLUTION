/**
 * Ingatan nilai terakhir yang sempat dilihat pemilik, untuk angka ringkasan.
 *
 * Mengubah harga bahan terjadi di halaman lain, jadi kembali ke dashboard
 * berarti pohon komponennya dipasang dari nol dan angkanya langsung tampil
 * dalam nilai baru — perubahannya tidak terlihat sama sekali. Menyimpan nilai
 * yang terakhir ditampilkan membuat perbedaannya bisa dianimasikan tanpa harus
 * menghitung naik dari nol tiap halaman dibuka.
 *
 * Sengaja `sessionStorage`, bukan `localStorage`: ingatan ini hanya relevan
 * selama satu sesi menjelajah, dan ikut hilang ketika tabnya ditutup.
 *
 * Semuanya disimpan dalam satu kunci, bukan satu kunci per angka, supaya
 * pemasangan halaman hanya sekali membaca penyimpanan.
 */

const KUNCI = "ruangmargin:angka-terakhir";

let singgahan: Record<string, number> | null = null;

function bacaSemua(): Record<string, number> {
  if (singgahan) return singgahan;
  if (typeof window === "undefined") return {};

  try {
    const mentah = window.sessionStorage.getItem(KUNCI);
    const isi: unknown = mentah ? JSON.parse(mentah) : null;
    singgahan = isi && typeof isi === "object" ? (isi as Record<string, number>) : {};
  } catch {
    // Mode privat atau penyimpanan dimatikan. Tanpa ingatan, angkanya sekadar
    // tampil apa adanya — tidak ada yang rusak.
    singgahan = {};
  }

  return singgahan;
}

/** Nilai yang terakhir ditampilkan untuk `nama`, atau null kalau belum ada. */
export function nilaiTerakhir(nama: string): number | null {
  const nilai = bacaSemua()[nama];
  return typeof nilai === "number" && Number.isFinite(nilai) ? nilai : null;
}

export function simpanNilai(nama: string, nilai: number): void {
  const semua = bacaSemua();
  if (semua[nama] === nilai) return;

  semua[nama] = nilai;
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(KUNCI, JSON.stringify(semua));
  } catch {
    // Kuota penuh atau penyimpanan dimatikan; singgahan di memori tetap jalan
    // sampai halaman ditutup.
  }
}

/**
 * Dipanggil saat keluar akun. Tanpa ini, masuk dengan akun lain di tab yang
 * sama membuat angka pertama yang tampil dianimasikan dari angka milik
 * pemilik sebelumnya.
 */
export function lupakanAngka(): void {
  singgahan = {};
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(KUNCI);
  } catch {
    // Tidak ada yang perlu dilakukan; singgahan di memori sudah dikosongkan.
  }
}

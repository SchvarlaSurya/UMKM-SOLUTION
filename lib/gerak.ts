/**
 * Setelan gerak bersama untuk animasi antarmuka.
 *
 * Dipisah dari komponennya supaya satu aturan `prefers-reduced-motion` berlaku
 * di semua animasi, bukan diperiksa ulang sendiri-sendiri di tiap berkas.
 */

/** Sistem pengguna meminta gerak dikurangi. */
export function gerakDimatikan(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Durasi atau jeda animasi dalam milidetik, jadi 0 kalau gerak dimatikan.
 *
 * Nilainya dinolkan, bukan animasinya dilewati: hasil akhir animasi tetap
 * ditulis ke elemen, jadi elemen yang mulai dari `opacity: 0` tidak tertinggal
 * tak terlihat.
 */
export function durasiGerak(penuh: number): number {
  return gerakDimatikan() ? 0 : penuh;
}

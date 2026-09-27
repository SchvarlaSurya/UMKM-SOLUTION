/**
 * Kode dan pesan galat login yang dipakai bersama server dan klien. Sengaja
 * tanpa impor apa pun supaya aman dimuat komponen klien.
 */

/**
 * Awalan pesan galat saat login dibatasi. NextAuth meneruskan pesan yang
 * dilempar `authorize` apa adanya ke `signIn(...).error` di klien, diikuti
 * jumlah detik sampai boleh mencoba lagi: "LoginDibatasi:840".
 */
export const KODE_LOGIN_DIBATASI = 'LoginDibatasi'

/** Pesan untuk pengguna dari nilai `error` hasil `signIn("credentials")`. */
export function pesanGalatLogin(error: string | null | undefined): string {
  if (error === 'CredentialsSignin') {
    // Sengaja tidak menyebut mana yang salah: menyebutkannya membocorkan email
    // mana yang terdaftar kepada siapa pun yang mencoba menebak.
    return 'Email atau kata sandi salah.'
  }
  if (error?.startsWith(`${KODE_LOGIN_DIBATASI}:`)) {
    const detik = Number(error.slice(KODE_LOGIN_DIBATASI.length + 1))
    const menit = Number.isFinite(detik) && detik > 0 ? Math.ceil(detik / 60) : 15
    return `Terlalu banyak percobaan masuk. Coba lagi dalam ${menit} menit.`
  }
  return 'Gagal masuk. Coba lagi sebentar lagi.'
}

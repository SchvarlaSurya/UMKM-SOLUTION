import { kunciPercobaan, type Pembatas } from '@/lib/batasPercobaan'
import { normalisasiEmail } from '@/lib/email'
import { KODE_LOGIN_DIBATASI } from '@/lib/pesanLogin'

export class LoginDibatasiError extends Error {
  constructor(public readonly cobaLagiDetik: number) {
    super(`${KODE_LOGIN_DIBATASI}:${cobaLagiDetik}`)
    this.name = 'LoginDibatasiError'
  }
}

/**
 * Hash bcrypt dari string acak yang tidak disimpan di mana pun, cost 10 sama
 * dengan pendaftaran. Dibandingkan saat email tidak terdaftar supaya bcrypt
 * tetap berjalan dan waktu respons sama dengan kata sandi salah — tanpa ini,
 * email tak terdaftar dijawab puluhan milidetik lebih cepat dan bisa dipakai
 * menebak email mana yang terdaftar.
 */
const HASH_DUMMY = '$2b$10$wa.kb/q4Po6NnpwpfKCL5.dQJXSOySt8vchBH7UqT3XeWIVecmMkS'

type UserLogin = { id: number; email: string; nama: string; password: string }

export type DependensiLogin = {
  cariUser: (emailBaku: string) => Promise<UserLogin | null>
  bandingkan: (password: string, hash: string) => Promise<boolean>
  pembatas: Pembatas
}

/**
 * Periksa email dan kata sandi.
 *
 * Mengembalikan user bila cocok, null bila tidak, atau melempar
 * LoginDibatasiError bila IP + email ini sudah terlalu banyak gagal.
 * Hanya kegagalan yang dihitung; login berhasil menghapus hitungannya.
 */
export async function verifikasiLogin(
  { email, password, ip }: { email: string; password: string; ip: string },
  { cariUser, bandingkan, pembatas }: DependensiLogin
): Promise<UserLogin | null> {
  const baku = normalisasiEmail(email)
  const kunci = kunciPercobaan(ip, baku)

  // Diperiksa sebelum query dan bcrypt, supaya penebak yang sudah dibatasi
  // tidak lagi membebani database maupun CPU.
  const cek = pembatas.periksa(kunci)
  if (!cek.diizinkan) throw new LoginDibatasiError(cek.cobaLagiDetik)

  const user = await cariUser(baku)
  const cocok = await bandingkan(password, user?.password ?? HASH_DUMMY)

  if (!user || !cocok) {
    pembatas.catat(kunci)
    return null
  }

  pembatas.hapus(kunci)
  return user
}

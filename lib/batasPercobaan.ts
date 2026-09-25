/**
 * Pembatas percobaan login dan daftar, disimpan di memori proses (in-process).
 *
 * PERINGATAN — hanya benar untuk SATU proses Node. Target deployment saat ini
 * VPS dengan satu proses, sama seperti asumsi pool koneksi di lib/prisma.ts.
 * Hitungan hilang saat server dimulai ulang, dan tidak dibagi antarproses.
 * Kalau nanti pindah ke banyak instance, cluster/PM2 multi-proses, atau
 * serverless, ganti penyimpanan di sini ke Redis atau tabel Postgres; kalau
 * tidak, setiap instance punya jatah sendiri dan batasnya ikut berlipat.
 *
 * Jendela tetap: hitungan dimulai pada percobaan pertama dan kembali ke nol
 * setelah jendela habis. Kunci dipilih pemanggil (saat ini IP + email).
 */

export type HasilPeriksa =
  | { diizinkan: true }
  | { diizinkan: false; cobaLagiDetik: number };

type Catatan = { jumlah: number; mulai: number };

export type OpsiPembatas = {
  /** Percobaan yang masih diizinkan dalam satu jendela. */
  maks: number;
  jendelaMs: number;
  /**
   * Batas jumlah kunci yang diingat, supaya memori tidak tumbuh tanpa ujung
   * saat diserbu banyak kombinasi IP/email. Kunci tertua dibuang lebih dulu.
   */
  kapasitas?: number;
  /** Sumber waktu; diganti di pengujian. */
  sekarang?: () => number;
};

export function buatPembatas({
  maks,
  jendelaMs,
  kapasitas = 10_000,
  sekarang = Date.now,
}: OpsiPembatas) {
  // Map menyimpan urutan sisip, jadi kunci pertama selalu yang paling lama
  // tidak disentuh (setiap catat() memindahkan kuncinya ke belakang).
  const catatan = new Map<string, Catatan>();

  function masihBerlaku(isi: Catatan, waktu: number) {
    return waktu - isi.mulai < jendelaMs;
  }

  function rapikan(waktu: number) {
    if (catatan.size < kapasitas) return;
    for (const [kunci, isi] of catatan) {
      if (!masihBerlaku(isi, waktu)) catatan.delete(kunci);
    }
    while (catatan.size >= kapasitas) {
      const tertua = catatan.keys().next().value;
      if (tertua === undefined) break;
      catatan.delete(tertua);
    }
  }

  return {
    /** Periksa tanpa menghitung. Dipanggil sebelum pekerjaan mahal (bcrypt). */
    periksa(kunci: string): HasilPeriksa {
      const waktu = sekarang();
      const isi = catatan.get(kunci);
      if (!isi || !masihBerlaku(isi, waktu)) return { diizinkan: true };
      if (isi.jumlah < maks) return { diizinkan: true };
      return {
        diizinkan: false,
        cobaLagiDetik: Math.max(1, Math.ceil((isi.mulai + jendelaMs - waktu) / 1000)),
      };
    },

    /** Hitung satu percobaan. */
    catat(kunci: string) {
      const waktu = sekarang();
      const isi = catatan.get(kunci);
      catatan.delete(kunci);
      if (isi && masihBerlaku(isi, waktu)) {
        catatan.set(kunci, { jumlah: isi.jumlah + 1, mulai: isi.mulai });
      } else {
        rapikan(waktu);
        catatan.set(kunci, { jumlah: 1, mulai: waktu });
      }
    },

    /** Lupakan kunci, misalnya setelah login berhasil. */
    hapus(kunci: string) {
      catatan.delete(kunci);
    },

    /** Jumlah kunci yang sedang diingat; untuk pengujian. */
    get ukuran() {
      return catatan.size;
    },
  };
}

export type Pembatas = ReturnType<typeof buatPembatas>;

const LIMA_BELAS_MENIT = 15 * 60 * 1000;

/** Login: 5 kali GAGAL per 15 menit per IP + email. Berhasil masuk menghapusnya. */
export const pembatasLogin = buatPembatas({ maks: 5, jendelaMs: LIMA_BELAS_MENIT });

/** Daftar: 5 percobaan per 15 menit per IP + email, berhasil atau tidak. */
export const pembatasDaftar = buatPembatas({ maks: 5, jendelaMs: LIMA_BELAS_MENIT });

/** Kunci pembatas: IP dan email bentuk baku, dipisah karakter yang tak ada di email. */
export function kunciPercobaan(ip: string, emailBaku: string): string {
  return `${ip}\u0000${emailBaku}`;
}

/**
 * IP klien dari header yang dipasang reverse proxy.
 *
 * Mengandalkan satu reverse proxy (nginx) di depan Node yang MENIMPA
 * `X-Real-IP` dengan `$remote_addr`. Tanpa proxy, header ini bisa diisi
 * sesuka pengirim, dan pembatas bisa dilewati dengan mengganti nilainya.
 *
 * Cadangannya entri TERAKHIR `X-Forwarded-For`, yaitu yang ditambahkan proxy
 * kita sendiri; entri pertama berasal dari klien dan bisa dipalsukan.
 */
export function ipDariHeader(ambil: (nama: string) => string | null | undefined): string {
  const realIp = ambil("x-real-ip")?.trim();
  if (realIp) return realIp;
  const diteruskan = ambil("x-forwarded-for")
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return diteruskan?.at(-1) ?? "tanpa-ip";
}

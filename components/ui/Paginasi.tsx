"use client";

import { Button } from "./Button";
import { IconChevronKanan, IconChevronKiri } from "./icons";

/**
 * Pindah halaman untuk daftar yang dipotong.
 *
 * Sengaja hanya maju–mundur, tanpa deretan nomor halaman. Daftar di aplikasi
 * ini disaring lewat tab dan kotak pencarian di atasnya, jadi cara menemukan
 * satu produk tertentu adalah menyaringnya — bukan menebak ia ada di halaman
 * berapa. Deretan nomor cuma menambah sasaran sentuh kecil di layar ponsel
 * tanpa menambah kemampuan.
 *
 * Tidak menggambar apa pun kalau isinya cuma muat satu halaman.
 */
export function Paginasi({
  halaman,
  totalHalaman,
  onPindah,
  label,
}: {
  halaman: number;
  totalHalaman: number;
  onPindah: (halaman: number) => void;
  /** Menerangkan daftar apa yang dipindah, untuk pembaca layar. */
  label: string;
}) {
  if (totalHalaman <= 1) return null;

  return (
    <nav aria-label={label} className="inline-flex items-center gap-1">
      <Button
        varian="ghost"
        ukuran="sm"
        className="px-2"
        aria-label="Halaman sebelumnya"
        disabled={halaman <= 1}
        onClick={() => onPindah(halaman - 1)}
      >
        <IconChevronKiri width={16} height={16} />
      </Button>

      {/*
        `aria-live` supaya pembaca layar mengumumkan halaman barunya. Tanpa itu
        menekan panah tidak menghasilkan kabar apa pun: fokus tetap di tombol
        yang sama dan isi tabelnya berganti di luar jangkauan pengumuman.
      */}
      <span aria-live="polite" className="px-1 whitespace-nowrap tabular-nums">
        Halaman {halaman} dari {totalHalaman}
      </span>

      <Button
        varian="ghost"
        ukuran="sm"
        className="px-2"
        aria-label="Halaman berikutnya"
        disabled={halaman >= totalHalaman}
        onClick={() => onPindah(halaman + 1)}
      >
        <IconChevronKanan width={16} height={16} />
      </Button>
    </nav>
  );
}

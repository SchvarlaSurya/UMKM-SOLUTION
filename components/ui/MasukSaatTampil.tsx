"use client";

import { useRef, type ReactNode } from "react";
import { animate, onScroll, utils } from "animejs";
import { durasiGerak } from "@/lib/gerak";
import { useEfekTataLetak } from "./useEfekTataLetak";

const DURASI = 460;
const JARAK = 8;

/** Batas pemicu: bagian atas elemen melewati 12% tinggi layar dari bawah. */
const AMBANG_MASUK = "bottom-=12% top";

/**
 * Memunculkan isinya sekali saat pertama masuk area pandang: memudar masuk
 * sambil naik 8px. Dipakai di landing page, untuk blok judul tiap bagian.
 *
 * Bedanya dengan MasukHalus: pemicunya posisi gulir, bukan saat dipasang.
 * Jadi blok yang masih di bawah layar tidak menganimasi diri sendiri ketika
 * pengunjung belum sampai ke sana.
 *
 * Keadaan awal ditulis di efek tata letak yang berjalan sebelum paint, bukan
 * di JSX. Ini penting di landing page: `opacity: 0` di JSX membuat isinya tidak
 * pernah terlihat kalau JavaScript gagal dimuat, sedangkan cara ini menyisakan
 * HTML hasil render server apa adanya. Halaman ini yang pertama dilihat
 * pengunjung, jadi isinya harus tetap terbaca tanpa JavaScript.
 *
 * `repeat: false` supaya animasinya tidak berulang tiap kali blok yang sama
 * dilewati lagi. Menggulir naik-turun di halaman yang sama bukan kejadian yang
 * perlu ditandai ulang.
 *
 * Komponennya klien, tapi `children` tetap dirender di server dan dikirim
 * sebagai payload — pemakainya tidak perlu ikut jadi komponen klien.
 */
export function MasukSaatTampil({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEfekTataLetak(() => {
    const elemen = ref.current;
    if (!elemen) return;

    const ms = durasiGerak(DURASI);
    if (ms === 0) return;

    utils.set(elemen, { opacity: 0, translateY: JARAK });

    const pengamat = onScroll({
      target: elemen,
      enter: AMBANG_MASUK,
      repeat: false,
    });

    animate(elemen, {
      opacity: 1,
      translateY: 0,
      duration: ms,
      ease: "outQuad",
      autoplay: pengamat,
    });

    return () => {
      // Pengamatnya dilepas sendiri; membuang animasinya saja akan
      // meninggalkan pendengar gulir yang menunjuk elemen yang sudah hilang.
      pengamat.revert();
      utils.remove(elemen);
      // Menghentikan animasi meninggalkan gaya sebaris pada nilai terakhirnya,
      // dan pengamatnya sudah dilepas jadi tidak ada yang melanjutkan. Tanpa
      // baris ini, elemen yang dibongkar saat masih memudar bisa tertinggal
      // setengah terlihat.
      utils.set(elemen, { opacity: 1, translateY: 0 });
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

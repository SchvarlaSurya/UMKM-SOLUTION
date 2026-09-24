"use client";

import { useRef } from "react";
import { animate, onScroll, stagger, utils } from "animejs";
import { durasiGerak } from "@/lib/gerak";
import { useEfekTataLetak } from "./useEfekTataLetak";

const DURASI = 460;
const JARAK = 8;

/** Batas pemicu: bagian atas pembungkus melewati 12% tinggi layar dari bawah. */
const AMBANG_MASUK = "bottom-=12% top";

type OpsiMasukGulir = {
  /**
   * Kalau diisi, yang dianimasikan adalah anak langsung pembungkusnya, satu
   * per satu dengan jeda sekian milidetik. Kalau tidak, pembungkusnya sendiri
   * yang dianimasikan sebagai satu kesatuan.
   */
  jedaAntarAnak?: number;
};

/**
 * Memunculkan elemen sekali saat pertama masuk area pandang: memudar masuk
 * sambil naik 8px.
 *
 * Bedanya dengan MasukHalus: pemicunya posisi gulir, bukan saat dipasang.
 * Jadi bagian yang masih di bawah layar tidak menganimasi diri sendiri ketika
 * pengunjung belum sampai ke sana.
 *
 * Keadaan awal ditulis di efek tata letak yang berjalan sebelum paint, bukan
 * di JSX. Ini penting di landing page: `opacity: 0` di JSX membuat isinya
 * tidak pernah terlihat kalau JavaScript gagal dimuat, sedangkan cara ini
 * menyisakan HTML hasil render server apa adanya. Halaman itu yang pertama
 * dilihat pengunjung, jadi isinya harus tetap terbaca tanpa JavaScript.
 *
 * `repeat: false` supaya animasinya tidak berulang tiap kali bagian yang sama
 * dilewati lagi. Menggulir naik-turun di halaman yang sama bukan kejadian yang
 * perlu ditandai ulang.
 *
 * Pemicunya selalu pembungkus, termasuk saat yang dianimasikan anak-anaknya:
 * satu ambang untuk satu kelompok, supaya urutannya mulai dari kartu pertama
 * dan tidak kacau kalau kartunya tersusun menyamping.
 */
export function useMasukGulir<T extends HTMLElement>({ jedaAntarAnak }: OpsiMasukGulir = {}) {
  const ref = useRef<T>(null);

  useEfekTataLetak(() => {
    const wadah = ref.current;
    if (!wadah) return;

    const ms = durasiGerak(DURASI);
    if (ms === 0) return;

    const target = jedaAntarAnak ? Array.from(wadah.children) : [wadah];
    if (target.length === 0) return;

    utils.set(target, { opacity: 0, translateY: JARAK });

    const pengamat = onScroll({ target: wadah, enter: AMBANG_MASUK, repeat: false });

    animate(target, {
      opacity: 1,
      translateY: 0,
      duration: ms,
      ease: "outQuad",
      delay: jedaAntarAnak ? stagger(jedaAntarAnak) : 0,
      autoplay: pengamat,
    });

    return () => {
      // Pengamatnya dilepas sendiri; membuang animasinya saja akan
      // meninggalkan pendengar gulir yang menunjuk elemen yang sudah hilang.
      pengamat.revert();
      utils.remove(target);
      // Menghentikan animasi meninggalkan gaya sebaris pada nilai terakhirnya,
      // dan pengamatnya sudah dilepas jadi tidak ada yang melanjutkan. Tanpa
      // baris ini, elemen yang dibongkar saat masih memudar bisa tertinggal
      // setengah terlihat.
      utils.set(target, { opacity: 1, translateY: 0 });
    };
  }, [jedaAntarAnak]);

  return ref;
}

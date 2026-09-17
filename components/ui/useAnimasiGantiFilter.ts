"use client";

import { useRef, type RefObject } from "react";
import { animate, utils } from "animejs";
import { durasiGerak } from "@/lib/gerak";
import { useEfekTataLetak } from "./useEfekTataLetak";

const DURASI = 180;

/**
 * Memudarkan isi daftar saat filternya berganti.
 *
 * Berganti tab menukar satu daftar dengan daftar lain; tanpa jeda, isinya
 * seperti berkedip berganti. Sengaja hanya pada pergantian filter: kolom cari
 * menyaring tiap ketikan, dan menganimasikannya di sana malah berkedip.
 *
 * Seluruh isi dianimasikan sebagai satu bagian, bukan per baris. Stagger per
 * baris ikut memanjang seiring jumlah isinya — pada 30 produk ekornya jadi
 * lebih terasa lamban daripada hidup.
 *
 * Dipakai bersama oleh tabel margin dan daftar produk supaya dua halaman
 * dengan interaksi yang sama tidak berperilaku beda; durasinya satu pintu.
 *
 * `translateY` sengaja tetap ada meski `<tbody>` mengabaikannya: elemen
 * `display: table-row-group` tidak bisa ditransformasi, jadi di tabel yang
 * bergerak hanya opasitasnya. Empat piksel tidak terlihat hilang, dan
 * mencabutnya justru membuat daftar produk kehilangan geseran kecil yang
 * memang terasa di sana.
 *
 * @param filter Nilai filter yang sedang aktif.
 * @param wadah Elemen pembungkus isi daftar. Yang masih `null` dilewati, jadi
 *   pemanggil boleh menyerahkan ref untuk tampilan tabel dan mobile sekaligus
 *   meski hanya satu yang terpasang.
 */
export function useAnimasiGantiFilter(
  filter: string,
  wadah: RefObject<HTMLElement | null>[],
) {
  // Menyimpan filter terakhir, bukan bendera "sudah pernah render". Bendera
  // seperti itu jebol saat Strict Mode menjalankan efeknya dua kali: jalan
  // pertama mematikan benderanya, jalan kedua ikut menganimasikan padahal
  // filternya belum berganti sama sekali.
  const filterSebelumnya = useRef(filter);

  useEfekTataLetak(() => {
    if (filterSebelumnya.current === filter) return;
    filterSebelumnya.current = filter;

    const isi = wadah
      .map((ref) => ref.current)
      .filter((elemen): elemen is HTMLElement => elemen !== null);
    if (isi.length === 0) return;

    const ms = durasiGerak(DURASI);
    if (ms === 0) return;

    isi.forEach((elemen) => {
      utils.set(elemen, { opacity: 0, translateY: -4 });
      animate(elemen, { opacity: 1, translateY: 0, duration: ms, ease: "outQuad" });
    });

    return () => {
      isi.forEach((elemen) => utils.remove(elemen));
    };
  }, [filter]);
}

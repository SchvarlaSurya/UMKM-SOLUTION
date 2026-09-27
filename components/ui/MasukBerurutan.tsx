"use client";

import type { ElementType, ReactNode, Ref } from "react";
import { useMasukGulir } from "./useMasukGulir";

/**
 * Jeda antar anak. Cukup untuk terbaca sebagai urutan, masih terlalu singkat
 * untuk terasa seperti menunggu: kartu terakhir dari tiga selesai sekitar
 * 0,6 detik setelah yang pertama mulai.
 */
const JEDA_ANTAR_ANAK = 60;

/**
 * Memunculkan anak langsungnya satu per satu saat kelompoknya masuk area
 * pandang. Dipakai untuk susunan kartu di landing page.
 *
 * Elemen pembungkusnya bisa diganti lewat `jenis` karena susunan kartu tidak
 * selalu `div` — daftar langkah memakai `ol` supaya urutannya ikut terbaca
 * oleh pembaca layar, dan itu tidak boleh dibungkus `div` di antara `ol` dan
 * `li`-nya.
 *
 * Komponennya klien, tapi `children` tetap dirender di server dan dikirim
 * sebagai payload — pemakainya tidak perlu ikut jadi komponen klien.
 *
 * Lihat useMasukGulir untuk alasan di balik keadaan awal dan ambang pemicunya.
 */
export function MasukBerurutan({
  children,
  className,
  jenis = "div",
}: {
  children: ReactNode;
  className?: string;
  jenis?: "div" | "ol" | "ul";
}) {
  const ref = useMasukGulir<HTMLElement>({ jedaAntarAnak: JEDA_ANTAR_ANAK });
  // Ketiga tag itu punya tipe elemen yang berbeda, jadi tipe gabungannya
  // menuntut ref yang sekaligus div, ol, dan ul. Yang dipakai di sini cuma
  // ref, className, dan children, dan ketiganya sama di semua tag.
  const Pembungkus = jenis as ElementType<{
    ref?: Ref<HTMLElement>;
    className?: string;
    children?: ReactNode;
  }>;

  return (
    <Pembungkus ref={ref} className={className}>
      {children}
    </Pembungkus>
  );
}

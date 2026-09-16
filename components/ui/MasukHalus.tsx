"use client";

import { useRef, type ReactNode } from "react";
import { animate, utils } from "animejs";
import { durasiGerak } from "@/lib/gerak";
import { useEfekTataLetak } from "./useEfekTataLetak";

const DURASI = 260;

/**
 * Membuat isinya muncul dengan naik sedikit dan memudar masuk, sekali saat
 * dipasang. Dipakai untuk hal yang kedatangannya memang perlu disadari —
 * peringatan margin, misalnya — bukan untuk isi halaman pada umumnya.
 *
 * Keadaan awal sengaja tidak ditulis di JSX, tapi di efek tata letak yang
 * berjalan sebelum paint. Bedanya terasa kalau JavaScript gagal dimuat:
 * `opacity: 0` di JSX akan membuat peringatannya tidak pernah terlihat,
 * sedangkan cara ini menyisakan HTML hasil render server apa adanya.
 *
 * Komponennya klien, tapi `children` tetap dirender di server dan dikirim
 * sebagai payload — pemakainya tidak perlu ikut jadi komponen klien.
 */
export function MasukHalus({
  children,
  className,
  geser = true,
  durasi = DURASI,
}: {
  children: ReactNode;
  className?: string;
  /**
   * Ikut bergeser naik saat masuk. Dimatikan kalau isinya menggantikan
   * placeholder di posisi yang sama: di sana gerakan justru terbaca sebagai
   * tata letak yang melompat, padahal tidak ada yang berpindah.
   */
  geser?: boolean;
  durasi?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEfekTataLetak(() => {
    const elemen = ref.current;
    if (!elemen) return;

    const ms = durasiGerak(durasi);
    if (ms === 0) return;

    utils.set(elemen, geser ? { opacity: 0, translateY: -6 } : { opacity: 0 });
    animate(elemen, {
      ...(geser ? { translateY: 0 } : {}),
      opacity: 1,
      duration: ms,
      ease: "outQuad",
    });

    return () => {
      utils.remove(elemen);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

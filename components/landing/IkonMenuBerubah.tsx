"use client";

import { useRef } from "react";
import { animate, utils } from "animejs";
import { durasiGerak } from "@/lib/gerak";
import { useEfekTataLetak } from "@/components/ui/useEfekTataLetak";

/** Sama dengan durasi panel menunya, supaya ikon dan panel bergerak sebagai satu. */
const DURASI_BUKA = 220;
const DURASI_TUTUP = 160;

/** Jarak garis atas dan bawah ke tengah, dalam satuan viewBox 24. */
const JARAK_KE_TENGAH = 5;

/**
 * Tiga garis menu yang berubah jadi silang, bukan berganti ikon seketika.
 *
 * Garis atas dan bawah bergeser ke tengah lalu memiring berlawanan arah, dan
 * garis tengahnya menghilang. Karena garisnya elemen yang sama dari awal
 * sampai akhir, gerakannya terbaca sebagai satu bentuk yang berubah — beda
 * dengan menukar dua ikon yang membuat bentuk lama hilang begitu saja.
 *
 * `transform-box: fill-box` wajib: tanpa itu titik putar sebuah garis SVG
 * dihitung dari sudut kanvas 24x24, bukan dari tengah garisnya sendiri, dan
 * garisnya akan terlempar keluar saat diputar.
 */
export function IkonMenuBerubah({ terbuka }: { terbuka: boolean }) {
  const refAtas = useRef<SVGLineElement>(null);
  const refTengah = useRef<SVGLineElement>(null);
  const refBawah = useRef<SVGLineElement>(null);

  useEfekTataLetak(() => {
    const atas = refAtas.current;
    const tengah = refTengah.current;
    const bawah = refBawah.current;
    if (!atas || !tengah || !bawah) return;

    const ms = durasiGerak(terbuka ? DURASI_BUKA : DURASI_TUTUP);

    const ease = terbuka ? "outBack(1.4)" : "outQuad";

    animate(atas, {
      translateY: terbuka ? JARAK_KE_TENGAH : 0,
      rotate: terbuka ? 45 : 0,
      duration: ms,
      ease,
    });
    animate(bawah, {
      translateY: terbuka ? -JARAK_KE_TENGAH : 0,
      rotate: terbuka ? -45 : 0,
      duration: ms,
      ease,
    });

    // Garis tengah paling dulu hilang dan paling belakang muncul kembali:
    // kalau ketiganya bergerak bersamaan, sekejap terlihat tiga garis
    // menumpuk di tengah.
    animate(tengah, {
      opacity: terbuka ? 0 : 1,
      scaleX: terbuka ? 0 : 1,
      duration: Math.round(ms * 0.6),
      delay: terbuka ? 0 : Math.round(ms * 0.4),
      ease: "outQuad",
    });

    return () => {
      utils.remove([atas, tengah, bawah]);
    };
  }, [terbuka]);

  return (
    <svg
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <line
        ref={refAtas}
        x1="4"
        y1="7"
        x2="20"
        y2="7"
        className="[transform-box:fill-box] [transform-origin:center]"
      />
      <line
        ref={refTengah}
        x1="4"
        y1="12"
        x2="20"
        y2="12"
        className="[transform-box:fill-box] [transform-origin:center]"
      />
      <line
        ref={refBawah}
        x1="4"
        y1="17"
        x2="20"
        y2="17"
        className="[transform-box:fill-box] [transform-origin:center]"
      />
    </svg>
  );
}

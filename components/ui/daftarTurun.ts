"use client";

import { useEffect, type RefObject } from "react";
import { animate, utils } from "animejs";
import { cn } from "@/lib/cn";
import { durasiGerak } from "@/lib/gerak";
import { useEfekTataLetak } from "./useEfekTataLetak";

/**
 * Bagian bersama semua daftar turun buatan sendiri.
 *
 * Dipisah supaya pemilih bahan yang bisa dicari dan pemilih opsi biasa tidak
 * pernah berbeda rupa. Perbedaan itu persis yang dulu membuat dropdown di
 * aplikasi ini terasa datang dari dua tempat.
 */

/** Tinggi panel dibatasi supaya daftar yang panjang tidak memanjang keluar layar. */
export const TINGGI_DAFTAR_MAKS = 224;

const DURASI_BUKA = 120;

/** Rupa panel melayang di bawah — atau di atas — kotak pemicunya. */
export const KELAS_PANEL_DAFTAR =
  "absolute inset-x-0 z-20 overflow-y-auto rounded-card border border-border bg-card py-1 shadow-[0_10px_30px_rgba(32,46,40,0.16)]";

/** Rupa satu baris pilihan di dalam panel. */
export function kelasOpsiDaftar(tersorot: boolean, terpilih: boolean): string {
  return cn(
    "cursor-pointer px-3 py-2 text-sm",
    tersorot ? "bg-muted text-foreground" : "text-foreground",
    terpilih && "font-medium text-primary",
  );
}

/** Jarak panel ke kotak pemicunya, plus sedikit ruang napas. */
const JARAK_PANEL = 8;

/**
 * Tinggi terkecil yang masih digambar.
 *
 * Penjaga, bukan jalur normal: hanya tercapai kalau kotak penampungnya lebih
 * pendek dari sekitar 120px, dan pada kotak sesempit itu panel setinggi 0
 * lebih menyesatkan daripada panel yang sedikit terpotong.
 */
const TINGGI_DAFTAR_MIN = 72;

export type PosisiDaftar = {
  keAtas: boolean;
  /** Tinggi maksimum panel supaya tidak melewati kotak yang memotongnya. */
  tinggiMaks: number;
};

/**
 * Batas tegak yang benar-benar berlaku untuk panel: irisan semua leluhur yang
 * memotong, dan ruang yang terlihat.
 *
 * Ditelusuri sampai ke atas, bukan berhenti di leluhur pertama: panel di dalam
 * modal dipotong dua kali — sekali oleh badan modal yang menggulir, sekali lagi
 * oleh elemen <dialog> yang ber-overflow-hidden — dan yang menentukan adalah
 * irisan keduanya.
 */
function batasTegak(wadah: HTMLElement): { atas: number; bawah: number } {
  let atas = 0;
  let bawah = window.visualViewport?.height ?? window.innerHeight;

  for (let n = wadah.parentElement; n; n = n.parentElement) {
    const gaya = getComputedStyle(n);
    // Apa pun selain `visible` memotong: auto, scroll, hidden, maupun clip.
    if (gaya.overflowY === "visible" && gaya.overflowX === "visible") continue;

    const kotak = n.getBoundingClientRect();
    atas = Math.max(atas, kotak.top);
    bawah = Math.min(bawah, kotak.bottom);
  }

  return { atas, bawah };
}

/**
 * Arah buka panel dan tinggi maksimumnya.
 *
 * Diukur terhadap kotak yang benar-benar memotong, bukan terhadap viewport.
 * Versi sebelumnya membandingkan ruang dengan `innerHeight`, jadi di dalam
 * modal ia mengira ruang di atas masih lapang — lalu panelnya membuka ke atas
 * dan tertelan header modal; terukur 87px terpotong pada modal tambah bahan di
 * layar 600x620.
 *
 * Dihitung tiap kali panel hendak dibuka, bukan sekali di awal: pemicunya bisa
 * berpindah posisi seiring badan modal digulir.
 */
export function hitungPosisiDaftar(wadah: HTMLElement | null): PosisiDaftar {
  if (!wadah) return { keAtas: false, tinggiMaks: TINGGI_DAFTAR_MAKS };

  const kotak = wadah.getBoundingClientRect();
  const batas = batasTegak(wadah);

  const ruangBawah = batas.bawah - kotak.bottom - JARAK_PANEL;
  const ruangAtas = kotak.top - batas.atas - JARAK_PANEL;

  // Ke bawah lebih dulu — arah yang diharapkan — dan baru berbalik kalau sisi
  // atas benar-benar lebih lapang.
  const keAtas = ruangBawah < TINGGI_DAFTAR_MAKS && ruangAtas > ruangBawah;
  const ruang = keAtas ? ruangAtas : ruangBawah;

  return {
    keAtas,
    tinggiMaks: Math.min(TINGGI_DAFTAR_MAKS, Math.max(TINGGI_DAFTAR_MIN, Math.round(ruang))),
  };
}

/**
 * Panel muncul dari tepi kotak pemicunya.
 *
 * Pendek saja — 120ms — karena daftar seperti ini dibuka berkali-kali dalam
 * satu sesi mengisi form, dan animasi masuk yang panjang berubah jadi
 * penghalang.
 *
 * Hanya animasi masuk. Menutupnya sengaja seketika: sesudah opsi dipilih,
 * panel yang masih memudar terbaca seperti pilihannya belum tersimpan.
 */
export function useAnimasiDaftarTurun(
  terbuka: boolean,
  keAtas: boolean,
  refDaftar: RefObject<HTMLElement | null>,
) {
  useEfekTataLetak(() => {
    if (!terbuka) return;
    const daftar = refDaftar.current;
    if (!daftar) return;

    const ms = durasiGerak(DURASI_BUKA);
    if (ms === 0) return;

    // Arah gesernya mengikuti arah bukanya, supaya panelnya terbaca keluar
    // dari kotak pemicu dan bukan melayang masuk dari arah mana saja.
    utils.set(daftar, { opacity: 0, scaleY: 0.96, translateY: keAtas ? 4 : -4 });
    animate(daftar, {
      opacity: 1,
      scaleY: 1,
      translateY: 0,
      duration: ms,
      ease: "outQuad",
    });

    return () => {
      utils.remove(daftar);
    };
  }, [terbuka, keAtas, refDaftar]);
}

/** Menutup panel begitu ada tekanan penunjuk di luar kotaknya. */
export function useTutupSaatKlikLuar(
  terbuka: boolean,
  refWadah: RefObject<HTMLElement | null>,
  tutup: () => void,
) {
  useEffect(() => {
    if (!terbuka) return;

    function tanganiKlikLuar(peristiwa: PointerEvent) {
      if (!refWadah.current?.contains(peristiwa.target as Node)) tutup();
    }

    document.addEventListener("pointerdown", tanganiKlikLuar);
    return () => document.removeEventListener("pointerdown", tanganiKlikLuar);
  }, [terbuka, refWadah, tutup]);
}

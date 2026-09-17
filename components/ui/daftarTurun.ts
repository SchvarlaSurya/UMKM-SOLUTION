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

/**
 * Apakah panelnya harus dibuka ke atas.
 *
 * Dihitung saat panel hendak dibuka, bukan sekali di awal: pemicunya bisa
 * berada di dasar badan modal yang menggulir. `visualViewport` dipakai lebih
 * dulu karena papan ketik di ponsel mengecilkan ruang terlihat tanpa mengubah
 * `innerHeight`.
 */
export function perluBukaKeAtas(wadah: HTMLElement | null): boolean {
  const kotak = wadah?.getBoundingClientRect();
  if (!kotak) return false;

  const tinggiTerlihat = window.visualViewport?.height ?? window.innerHeight;
  const ruangBawah = tinggiTerlihat - kotak.bottom;
  return ruangBawah < TINGGI_DAFTAR_MAKS && kotak.top > ruangBawah;
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

"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { animate, utils } from "animejs";
import { formatPersen, formatRupiah } from "@/lib/format";
import { durasiGerak } from "@/lib/gerak";

const DURASI = 520;

export type FormatAngka = "rupiah" | "persen" | "bulat";

function formatkan(nilai: number, format: FormatAngka, desimal: number): string {
  if (format === "rupiah") return formatRupiah(nilai);
  if (format === "persen") return formatPersen(nilai, desimal);
  return Math.round(nilai).toLocaleString("id-ID");
}

/**
 * useLayoutEffect memperingatkan saat dijalankan di server, padahal komponen ini
 * ikut dirender di sana. Di server tidak ada yang perlu diukur, jadi efeknya
 * turun jadi useEffect yang tidak pernah berjalan.
 */
const useEfekTataLetak = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Angka yang berjalan ke nilai barunya, bukan berganti diam-diam.
 *
 * Dipakai untuk HPP dan margin: begitu harga bahan diperbarui, halaman
 * dirender ulang dengan angka baru: tanpa transisi, kerja perhitungan ulang itu
 * tidak terlihat sama sekali oleh pemiliknya.
 *
 * Render pertama langsung memasang nilai akhir. Menghitung naik dari nol tiap
 * halaman dibuka hanya jadi gangguan, dan teks hasil render server harus sama
 * dengan hasil hidrasi. Yang dianimasikan hanya perubahan sesudahnya.
 */
export function AngkaBergerak({
  nilai,
  format = "bulat",
  desimal = 1,
  className,
}: {
  nilai: number;
  format?: FormatAngka;
  desimal?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const nilaiTampil = useRef(nilai);

  useEfekTataLetak(() => {
    const elemen = ref.current;
    const dari = nilaiTampil.current;
    nilaiTampil.current = nilai;

    if (!elemen || dari === nilai) return;

    const ms = durasiGerak(DURASI);
    // Gerak dimatikan: teks hasil render React sudah berisi nilai akhir.
    if (ms === 0) return;

    // Berjalan sebelum paint, jadi nilai baru yang sudah ditulis React tidak
    // sempat terlihat sekejap sebelum hitungannya mulai dari nilai lama.
    const kotak = { nilai: dari };
    elemen.textContent = formatkan(dari, format, desimal);

    animate(kotak, {
      nilai,
      duration: ms,
      ease: "outQuint",
      onUpdate: () => {
        elemen.textContent = formatkan(kotak.nilai, format, desimal);
      },
      onComplete: () => {
        elemen.textContent = formatkan(nilai, format, desimal);
      },
    });

    return () => {
      utils.remove(kotak);
      elemen.textContent = formatkan(nilai, format, desimal);
    };
  }, [nilai, format, desimal]);

  return (
    <span ref={ref} className={className}>
      {formatkan(nilai, format, desimal)}
    </span>
  );
}

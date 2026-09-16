"use client";

import { useRef } from "react";
import { animate, utils } from "animejs";
import { formatPersen, formatRupiah } from "@/lib/format";
import { durasiGerak } from "@/lib/gerak";
import { nilaiTerakhir, simpanNilai } from "@/lib/ingatanAngka";
import { useEfekTataLetak } from "./useEfekTataLetak";

const DURASI = 520;

export type FormatAngka = "rupiah" | "persen" | "bulat";

function formatkan(nilai: number, format: FormatAngka, desimal: number): string {
  if (format === "rupiah") return formatRupiah(nilai);
  if (format === "persen") return formatPersen(nilai, desimal);
  return Math.round(nilai).toLocaleString("id-ID");
}

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
  ingat,
}: {
  nilai: number;
  format?: FormatAngka;
  desimal?: number;
  className?: string;
  /**
   * Nama penyimpanan untuk mengingat nilai yang terakhir ditampilkan, supaya
   * perubahan yang terjadi di halaman lain tetap terlihat saat pemilik kembali
   * ke sini. Tanpa prop ini, hanya perubahan selagi komponen tetap terpasang
   * yang dianimasikan.
   *
   * Sengaja tidak dipakai di baris tabel: lebar kolom tabel ditentukan isinya,
   * jadi puluhan teks yang berubah tiap frame memaksa seluruh tabel diukur
   * ulang berkali-kali. Kartu ringkasan berdiri sendiri dan tidak punya biaya
   * itu.
   */
  ingat?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const nilaiTampil = useRef<number | null>(null);

  useEfekTataLetak(() => {
    const elemen = ref.current;
    if (!elemen) return;

    // Belum pernah menampilkan apa pun: pakai ingatan sesi kalau ada.
    const asal = nilaiTampil.current ?? (ingat ? nilaiTerakhir(ingat) : null);

    function tetapkan(akhir: number) {
      nilaiTampil.current = akhir;
      if (ingat) simpanNilai(ingat, akhir);
    }

    const ms = durasiGerak(DURASI);
    // Tidak ada yang perlu dijalankan kalau tidak ada nilai sebelumnya, nilainya
    // sama, atau gerak dimatikan — teks hasil render React sudah benar.
    if (asal === null || asal === nilai || ms === 0) {
      tetapkan(nilai);
      return;
    }

    // Berjalan sebelum paint, jadi nilai baru yang sudah ditulis React tidak
    // sempat terlihat sekejap sebelum hitungannya mulai dari nilai lama.
    const kotak = { nilai: asal };
    elemen.textContent = formatkan(asal, format, desimal);

    animate(kotak, {
      nilai,
      duration: ms,
      ease: "outQuint",
      onUpdate: () => {
        elemen.textContent = formatkan(kotak.nilai, format, desimal);
      },
      // Nilai baru baru dicatat setelah animasinya benar-benar selesai. Kalau
      // dicatat lebih awal, efek yang dijalankan dua kali oleh Strict Mode
      // membatalkan animasi pertama lalu menganggap tidak ada yang berubah.
      onComplete: () => {
        elemen.textContent = formatkan(nilai, format, desimal);
        tetapkan(nilai);
      },
    });

    return () => {
      utils.remove(kotak);
      elemen.textContent = formatkan(nilai, format, desimal);
    };
  }, [nilai, format, desimal, ingat]);

  return (
    <span ref={ref} className={className}>
      {formatkan(nilai, format, desimal)}
    </span>
  );
}

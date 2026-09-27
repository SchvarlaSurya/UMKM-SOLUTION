"use client";

import { useRef } from "react";
import { animate, utils } from "animejs";
import { formatRupiah } from "@/lib/format";
import { durasiGerak } from "@/lib/gerak";
import { useEfekTataLetak } from "./useEfekTataLetak";
import { pengamatMasuk } from "./useMasukGulir";

const DURASI = 800;

/**
 * Angka besar yang berjalan naik dari nol saat masuk area pandang.
 *
 * Bedanya dengan AngkaBergerak: komponen itu sengaja tidak pernah menghitung
 * dari nol, karena di dashboard yang perlu terlihat adalah *perubahannya*, dan
 * menghitung ulang tiap halaman dibuka cuma jadi gangguan. Di landing page
 * angkanya tidak pernah berubah — yang perlu disadari justru besarnya, dan
 * hitungan naik itulah yang membuatnya terbaca sebagai jumlah, bukan hiasan.
 *
 * Angkanya tidak pernah dinolkan lebih awal. Yang terbaca sebelum hitungannya
 * mulai adalah nilai penuh hasil render server, dan nol baru ditulis pada
 * detik animasinya berjalan. Ini disengaja: kalau JavaScript gagal dimuat atau
 * animasinya tidak pernah jalan, yang tertinggal di layar angka yang benar,
 * bukan "Rp 0". Angka salah lebih buruk daripada angka yang tidak bergerak —
 * ini klaim tentang uang, bukan hiasan.
 *
 * Hanya rupiah: di halaman ini cuma ada satu angka seperti ini, dan menambah
 * pilihan format sebelum ada yang memakainya hanya menambah yang perlu diurus.
 */
export function AngkaNaikSaatTampil({ nilai, className }: { nilai: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEfekTataLetak(() => {
    const elemen = ref.current;
    if (!elemen) return;

    const ms = durasiGerak(DURASI);
    if (ms === 0) return;

    // Sudah terlihat begitu halaman dibuka — misalnya setelah muat ulang di
    // posisi gulir ini. Menghitungnya dari nol berarti angka yang sudah
    // terbaca mundur dulu, dan itu terlihat seperti kerusakan.
    if (elemen.getBoundingClientRect().top < window.innerHeight) return;

    const kotak = { nilai: 0 };
    const pengamat = pengamatMasuk(elemen);

    animate(kotak, {
      nilai,
      duration: ms,
      ease: "outQuint",
      autoplay: pengamat,
      // Nolnya baru ditulis saat hitungannya benar-benar mulai, bukan saat
      // dipasang. Selama belum sampai, yang terbaca tetap nilai penuh hasil
      // render server — jadi kalau animasinya tidak pernah jalan, yang
      // tertinggal angka yang benar, bukan "Rp 0".
      onBegin: () => {
        elemen.textContent = formatRupiah(0);
      },
      onUpdate: () => {
        elemen.textContent = formatRupiah(kotak.nilai);
      },
      onComplete: () => {
        elemen.textContent = formatRupiah(nilai);
      },
    });

    return () => {
      pengamat.revert();
      utils.remove(kotak);
      // Pengamatnya sudah dilepas, jadi tidak ada lagi yang akan melanjutkan
      // hitungannya. Angkanya dikembalikan utuh supaya tidak tertinggal di
      // nilai tengah kalau dibongkar selagi berjalan.
      elemen.textContent = formatRupiah(nilai);
    };
  }, [nilai]);

  const teks = formatRupiah(nilai);

  return (
    <span className={className}>
      {/*
       * Yang berjalan disembunyikan dari pembaca layar, dan nilai akhirnya
       * disediakan terpisah. Tanpa ini, pembaca layar yang sampai ke sini
       * selagi hitungannya jalan akan membacakan angka tengah yang salah.
       */}
      <span ref={ref} aria-hidden="true">
        {teks}
      </span>
      <span className="sr-only">{teks}</span>
    </span>
  );
}

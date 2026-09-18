"use client";

import { useEffect } from "react";

/** Penanda di <html> yang dibaca aturan cincin fokus di globals.css. */
const ATRIBUT = "data-fokus-papan-ketik";

/**
 * Mencatat apakah fokus terakhir berpindah karena papan ketik atau karena
 * tetikus.
 *
 * `:focus-visible` bawaan peramban sudah membedakan keduanya untuk tombol dan
 * tautan, tapi **tidak** untuk kotak isian: mengklik `<input>` tetap dianggap
 * focus-visible, karena di sana mengetik memang diharapkan. Itu sebabnya
 * cincin fokus muncul saat kotak pencarian atau kolom form diklik.
 *
 * Penanda ini mengembalikan pembedaan itu: Tab menyalakannya, tekanan penunjuk
 * mematikannya. Aturan di globals.css lalu menyembunyikan cincin pada kotak
 * isian selama penandanya mati.
 *
 * Cincinnya tidak dihapus, hanya dibuat tidak muncul saat diklik. Bagi yang
 * menavigasi dengan papan ketik, cincin itu satu-satunya petunjuk posisi.
 */
export function ModalitasFokus() {
  useEffect(() => {
    const akar = document.documentElement;

    // Hanya Tab: tombol lain tidak memindahkan fokus antar kolom, dan menyala
    // karena sembarang ketikan akan membuat cincin muncul di kotak yang sedang
    // diketik — persis yang ingin dihilangkan.
    const tanganiTombol = (peristiwa: KeyboardEvent) => {
      if (peristiwa.key === "Tab") akar.setAttribute(ATRIBUT, "");
    };

    const tanganiPenunjuk = () => akar.removeAttribute(ATRIBUT);

    // Fase tangkap: penanda harus sudah benar sebelum fokus benar-benar
    // berpindah, jadi kotak yang baru menerima fokus langsung tergambar dengan
    // keadaan yang tepat.
    window.addEventListener("keydown", tanganiTombol, true);
    window.addEventListener("pointerdown", tanganiPenunjuk, true);

    return () => {
      window.removeEventListener("keydown", tanganiTombol, true);
      window.removeEventListener("pointerdown", tanganiPenunjuk, true);
    };
  }, []);

  return null;
}

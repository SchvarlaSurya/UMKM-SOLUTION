"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, utils } from "animejs";
import { durasiGerak } from "@/lib/gerak";

/** Masuk sedikit lebih lambat dari keluar: menutup harus terasa langsung. */
const DURASI_BUKA = 320;
const DURASI_TUTUP = 220;

/** Sama dengan breakpoint `lg` Tailwind, tempat drawer berganti sidebar tetap. */
const LAYAR_BESAR = "(min-width: 1024px)";

const PEMILIH_FOKUS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

/** Elemen yang benar-benar bisa difokus: yang tersembunyi tidak punya kotak. */
function elemenBisaFokus(akar: HTMLElement) {
  return Array.from(akar.querySelectorAll<HTMLElement>(PEMILIH_FOKUS)).filter(
    (elemen) => elemen.getClientRects().length > 0,
  );
}

/**
 * Mengatur buka-tutup drawer beserta animasinya.
 *
 * `tampil` menyatakan drawer ada di DOM, bukan "sedang terbuka": saat menutup,
 * elemennya harus bertahan sampai animasi keluar selesai, jadi `tutup()` yang
 * memutar animasi lebih dulu lalu melepas elemennya lewat `onComplete`.
 *
 * Posisi awal panel (`translateX(-100%)`) dan latar (`opacity: 0`) ditulis di
 * JSX pemanggil. Elemennya lahir baru setiap kali drawer dibuka, jadi node-nya
 * selalu mulai dari posisi tertutup dan tidak sempat berkedip lebih dulu.
 */
export function useAnimasiDrawer() {
  const [tampil, setTampil] = useState(false);
  // `tampil` saja tidak cukup jadi pemicu animasi masuk. Kalau pengguna menekan
  // tombol menu tepat ketika animasi keluar selesai, React menggabungkan
  // `setTampil(false)` dari `onComplete` dengan `setTampil(true)` di sini
  // menjadi satu render tanpa perubahan nilai — efeknya tidak jalan dan drawer
  // nyangkut dalam posisi tertutup. Penghitung yang selalu naik memastikan
  // setiap permintaan buka punya render sendiri.
  const [sesiBuka, setSesiBuka] = useState(0);
  const refPembungkus = useRef<HTMLDivElement>(null);
  const refPanel = useRef<HTMLDivElement>(null);
  const refLatar = useRef<HTMLButtonElement>(null);
  const sedangMenutup = useRef(false);

  function mainkanMasuk() {
    const panel = refPanel.current;
    const latar = refLatar.current;
    const pembungkus = refPembungkus.current;
    if (!panel || !latar || !pembungkus) return;

    // Membuang sisa animasi keluar sekaligus membatalkan `onComplete`-nya,
    // supaya drawer yang dibuka lagi di tengah jalan tidak ikut terlepas.
    utils.remove(panel);
    utils.remove(latar);
    sedangMenutup.current = false;
    utils.set(pembungkus, { pointerEvents: "auto" });

    // Tanpa nilai awal: panel bergerak dari posisinya saat ini, jadi membuka
    // kembali di tengah animasi keluar tidak melompat ke -100% dulu.
    const ms = durasiGerak(DURASI_BUKA);
    animate(latar, { opacity: 1, duration: ms, ease: "outQuad" });
    animate(panel, { translateX: "0%", duration: ms, ease: "outQuint" });
  }

  useLayoutEffect(() => {
    if (!tampil) return;
    mainkanMasuk();

    const panel = refPanel.current;
    const latar = refLatar.current;
    return () => {
      // Sisa animasi dibuang saat elemennya dilepas, supaya callback-nya tidak
      // menyentuh node yang sudah tidak ada.
      if (panel) utils.remove(panel);
      if (latar) utils.remove(latar);
    };
  }, [tampil, sesiBuka]);

  /**
   * Perilaku modal drawer: kunci gulir halaman, kurung fokus di dalam panel,
   * dan tutup lewat Esc.
   */
  useEffect(() => {
    if (!tampil) return;
    const panel = refPanel.current;
    if (!panel) return;

    // Fokus dikembalikan ke pemicunya (tombol menu) begitu drawer ditutup,
    // supaya urutan tab pengguna keyboard tidak lompat ke awal halaman.
    const pemicu = document.activeElement as HTMLElement | null;

    const gulirAsli = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Panel sendiri yang difokus lebih dulu, bukan tautan pertamanya: pembaca
    // layar jadi sempat membacakan label dialognya.
    panel.focus();

    // Arrow function, bukan deklarasi: TypeScript hanya mempertahankan
    // penyempitan tipe `panel` di dalam closure yang tidak terangkat.
    const tanganiTombol = (peristiwa: KeyboardEvent) => {
      // Modal konfirmasi keluar memakai <dialog> dan berada di top layer; Esc
      // serta pengurungan fokusnya sudah diurus browser, jangan diambil alih.
      if (document.querySelector("dialog[open]")) return;

      if (peristiwa.key === "Escape") {
        peristiwa.preventDefault();
        tutup();
        return;
      }

      if (peristiwa.key !== "Tab") return;
      const daftar = elemenBisaFokus(panel);
      if (daftar.length === 0) return;

      const awal = daftar[0];
      const akhir = daftar[daftar.length - 1];
      const fokusSekarang = document.activeElement;

      if (!panel.contains(fokusSekarang)) {
        peristiwa.preventDefault();
        awal.focus();
      } else if (peristiwa.shiftKey && fokusSekarang === awal) {
        peristiwa.preventDefault();
        akhir.focus();
      } else if (!peristiwa.shiftKey && fokusSekarang === akhir) {
        peristiwa.preventDefault();
        awal.focus();
      }
    };

    // Melebar ke layar besar membuat drawer disembunyikan CSS (`lg:hidden`)
    // tanpa pernah ditutup; gulir halaman akan tetap terkunci kalau dibiarkan.
    const layarBesar = window.matchMedia(LAYAR_BESAR);
    const tanganiLebar = () => {
      if (layarBesar.matches) tutup();
    };

    document.addEventListener("keydown", tanganiTombol);
    layarBesar.addEventListener("change", tanganiLebar);

    return () => {
      document.removeEventListener("keydown", tanganiTombol);
      layarBesar.removeEventListener("change", tanganiLebar);
      document.body.style.overflow = gulirAsli;
      pemicu?.focus();
    };
  }, [tampil]);

  function buka() {
    setTampil(true);
    setSesiBuka((n) => n + 1);
  }

  function tutup() {
    const panel = refPanel.current;
    const latar = refLatar.current;
    const pembungkus = refPembungkus.current;
    if (!panel || !latar || !pembungkus) {
      setTampil(false);
      return;
    }
    if (sedangMenutup.current) return;

    // Panel yang sedang menyingkir tidak boleh lagi menerima klik; tanpa ini
    // tautan menu masih bisa tertekan saat animasi keluar berjalan.
    sedangMenutup.current = true;
    utils.set(pembungkus, { pointerEvents: "none" });

    const ms = durasiGerak(DURASI_TUTUP);
    animate(latar, { opacity: 0, duration: ms, ease: "inQuad" });
    animate(panel, {
      translateX: "-100%",
      duration: ms,
      ease: "inQuad",
      onComplete: () => {
        sedangMenutup.current = false;
        setTampil(false);
      },
    });
  }

  return { tampil, buka, tutup, refPembungkus, refPanel, refLatar };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animate, utils } from "animejs";
import { ButtonLink } from "@/components/ui/Button";
import { useTutupSaatKlikLuar } from "@/components/ui/daftarTurun";
import { IconChevronKanan, IconMenu, IconTutup } from "@/components/ui/icons";
import { useEfekTataLetak } from "@/components/ui/useEfekTataLetak";
import { durasiGerak } from "@/lib/gerak";

/** Masuk sedikit lebih lambat dari keluar: menutup harus terasa langsung. */
const DURASI_BUKA = 220;
const DURASI_TUTUP = 160;

/** Jarak geser panel saat muncul dan menyingkir, dalam piksel. */
const GESER = 8;

/**
 * Tautan antarbagian untuk layar kecil, tempat deretan tautan di header
 * disembunyikan. Panelnya turun tepat di bawah header yang menempel.
 *
 * `tampil` menyatakan panel ada di layar, bukan "sedang terbuka": saat
 * menutup, panelnya harus bertahan sampai animasi keluar selesai, jadi
 * `tutup()` memutar animasinya lebih dulu lalu menyembunyikan elemennya lewat
 * `onComplete`. Tanpa pemisahan itu panel langsung lenyap dan tidak ada
 * animasi keluar sama sekali.
 *
 * Panelnya selalu ada di DOM dan hanya ditandai `hidden`, bukan dirender
 * bersyarat, supaya `aria-controls` di tombolnya tidak pernah menunjuk elemen
 * yang tidak ada. Keadaan tertutupnya ditulis di JSX supaya bukaan pertama
 * punya titik awal yang benar.
 */
export function MenuMobile({ tautan }: { tautan: { href: string; label: string }[] }) {
  const [buka, setBuka] = useState(false);
  const [tampil, setTampil] = useState(false);
  // `tampil` saja tidak cukup jadi pemicu animasi masuk. Kalau tombol menu
  // ditekan tepat ketika animasi keluar selesai, React menggabungkan
  // `setTampil(false)` dari `onComplete` dengan `setTampil(true)` di sini
  // menjadi satu render tanpa perubahan nilai — efeknya tidak jalan dan
  // panelnya nyangkut tertutup. Penghitung yang selalu naik memastikan setiap
  // permintaan buka punya render sendiri.
  const [sesiBuka, setSesiBuka] = useState(0);
  const refWadah = useRef<HTMLDivElement>(null);
  const refTombol = useRef<HTMLButtonElement>(null);
  const refPanel = useRef<HTMLDivElement>(null);
  const sedangMenutup = useRef(false);

  function bukaMenu() {
    setBuka(true);
    setTampil(true);
    setSesiBuka((n) => n + 1);
  }

  // Keduanya dibungkus useCallback dan hanya memakai ref serta penyetel state,
  // jadi acuannya tetap sama sepanjang umur komponen. Pendengar Esc dan
  // pendengar tekan-di-luar jadi tidak dipasang ulang tiap render.
  const tutup = useCallback(() => {
    setBuka(false);

    const panel = refPanel.current;
    if (!panel) {
      setTampil(false);
      return;
    }
    if (sedangMenutup.current) return;
    sedangMenutup.current = true;

    // Panel yang sedang menyingkir tidak boleh lagi menerima ketukan; tanpa
    // ini tautan menu masih bisa tertekan selagi animasi keluar berjalan.
    utils.set(panel, { pointerEvents: "none" });

    animate(panel, {
      opacity: 0,
      translateY: -GESER,
      duration: durasiGerak(DURASI_TUTUP),
      ease: "inQuad",
      onComplete: () => {
        sedangMenutup.current = false;
        setTampil(false);
      },
    });
  }, []);

  const tutupDanKembalikanFokus = useCallback(() => {
    tutup();
    refTombol.current?.focus();
  }, [tutup]);

  useEfekTataLetak(() => {
    if (!tampil) return;
    const panel = refPanel.current;
    if (!panel) return;

    // Membuang sisa animasi keluar sekaligus membatalkan `onComplete`-nya,
    // supaya menu yang dibuka lagi di tengah jalan tidak ikut tersembunyi.
    utils.remove(panel);
    sedangMenutup.current = false;
    utils.set(panel, { pointerEvents: "auto" });

    // Tanpa nilai awal: panelnya bergerak dari posisinya saat ini, jadi
    // membuka kembali di tengah animasi keluar tidak melompat ke atas dulu.
    animate(panel, {
      opacity: 1,
      translateY: 0,
      duration: durasiGerak(DURASI_BUKA),
      ease: "outQuint",
    });

    return () => {
      utils.remove(panel);
    };
  }, [tampil, sesiBuka]);

  useEffect(() => {
    if (!buka) return;
    function tutupDenganEsc(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      tutupDanKembalikanFokus();
    }
    document.addEventListener("keydown", tutupDenganEsc);
    return () => document.removeEventListener("keydown", tutupDenganEsc);
  }, [buka, tutupDanKembalikanFokus]);

  // Menekan di luar menu menutupnya, sama seperti daftar turun lain di
  // aplikasi ini. Wadahnya mencakup tombol dan panel, jadi menekan tombolnya
  // saat terbuka tidak menutup lewat jalur ini lalu terbuka lagi oleh onClick.
  useTutupSaatKlikLuar(buka, refWadah, tutup);

  return (
    <div ref={refWadah} className="lg:hidden">
      <button
        ref={refTombol}
        type="button"
        className="inline-flex size-10 items-center justify-center rounded-card text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        aria-expanded={buka}
        aria-controls="menu-landing"
        aria-label={buka ? "Tutup menu" : "Buka menu"}
        onClick={() => (buka ? tutupDanKembalikanFokus() : bukaMenu())}
      >
        {buka ? <IconTutup /> : <IconMenu />}
      </button>

      <div
        id="menu-landing"
        ref={refPanel}
        hidden={!tampil}
        style={{ opacity: 0, transform: `translateY(-${GESER}px)` }}
        className="absolute inset-x-0 top-full border-b border-border bg-card pt-1 pb-4 shadow-[0_12px_24px_rgba(32,46,40,0.08)]"
      >
        <ul className="flex flex-col divide-y divide-border">
          {tautan.map((t) => (
            <li key={t.href}>
              <a
                href={t.href}
                onClick={tutup}
                className="flex min-h-12 items-center justify-between gap-3 px-4 text-base text-foreground transition-colors hover:bg-muted active:bg-muted"
              >
                {t.label}
                <IconChevronKanan
                  width={16}
                  height={16}
                  className="shrink-0 text-muted-foreground"
                />
              </a>
            </li>
          ))}
        </ul>
        <div className="px-4 pt-4 sm:hidden">
          <ButtonLink href="/login" varian="secondary" className="h-11 w-full">
            Masuk
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

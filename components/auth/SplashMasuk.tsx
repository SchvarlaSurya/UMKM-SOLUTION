"use client";

import { useEffect, useRef } from "react";
import { animate, utils } from "animejs";
import { IconLogo } from "@/components/ui/icons";
import { useEfekTataLetak } from "@/components/ui/useEfekTataLetak";
import { durasiGerak } from "@/lib/gerak";

const DURASI_MASUK = 240;

/**
 * Lama layar ini bertahan sebelum pindah halaman.
 *
 * Cukup lama untuk terbaca sebagai jeda yang disengaja, cukup singkat untuk
 * tidak terasa menunggu. Waktunya tidak terbuang: halaman tujuan sudah mulai
 * diambil lebih dulu lewat `router.prefetch`, jadi jeda ini menutupi kerja
 * yang memang sedang berjalan, bukan menambah kerja baru.
 */
export const TAHAN_SPLASH = 900;

/**
 * Layar antara setelah masuk atau mendaftar berhasil.
 *
 * Tanpa ini perpindahan ke halaman berikutnya terasa seperti potongan
 * mendadak: formulir hilang, halaman baru muncul, tanpa apa pun yang
 * menjelaskan bahwa yang barusan ditekan memang berhasil. Layar ini menutupi
 * peralihan itu sekaligus jadi tanda bahwa prosesnya sudah lewat.
 *
 * Batangnya terisi selama `TAHAN_SPLASH`, jadi lamanya jeda ini terlihat,
 * bukan diam tanpa kabar.
 *
 * Pemanggilnya tidak perlu menstabilkan `onSelesai`: acuannya disimpan di ref
 * supaya penghitung waktunya tidak pernah dipasang ulang di tengah jalan.
 */
export function SplashMasuk({ pesan, onSelesai }: { pesan: string; onSelesai: () => void }) {
  const refLapis = useRef<HTMLDivElement>(null);
  const refMerek = useRef<HTMLDivElement>(null);
  const refBatang = useRef<HTMLDivElement>(null);
  const refSelesai = useRef(onSelesai);

  useEfekTataLetak(() => {
    refSelesai.current = onSelesai;
  });

  useEfekTataLetak(() => {
    const lapis = refLapis.current;
    const merek = refMerek.current;
    const batang = refBatang.current;
    if (!lapis || !merek || !batang) return;

    const ms = durasiGerak(DURASI_MASUK);
    if (ms === 0) {
      // Gerak dimatikan: layarnya tetap tampil utuh, hanya tanpa peralihan.
      utils.set(batang, { scaleX: 1 });
      return;
    }

    utils.set(lapis, { opacity: 0 });
    utils.set(merek, { opacity: 0, scale: 0.96, translateY: 6 });
    utils.set(batang, { scaleX: 0 });

    animate(lapis, { opacity: 1, duration: ms, ease: "outQuad" });
    animate(merek, {
      opacity: 1,
      scale: 1,
      translateY: 0,
      duration: ms + 140,
      delay: 60,
      ease: "outBack(1.2)",
    });
    animate(batang, { scaleX: 1, duration: TAHAN_SPLASH, ease: "inOutQuad" });

    return () => {
      utils.remove(lapis);
      utils.remove(merek);
      utils.remove(batang);
    };
  }, []);

  useEffect(() => {
    const id = setTimeout(() => refSelesai.current(), TAHAN_SPLASH);
    return () => clearTimeout(id);
  }, []);

  return (
    <div
      ref={refLapis}
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-background px-6"
    >
      <div ref={refMerek} className="flex items-center gap-2.5 text-foreground">
        <span className="flex size-10 items-center justify-center rounded-card bg-primary text-primary-foreground">
          <IconLogo width={22} height={22} />
        </span>
        <span className="text-lg font-semibold tracking-tight">
          ruang<span className="text-primary">margin</span>
        </span>
      </div>

      <p className="text-center text-sm text-muted-foreground">{pesan}</p>

      {/* Batangnya hiasan yang menandai lamanya jeda; pesan di atas sudah
          mengabarkan keadaannya, jadi ini disembunyikan dari pembaca layar. */}
      <div aria-hidden="true" className="h-0.5 w-40 overflow-hidden rounded-full bg-border">
        <div ref={refBatang} className="h-full w-full origin-left bg-primary" />
      </div>
    </div>
  );
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { animate, utils } from "animejs";
import { cn } from "@/lib/cn";
import { durasiGerak } from "@/lib/gerak";
import { IconCentang, IconInfo, IconPeringatan, IconTutup } from "./icons";
import { useEfekTataLetak } from "./useEfekTataLetak";

const DURASI_MASUK = 260;
const DURASI_KELUAR = 180;

/** Galat diberi waktu lebih lama: pesannya perlu sempat terbaca sebelum hilang. */
const DURASI_TAMPIL: Record<VarianToast, number> = {
  sukses: 4000,
  info: 4000,
  galat: 6000,
};

export type VarianToast = "sukses" | "info" | "galat";

type IsiToast = {
  pesan: string;
  varian?: VarianToast;
};

type Toast = IsiToast & { id: number; varian: VarianToast };

const gayaVarian: Record<VarianToast, string> = {
  sukses: "border-success-border bg-success-bg text-success",
  info: "border-info-border bg-info-bg text-info",
  galat: "border-warning-border bg-warning-bg text-warning",
};

const ikonVarian: Record<VarianToast, ReactNode> = {
  sukses: <IconCentang width={16} height={16} />,
  info: <IconInfo width={16} height={16} />,
  galat: <IconPeringatan width={16} height={16} />,
};

const KonteksToast = createContext<((isi: IsiToast) => void) | null>(null);

/**
 * Pesan singkat yang melayang di atas halaman.
 *
 * Dipakai untuk kabar yang menyangkut seluruh layar — gagal masuk, data
 * tersimpan — bukan untuk galat yang menunjuk satu kolom. Yang menunjuk kolom
 * tetap tampil inline di bawah kolomnya, karena di sanalah pengguna perlu
 * memperbaikinya.
 *
 * Melayang, jadi munculnya tidak menggeser atau memanjangkan apa pun di
 * belakangnya.
 */
export function PenyediaToast({ children }: { children: ReactNode }) {
  const [daftar, setDaftar] = useState<Toast[]>([]);
  const idBerikutnya = useRef(1);

  const tampilkanToast = useCallback((isi: IsiToast) => {
    const id = idBerikutnya.current++;
    setDaftar((sebelumnya) => [...sebelumnya, { ...isi, id, varian: isi.varian ?? "sukses" }]);
  }, []);

  const lepas = useCallback((id: number) => {
    setDaftar((sebelumnya) => sebelumnya.filter((t) => t.id !== id));
  }, []);

  const nilai = useMemo(() => tampilkanToast, [tampilkanToast]);

  return (
    <KonteksToast.Provider value={nilai}>
      {children}

      {/*
        Wadahnya selalu terpasang, bahkan saat kosong. Pembaca layar hanya
        mengumumkan isi yang masuk ke daerah live yang sudah ada sebelumnya;
        kalau wadahnya ikut muncul-hilang, pengumumannya sering terlewat.

        Satu daerah `polite` untuk semuanya, termasuk galat: fokus pengguna
        tetap di tempatnya, dan tidak ada yang cukup mendesak untuk memotong
        apa pun yang sedang dibacakan.
      */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        {daftar.map((toast) => (
          <ItemToast key={toast.id} toast={toast} onSelesai={() => lepas(toast.id)} />
        ))}
      </div>
    </KonteksToast.Provider>
  );
}

export function useToast() {
  const nilai = useContext(KonteksToast);
  if (!nilai) throw new Error("useToast harus dipakai di dalam PenyediaToast");
  return nilai;
}

function ItemToast({ toast, onSelesai }: { toast: Toast; onSelesai: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const sedangKeluar = useRef(false);
  const pewaktu = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sisaWaktu = useRef(DURASI_TAMPIL[toast.varian]);
  const mulaiHitung = useRef(0);

  useEfekTataLetak(() => {
    const elemen = ref.current;
    if (!elemen) return;

    const ms = durasiGerak(DURASI_MASUK);
    if (ms === 0) {
      utils.set(elemen, { opacity: 1, translateY: 0, scale: 1 });
    } else {
      animate(elemen, { opacity: 1, translateY: 0, scale: 1, duration: ms, ease: "outQuint" });
    }

    jalankanPewaktu();

    // Listener dipasang langsung ke elemennya, bukan lewat prop onPointerEnter.
    // React menyimpulkan enter/leave dari pointerover/pointerout yang bubble,
    // dan penyimpulan itu tidak selalu terpicu; pointerenter natif selalu.
    // Versi natif juga tidak salah paham saat kursor berpindah ke tombol tutup
    // di dalam toast — enter/leave memang tidak peduli pada anak elemen.
    elemen.addEventListener("pointerenter", tahanPewaktu);
    elemen.addEventListener("pointerleave", lanjutkanPewaktu);

    return () => {
      utils.remove(elemen);
      elemen.removeEventListener("pointerenter", tahanPewaktu);
      elemen.removeEventListener("pointerleave", lanjutkanPewaktu);
      if (pewaktu.current) clearTimeout(pewaktu.current);
    };
    // Sengaja sekali jalan: toast tidak pernah berganti isi setelah dipasang.
  }, []);

  function jalankanPewaktu() {
    mulaiHitung.current = Date.now();
    pewaktu.current = setTimeout(mulaiKeluar, sisaWaktu.current);
  }

  function tahanPewaktu() {
    if (!pewaktu.current || sedangKeluar.current) return;
    clearTimeout(pewaktu.current);
    pewaktu.current = null;
    sisaWaktu.current -= Date.now() - mulaiHitung.current;
  }

  function lanjutkanPewaktu() {
    if (pewaktu.current || sedangKeluar.current) return;
    jalankanPewaktu();
  }

  function mulaiKeluar() {
    const elemen = ref.current;
    if (sedangKeluar.current) return;
    sedangKeluar.current = true;

    if (pewaktu.current) clearTimeout(pewaktu.current);

    const ms = durasiGerak(DURASI_KELUAR);
    if (!elemen || ms === 0) {
      onSelesai();
      return;
    }

    utils.remove(elemen);
    animate(elemen, {
      opacity: 0,
      translateY: 8,
      duration: ms,
      ease: "inQuad",
      onComplete: onSelesai,
    });
  }

  return (
    <div
      ref={ref}
      // Posisi awal ditulis di JSX: toast hanya ada karena JavaScript, jadi
      // tidak ada kondisi tanpa skrip yang perlu dijaga di sini.
      style={{ opacity: 0, transform: "translateY(12px) scale(0.98)" }}
      onFocusCapture={tahanPewaktu}
      onBlurCapture={lanjutkanPewaktu}
      className={cn(
        "pointer-events-auto flex w-full items-start gap-2.5 rounded-card border px-4 py-3 shadow-[0_10px_30px_rgba(32,46,40,0.16)] sm:w-80",
        gayaVarian[toast.varian],
      )}
    >
      <span className="mt-0.5 shrink-0">{ikonVarian[toast.varian]}</span>
      <p className="min-w-0 flex-1 text-sm text-foreground">{toast.pesan}</p>
      <button
        type="button"
        onClick={mulaiKeluar}
        aria-label="Tutup pemberitahuan"
        className="-mr-1 shrink-0 rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
      >
        <IconTutup width={14} height={14} />
      </button>
    </div>
  );
}

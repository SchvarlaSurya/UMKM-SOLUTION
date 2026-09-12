"use client";

import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";
import { IconTutup } from "./icons";

/**
 * Pola modal sesuai dokumentasi prototipe bagian 7:
 * judul + subjudul deskriptif -> konten -> aksi kanan bawah
 * (sekunder di kiri, primer di kanan).
 *
 * Memakai <dialog> native: Esc menutup, fokus otomatis dikelola browser,
 * latar belakang tidak bisa di-tab.
 */
export function Modal({
  terbuka,
  onTutup,
  judul,
  subjudul,
  children,
  aksiPrimer,
  aksiSekunder,
  lebar = "md",
}: {
  terbuka: boolean;
  onTutup: () => void;
  judul: string;
  subjudul?: ReactNode;
  children: ReactNode;
  aksiPrimer?: ReactNode;
  aksiSekunder?: ReactNode;
  lebar?: "md" | "lg";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const idJudul = useId();
  const idSubjudul = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (terbuka && !dialog.open) dialog.showModal();
    if (!terbuka && dialog.open) dialog.close();
  }, [terbuka]);

  // Esc memicu event `cancel`/`close` bawaan; state induk ikut disinkronkan.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleClose = () => onTutup();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onTutup]);

  function klikBackdrop(e: MouseEvent<HTMLDialogElement>) {
    if (e.target === ref.current) onTutup();
  }

  return (
    <dialog
      ref={ref}
      onClick={klikBackdrop}
      aria-labelledby={idJudul}
      aria-describedby={subjudul ? idSubjudul : undefined}
      className={cn(
        "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] overflow-y-auto rounded-card border border-border bg-card p-0 text-foreground",
        "backdrop:bg-foreground/40",
        lebar === "lg" ? "max-w-2xl" : "max-w-lg",
      )}
    >
      <div className="flex items-start justify-between gap-4 px-5 pt-5">
        <div>
          <h2 id={idJudul} className="text-base font-semibold">
            {judul}
          </h2>
          {subjudul && (
            <p id={idSubjudul} className="mt-1 text-sm text-muted-foreground">
              {subjudul}
            </p>
          )}
        </div>
        <Button
          varian="ghost"
          ukuran="sm"
          onClick={onTutup}
          aria-label="Tutup"
          className="-mr-1 -mt-1 px-2"
        >
          <IconTutup />
        </Button>
      </div>

      <div className="px-5 py-5">{children}</div>

      {(aksiPrimer || aksiSekunder) && (
        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
          <div>{aksiSekunder}</div>
          <div>{aksiPrimer}</div>
        </div>
      )}
    </dialog>
  );
}

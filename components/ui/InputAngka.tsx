"use client";

import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Isian angka yang menampilkan pemisah ribuan sambil diketik: "10000" tampil
 * sebagai "10.000".
 *
 * `<input type="number">` tidak bisa dipakai karena titik pemisah membuat
 * nilainya dianggap tidak sah oleh peramban, jadi di sini memakai `type="text"`
 * dengan `inputMode="numeric"` — papan ketik angka tetap muncul di ponsel.
 *
 * Nilai yang keluar selalu berupa digit polos tanpa titik:
 * - lewat `name`, ditaruh di input tersembunyi supaya FormData menerima angka
 *   mentah seperti sebelumnya
 * - lewat `onNilaiUbah`, untuk form yang menghitung sesuatu sambil diketik
 */

/** Hanya sisakan digit. Titik, spasi, huruf, dan tanda minus dibuang. */
function ambilDigit(teks: string): string {
  return teks.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
}

function formatRibuan(digit: string): string {
  return digit === "" ? "" : Number(digit).toLocaleString("id-ID");
}

export function InputAngka({
  id,
  name,
  label,
  nilai,
  onNilaiUbah,
  awalan,
  akhiran,
  helper,
  error,
  placeholder = "0",
  disabled,
  className,
}: {
  id: string;
  /** Diisi kalau form membaca nilainya lewat FormData. */
  name?: string;
  label?: string;
  /** Nilai awal berupa digit polos, misalnya "15000". */
  nilai?: string;
  onNilaiUbah?: (digit: string) => void;
  /** Ditempel di dalam kolom, misalnya "Rp". */
  awalan?: string;
  akhiran?: string;
  helper?: ReactNode;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [tampil, setTampil] = useState(() => formatRibuan(ambilDigit(nilai ?? "")));

  function ubah(e: ChangeEvent<HTMLInputElement>) {
    const kolom = e.target;
    const posisiLama = kolom.selectionStart ?? kolom.value.length;
    // Berapa digit yang ada di kiri kursor menentukan posisinya setelah
    // diformat ulang; tanpa ini kursor selalu melompat ke ujung kanan.
    const digitDiKiri = ambilDigit(kolom.value.slice(0, posisiLama)).length;

    const digit = ambilDigit(kolom.value);
    const baru = formatRibuan(digit);

    setTampil(baru);
    onNilaiUbah?.(digit);

    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      let terlihat = 0;
      let posisi = baru.length;
      for (let i = 0; i < baru.length; i += 1) {
        if (/\d/.test(baru[i])) terlihat += 1;
        if (terlihat === digitDiKiri) {
          posisi = i + 1;
          break;
        }
      }
      el.setSelectionRange(posisi, posisi);
    });
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      <div
        className={cn(
          "flex h-10 items-center rounded-card border border-border bg-card",
          "focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-ring",
          error && "border-destructive",
          disabled && "opacity-50",
        )}
      >
        {awalan && (
          <span className="pl-3 text-sm text-muted-foreground select-none">{awalan}</span>
        )}
        <input
          ref={ref}
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={tampil}
          onChange={ubah}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          className="h-full w-full bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {akhiran && (
          <span className="pr-3 text-sm whitespace-nowrap text-muted-foreground select-none">
            {akhiran}
          </span>
        )}
      </div>

      {/* Yang terkirim ke server tetap angka polos tanpa titik. */}
      {name && <input type="hidden" name={name} value={ambilDigit(tampil)} />}

      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        helper && <p className="text-xs text-muted-foreground">{helper}</p>
      )}
    </div>
  );
}

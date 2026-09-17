"use client";

import { useCallback, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconChevronBawah } from "./icons";
import { Field, kontrolDasar } from "./Input";
import {
  KELAS_PANEL_DAFTAR,
  TINGGI_DAFTAR_MAKS,
  kelasOpsiDaftar,
  perluBukaKeAtas,
  useAnimasiDaftarTurun,
  useTutupSaatKlikLuar,
} from "./daftarTurun";

export type OpsiPilih = { nilai: string; label: string };

/** Ketikan beruntun dianggap satu kata selama jedanya di bawah ini. */
const JEDA_KETIK_MS = 500;

/**
 * Daftar turun untuk pilihan yang sudah tetap — satuan, jenis biaya, kategori.
 *
 * Menggantikan `<select>` bawaan. Kotaknya memang sudah bisa disamakan, tapi
 * daftar opsi `<select>` digambar sistem operasi dan tidak bisa diberi gaya
 * sama sekali, jadi panel yang terbuka selalu terlihat datang dari aplikasi
 * lain dibanding pemilih bahan di form resep.
 *
 * Sengaja tanpa pencarian, beda dari `PilihBahan`. Daftar di sini pendek dan
 * tetap — 2 sampai 9 opsi yang tidak bertambah seiring pemakaian — jadi tidak
 * ada yang perlu disaring, dan kotak ketik hanya akan memanggil papan ketik
 * ponsel tanpa alasan. Yang menggantikan kegunaan itu adalah ketik-lompat:
 * menekan huruf melompat ke opsi yang diawali huruf tersebut, sama seperti
 * `<select>` asli.
 *
 * Mengikuti pola ARIA combobox yang hanya bisa dipilih: pemicunya tombol
 * ber-`role="combobox"` yang menunjuk panel `role="listbox"`, dan baris aktif
 * ditandai `aria-activedescendant` — bukan lewat fokus, supaya fokus tetap di
 * tombolnya.
 */
export function PilihOpsi({
  id,
  name,
  label,
  helper,
  error,
  className,
  opsi,
  nilai,
  nilaiAwal,
  onPilih,
  disabled,
  ariaLabel,
}: {
  id?: string;
  /** Diisi kalau nilainya perlu ikut terkirim lewat FormData. */
  name?: string;
  label?: string;
  helper?: ReactNode;
  error?: string;
  className?: string;
  opsi: OpsiPilih[];
  /** Isi untuk pemakaian terkendali. Kalau kosong, state-nya dipegang sendiri. */
  nilai?: string;
  /** Pilihan awal saat state-nya dipegang sendiri. */
  nilaiAwal?: string;
  onPilih?: (nilai: string) => void;
  disabled?: boolean;
  /** Dipakai kalau kontrolnya tidak punya `label` di atasnya. */
  ariaLabel?: string;
}) {
  // Pola yang sama dengan Tabs: terkendali kalau `nilai` diberikan, selain itu
  // state internal. Dua bentuk pemakaian itu sudah ada di form yang dipindah,
  // dan memaksakan salah satunya berarti mengubah form yang tidak bermasalah.
  const [internal, setInternal] = useState(nilaiAwal ?? opsi[0]?.nilai ?? "");
  const terpakai = nilai ?? internal;

  const [terbuka, setTerbuka] = useState(false);
  const [sorot, setSorot] = useState(0);
  const [keAtas, setKeAtas] = useState(false);

  const refWadah = useRef<HTMLDivElement>(null);
  const refDaftar = useRef<HTMLUListElement>(null);
  const ketikan = useRef({ kata: "", waktu: 0 });
  const idOtomatis = useId();
  const idKontrol = id ?? idOtomatis;
  const idDaftar = `${idKontrol}-daftar`;

  const terpilih = opsi.find((o) => o.nilai === terpakai);

  const tutup = useCallback(() => setTerbuka(false), []);
  useTutupSaatKlikLuar(terbuka, refWadah, tutup);
  useAnimasiDaftarTurun(terbuka, keAtas, refDaftar);

  function buka() {
    if (terbuka || disabled) return;
    setKeAtas(perluBukaKeAtas(refWadah.current));
    setSorot(Math.max(0, opsi.findIndex((o) => o.nilai === terpakai)));
    setTerbuka(true);
  }

  function pilih(nilaiBaru: string) {
    if (nilai === undefined) setInternal(nilaiBaru);
    onPilih?.(nilaiBaru);
    setTerbuka(false);
  }

  /** Lompat ke opsi pertama yang diawali huruf yang baru diketik. */
  function ketikLompat(huruf: string) {
    const sekarang = Date.now();
    const lanjutan = sekarang - ketikan.current.waktu < JEDA_KETIK_MS;
    const kata = (lanjutan ? ketikan.current.kata : "") + huruf.toLowerCase();
    ketikan.current = { kata, waktu: sekarang };

    const indeks = opsi.findIndex((o) => o.label.toLowerCase().startsWith(kata));
    if (indeks < 0) return;

    if (terbuka) setSorot(indeks);
    else pilih(opsi[indeks].nilai);
  }

  function tanganiTombol(peristiwa: KeyboardEvent<HTMLButtonElement>) {
    const { key } = peristiwa;

    if (key === "ArrowDown" || key === "ArrowUp") {
      peristiwa.preventDefault();
      if (!terbuka) return buka();
      setSorot((s) =>
        key === "ArrowDown" ? Math.min(s + 1, opsi.length - 1) : Math.max(s - 1, 0),
      );
      return;
    }

    if (key === "Home" || key === "End") {
      if (!terbuka) return;
      peristiwa.preventDefault();
      setSorot(key === "Home" ? 0 : opsi.length - 1);
      return;
    }

    if (key === "Enter" || key === " ") {
      // Selalu dicegah: Enter di tombol dalam <form> ikut mengirim formulirnya,
      // dan spasi menggulirkan halaman.
      peristiwa.preventDefault();
      if (!terbuka) return buka();
      const pilihan = opsi[sorot];
      if (pilihan) pilih(pilihan.nilai);
      return;
    }

    if (key === "Escape") {
      if (!terbuka) return;
      // Dihentikan di sini supaya Esc menutup panelnya saja. Tanpa ini peramban
      // ikut menutup <dialog> modal yang memuatnya.
      peristiwa.preventDefault();
      peristiwa.stopPropagation();
      tutup();
      return;
    }

    if (key === "Tab" && terbuka) {
      tutup();
      return;
    }

    // Huruf tunggal tanpa modifier: ketik-lompat ala <select> asli.
    if (key.length === 1 && !peristiwa.ctrlKey && !peristiwa.metaKey && !peristiwa.altKey) {
      peristiwa.preventDefault();
      ketikLompat(key);
    }
  }

  return (
    <Field label={label} helper={helper} error={error} htmlFor={idKontrol} className={className}>
      <div ref={refWadah} className="relative">
        <button
          id={idKontrol}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={terbuka}
          aria-controls={idDaftar}
          aria-activedescendant={terbuka && opsi[sorot] ? `${idDaftar}-${sorot}` : undefined}
          aria-label={ariaLabel}
          aria-invalid={error ? true : undefined}
          disabled={disabled}
          onClick={() => (terbuka ? tutup() : buka())}
          onKeyDown={tanganiTombol}
          className={cn(
            kontrolDasar,
            "flex items-center pr-9 text-left",
            error && "border-destructive",
            disabled && "cursor-not-allowed",
          )}
        >
          <span className="truncate">{terpilih?.label ?? ""}</span>
        </button>

        <IconChevronBawah
          width={16}
          height={16}
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground",
            "transition-transform duration-150 motion-reduce:transition-none",
            terbuka && "rotate-180",
            // Panah ikut meredup bersama kotaknya; `disabled:opacity-50` di
            // tombolnya tidak menjangkau ikon yang berada di luar tombol itu.
            disabled && "opacity-50",
          )}
        />

        {/* Tombol bukan kontrol formulir, jadi nilainya dititipkan di sini
            supaya form yang membaca lewat FormData tidak perlu diubah. */}
        {name && <input type="hidden" name={name} value={terpakai} />}

        {terbuka && (
          <ul
            ref={refDaftar}
            id={idDaftar}
            role="listbox"
            aria-label={ariaLabel ?? label}
            style={{
              maxHeight: TINGGI_DAFTAR_MAKS,
              transformOrigin: keAtas ? "bottom center" : "top center",
            }}
            className={cn(KELAS_PANEL_DAFTAR, keAtas ? "bottom-full mb-1" : "top-full mt-1")}
          >
            {opsi.map((o, i) => (
              <li
                key={o.nilai}
                id={`${idDaftar}-${i}`}
                role="option"
                aria-selected={o.nilai === terpakai}
                // pointerdown, bukan click: blur dari tombol terjadi lebih dulu
                // dan sempat menutup panelnya sebelum klik mendarat.
                onPointerDown={(e) => {
                  e.preventDefault();
                  pilih(o.nilai);
                }}
                onPointerEnter={() => setSorot(i)}
                className={kelasOpsiDaftar(i === sorot, o.nilai === terpakai)}
              >
                {o.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Field>
  );
}

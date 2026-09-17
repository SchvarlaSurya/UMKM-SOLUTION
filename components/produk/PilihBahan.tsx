"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type Ref } from "react";
import { cn } from "@/lib/cn";
import { IconCari } from "@/components/ui/icons";
import type { BahanBaku } from "@/lib/types";

/** Tinggi daftar dibatasi supaya 20+ bahan tidak memanjang sampai keluar layar. */
const TINGGI_DAFTAR_MAKS = 224;

/**
 * Pemilih bahan baku yang bisa diketik untuk menyaring.
 *
 * Menggantikan `<select>` bawaan di baris resep. Daftar opsi `<select>`
 * digambar peramban dan sistem operasi, jadi tingginya tidak bisa dibatasi dan
 * isinya tidak bisa disaring — pada 20+ bahan, satu-satunya cara menemukan
 * bahan adalah menggulir seluruh daftarnya.
 *
 * Mengikuti pola ARIA combobox: kotak ketik dengan `role="combobox"` yang
 * menunjuk daftar `role="listbox"`, dan penanda baris aktif lewat
 * `aria-activedescendant` — bukan lewat fokus, supaya ketikan tetap masuk ke
 * kotaknya.
 */
export function PilihBahan({
  bahan,
  nilai,
  onPilih,
  label,
  ref,
}: {
  /** Pilihan yang tersedia; pemanggil yang menyaring bahan terpakai. */
  bahan: BahanBaku[];
  nilai: number;
  onPilih: (bahanBakuId: number) => void;
  label: string;
  ref?: Ref<HTMLInputElement>;
}) {
  const [terbuka, setTerbuka] = useState(false);
  const [kueri, setKueri] = useState("");
  const [sorot, setSorot] = useState(0);
  const [keAtas, setKeAtas] = useState(false);

  const refWadah = useRef<HTMLDivElement>(null);
  const refDaftar = useRef<HTMLUListElement>(null);
  const idDaftar = useId();

  const terpilih = bahan.find((b) => b.id === nilai);
  const kunci = kueri.trim().toLowerCase();
  const hasil = kunci === "" ? bahan : bahan.filter((b) => b.nama.toLowerCase().includes(kunci));

  function buka() {
    if (terbuka) return;

    // Arah dibuka dihitung saat itu juga. Baris resep bisa berada di dasar
    // badan modal yang menggulir, dan `visualViewport` dipakai lebih dulu
    // karena papan ketik di ponsel mengecilkan ruang terlihat tanpa mengubah
    // innerHeight.
    const kotak = refWadah.current?.getBoundingClientRect();
    const tinggiTerlihat = window.visualViewport?.height ?? window.innerHeight;
    if (kotak) {
      const ruangBawah = tinggiTerlihat - kotak.bottom;
      setKeAtas(ruangBawah < TINGGI_DAFTAR_MAKS && kotak.top > ruangBawah);
    }

    setKueri("");
    setSorot(Math.max(0, hasil.findIndex((b) => b.id === nilai)));
    setTerbuka(true);
  }

  function tutup() {
    setTerbuka(false);
    setKueri("");
  }

  function pilih(bahanBakuId: number) {
    onPilih(bahanBakuId);
    tutup();
  }

  // Baris tersorot digulir ke dalam pandangan. `nearest` supaya daftarnya tidak
  // melompat saat barisnya sebenarnya sudah terlihat.
  useEffect(() => {
    if (!terbuka) return;
    const baris = refDaftar.current?.children[sorot];
    baris?.scrollIntoView({ block: "nearest" });
  }, [sorot, terbuka]);

  useEffect(() => {
    if (!terbuka) return;
    function tanganiKlikLuar(peristiwa: PointerEvent) {
      if (!refWadah.current?.contains(peristiwa.target as Node)) tutup();
    }
    document.addEventListener("pointerdown", tanganiKlikLuar);
    return () => document.removeEventListener("pointerdown", tanganiKlikLuar);
  }, [terbuka]);

  function tanganiTombol(peristiwa: KeyboardEvent<HTMLInputElement>) {
    if (peristiwa.key === "ArrowDown") {
      peristiwa.preventDefault();
      if (!terbuka) return buka();
      setSorot((s) => Math.min(s + 1, hasil.length - 1));
      return;
    }

    if (peristiwa.key === "ArrowUp") {
      peristiwa.preventDefault();
      if (!terbuka) return buka();
      setSorot((s) => Math.max(s - 1, 0));
      return;
    }

    if (peristiwa.key === "Enter") {
      // Selalu dicegah saat daftarnya terbuka: tanpa ini Enter ikut mengirim
      // formulir produk, bukan memilih bahan.
      if (!terbuka) return;
      peristiwa.preventDefault();
      const pilihan = hasil[sorot];
      if (pilihan) pilih(pilihan.id);
      return;
    }

    if (peristiwa.key === "Escape") {
      if (!terbuka) return;
      // Dihentikan di sini supaya Esc menutup daftarnya saja. Tanpa
      // preventDefault, peramban ikut menutup <dialog> modal produknya.
      peristiwa.preventDefault();
      peristiwa.stopPropagation();
      tutup();
      return;
    }

    if (peristiwa.key === "Tab" && terbuka) tutup();
  }

  return (
    <div ref={refWadah} className="relative">
      <div className="relative">
        <IconCari
          width={16}
          height={16}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
        />
        <input
          ref={ref}
          type="text"
          role="combobox"
          aria-expanded={terbuka}
          aria-controls={idDaftar}
          aria-autocomplete="list"
          aria-activedescendant={terbuka && hasil[sorot] ? `${idDaftar}-${hasil[sorot].id}` : undefined}
          aria-label={label}
          autoComplete="off"
          value={terbuka ? kueri : (terpilih?.nama ?? "")}
          placeholder={terbuka ? (terpilih?.nama ?? "Cari bahan…") : "Cari bahan…"}
          onChange={(e) => {
            setKueri(e.target.value);
            setSorot(0);
            if (!terbuka) setTerbuka(true);
          }}
          onFocus={buka}
          onClick={buka}
          onKeyDown={tanganiTombol}
          className="h-10 w-full rounded-card border border-border bg-card pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
        />
      </div>

      {terbuka && (
        <ul
          ref={refDaftar}
          id={idDaftar}
          role="listbox"
          aria-label={label}
          style={{ maxHeight: TINGGI_DAFTAR_MAKS }}
          className={cn(
            "absolute inset-x-0 z-20 overflow-y-auto rounded-card border border-border bg-card py-1 shadow-[0_10px_30px_rgba(32,46,40,0.16)]",
            keAtas ? "bottom-full mb-1" : "top-full mt-1",
          )}
        >
          {hasil.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              Tidak ada bahan yang cocok.
            </li>
          )}

          {hasil.map((b, i) => (
            <li
              key={b.id}
              id={`${idDaftar}-${b.id}`}
              role="option"
              aria-selected={b.id === nilai}
              // pointerdown, bukan click: blur dari kotak ketik terjadi lebih
              // dulu dan sempat menutup daftarnya sebelum klik mendarat.
              onPointerDown={(e) => {
                e.preventDefault();
                pilih(b.id);
              }}
              onPointerEnter={() => setSorot(i)}
              className={cn(
                "cursor-pointer px-3 py-2 text-sm",
                i === sorot ? "bg-muted text-foreground" : "text-foreground",
                b.id === nilai && "font-medium text-primary",
              )}
            >
              {b.nama}
              <span className="ml-1.5 text-xs text-muted-foreground">{b.satuan}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

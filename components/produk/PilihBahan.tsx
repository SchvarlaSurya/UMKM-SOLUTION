"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type Ref,
} from "react";
import { cn } from "@/lib/cn";
import { IconCari, IconChevronBawah } from "@/components/ui/icons";
import {
  KELAS_PANEL_DAFTAR,
  TINGGI_DAFTAR_MAKS,
  kelasOpsiDaftar,
  perluBukaKeAtas,
  useAnimasiDaftarTurun,
  useTutupSaatKlikLuar,
} from "@/components/ui/daftarTurun";
import type { BahanBaku } from "@/lib/types";

/**
 * Pemilih bahan baku yang bisa diketik untuk menyaring.
 *
 * Kembarannya yang tanpa pencarian adalah `PilihOpsi`; keduanya memakai rupa
 * panel, arah buka, dan animasi yang sama dari `daftarTurun`. Bedanya cuma satu
 * dan memang disengaja: daftar bahan tumbuh seiring pemakaian sampai puluhan,
 * jadi hanya di sini isinya perlu bisa disaring.
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

    setKeAtas(perluBukaKeAtas(refWadah.current));
    setKueri("");
    setSorot(Math.max(0, hasil.findIndex((b) => b.id === nilai)));
    setTerbuka(true);
  }

  const tutup = useCallback(() => {
    setTerbuka(false);
    setKueri("");
  }, []);

  function pilih(bahanBakuId: number) {
    onPilih(bahanBakuId);
    tutup();
  }

  useAnimasiDaftarTurun(terbuka, keAtas, refDaftar);
  useTutupSaatKlikLuar(terbuka, refWadah, tutup);

  // Baris tersorot digulir ke dalam pandangan. `nearest` supaya daftarnya tidak
  // melompat saat barisnya sebenarnya sudah terlihat.
  useEffect(() => {
    if (!terbuka) return;
    const baris = refDaftar.current?.children[sorot];
    baris?.scrollIntoView({ block: "nearest" });
  }, [sorot, terbuka]);

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
          className="h-10 w-full rounded-card border border-border bg-card pr-9 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
        />
        {/* Panah yang sama dengan <select> di seluruh form: penanda bersama
            bahwa kontrol ini membuka daftar. Kaca pembesar di kiri tetap ada
            karena menandai kemampuan yang hanya dimiliki kotak ini — isinya
            bisa diketik untuk menyaring. */}
        <IconChevronBawah
          width={16}
          height={16}
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground",
            "transition-transform duration-150 motion-reduce:transition-none",
            terbuka && "rotate-180",
          )}
        />
      </div>

      {terbuka && (
        <ul
          ref={refDaftar}
          id={idDaftar}
          role="listbox"
          aria-label={label}
          // Titik tumpu transform menempel di sisi yang berbatasan dengan kotak
          // ketik, jadi daftarnya membuka menjauh dari kotaknya, bukan dari
          // tengah dirinya sendiri.
          style={{
            maxHeight: TINGGI_DAFTAR_MAKS,
            transformOrigin: keAtas ? "bottom center" : "top center",
          }}
          className={cn(KELAS_PANEL_DAFTAR, keAtas ? "bottom-full mb-1" : "top-full mt-1")}
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
              className={kelasOpsiDaftar(i === sorot, b.id === nilai)}
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

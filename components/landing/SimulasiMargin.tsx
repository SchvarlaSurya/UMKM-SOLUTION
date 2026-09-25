"use client";

import { useEffect, useRef, useState } from "react";
import { AngkaBergerak } from "@/components/ui/AngkaBergerak";
import { Button } from "@/components/ui/Button";
import { InputAngka } from "@/components/ui/InputAngka";
import { cn } from "@/lib/cn";
import { formatRupiah } from "@/lib/format";
import {
  ALOKASI_TETAP,
  AYAM_MAKS,
  AYAM_MIN,
  ISIAN_AWAL,
  hitungSimulasi,
  targetTercapai,
  type HasilSimulasi,
  type IsianSimulasi,
  type KolomSimulasi,
} from "@/lib/simulasiLanding";

/**
 * Simulasi satu porsi nasi ayam untuk pengunjung yang belum punya akun.
 * Rumus dan asumsinya ada di lib/simulasiLanding.ts. Tidak ada yang disimpan
 * ke server.
 */

/**
 * Jeda sebelum hasil dihitung ulang dari ketikan. Tanpa jeda, mengetik
 * "55000" melewati "5", "55", ... yang semuanya di luar rentang, dan pesan
 * galat berkedip serta dibacakan ulang di setiap tombol.
 */
const JEDA_HITUNG = 150;

function StatusMargin({ hasil }: { hasil: Extract<HasilSimulasi, { sah: true }> }) {
  const { margin, target } = hasil;
  const [teks, kelas] =
    margin < 0
      ? ["Harga jual belum menutup HPP", "border-destructive/30 bg-destructive/5 text-destructive"]
      : targetTercapai(margin, target)
        ? [`Target ${target}% tercapai`, "border-success-border bg-card text-success"]
        : [`Di bawah target ${target}%`, "border-warning-border bg-warning-bg text-warning"];

  return (
    <p
      className={cn(
        "mt-4 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors duration-300",
        kelas,
      )}
    >
      {teks}
    </p>
  );
}

export function SimulasiMargin() {
  // `isian` mengikuti ketikan seketika; `isianHitung` yang dipakai menghitung
  // hasil dan baru menyusul setelah ketikan berhenti sejenak.
  const [isian, setIsian] = useState<IsianSimulasi>(ISIAN_AWAL);
  const [isianHitung, setIsianHitung] = useState<IsianSimulasi>(ISIAN_AWAL);
  const refJeda = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // InputAngka hanya membaca nilai awalnya sekali. Saat nilai diubah dari luar
  // (geser slider, tombol pakai harga, atau reset), kolomnya dipasang ulang
  // lewat key supaya tampilannya ikut berganti.
  const [versi, setVersi] = useState({ ayam: 0, jual: 0, semua: 0 });

  useEffect(() => () => clearTimeout(refJeda.current), []);

  const hasil = hitungSimulasi(isianHitung);

  function galat(kolom: KolomSimulasi) {
    return !hasil.sah && hasil.kolom === kolom ? hasil.pesan : undefined;
  }

  function ketik(kolom: KolomSimulasi, nilai: string) {
    const baru = { ...isian, [kolom]: nilai };
    setIsian(baru);
    clearTimeout(refJeda.current);
    refJeda.current = setTimeout(() => setIsianHitung(baru), JEDA_HITUNG);
  }

  /** Perubahan dari slider atau tombol langsung dihitung, tanpa jeda. */
  function setelLangsung(baru: IsianSimulasi) {
    clearTimeout(refJeda.current);
    setIsian(baru);
    setIsianHitung(baru);
  }

  function geserAyam(nilai: string) {
    setelLangsung({ ...isian, ayam: nilai });
    setVersi((v) => ({ ...v, ayam: v.ayam + 1 }));
  }

  function pakaiRekomendasi() {
    if (!hasil.sah) return;
    setelLangsung({ ...isian, jual: String(hasil.rekomendasi) });
    setVersi((v) => ({ ...v, jual: v.jual + 1 }));
  }

  function kembalikan() {
    setelLangsung(ISIAN_AWAL);
    setVersi((v) => ({ ...v, semua: v.semua + 1 }));
  }

  const nilaiSlider = Math.min(AYAM_MAKS, Math.max(AYAM_MIN, Number(isian.ayam) || AYAM_MIN));

  return (
    <>
      <div
        id="simulasi"
        className="scroll-mt-20 rounded-2xl border border-border bg-card"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-6 sm:p-7">
          <div>
            <span className="mb-3 inline-block text-xs font-semibold tracking-wider text-primary">
              03 · SIMULASI DAMPAK
            </span>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              Kalau harga ayam naik?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Ubah angkanya. Lihat dampaknya pada satu porsi nasi ayam.
            </p>
          </div>
          <span className="text-sm text-muted-foreground">Data contoh · tidak disimpan</span>
        </div>

        <div className="grid lg:grid-cols-2">
          <form
            className="min-w-0 p-6 sm:p-8"
            noValidate
            onSubmit={(e) => e.preventDefault()}
          >
            <fieldset className="flex min-w-0 flex-col gap-5">
              <legend className="mb-5 font-semibold text-foreground">Sesuaikan contoh hitungan</legend>

              <div>
                <InputAngka
                  key={`ayam-${versi.ayam}-${versi.semua}`}
                  id="sim-ayam"
                  label="Harga ayam per kg"
                  awalan="Rp"
                  nilai={isian.ayam}
                  onNilaiUbah={(d) => ketik("ayam", d)}
                  helper="100 gram ayam per porsi. Bahan lain tetap Rp 6.500."
                  error={galat("ayam")}
                />
                <input
                  type="range"
                  min={AYAM_MIN}
                  max={AYAM_MAKS}
                  step={500}
                  value={nilaiSlider}
                  onChange={(e) => geserAyam(e.target.value)}
                  aria-label="Geser harga ayam per kilogram"
                  className="mt-3 h-6 w-full cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Rp 40.000</span>
                  <span>Rp 60.000</span>
                </div>
              </div>

              <InputAngka
                key={`jual-${versi.jual}-${versi.semua}`}
                id="sim-jual"
                label="Harga jual per porsi"
                awalan="Rp"
                nilai={isian.jual}
                onNilaiUbah={(d) => ketik("jual", d)}
                error={galat("jual")}
              />

              <InputAngka
                key={`target-${versi.semua}`}
                id="sim-target"
                label="Target margin"
                akhiran="%"
                nilai={isian.target}
                onNilaiUbah={(d) => ketik("target", d)}
                helper="Margin dihitung dari harga jual. Target 0–80%."
                error={galat("target")}
              />

              <Button type="button" varian="secondary" className="self-start" onClick={kembalikan}>
                Kembalikan contoh
              </Button>
            </fieldset>
          </form>

          <div
            className="min-w-0 rounded-b-2xl bg-accent p-6 sm:p-8 lg:rounded-bl-none"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="text-sm text-muted-foreground">
              {hasil.sah ? (
                "Hasil simulasi per porsi"
              ) : (
                <>
                  Lengkapi isian untuk menghitung ulang
                  {/* Pesan yang sama tampil di bawah kolomnya; di sini supaya
                      ikut diumumkan bersama panel hasil. */}
                  <span className="sr-only">. {hasil.pesan}</span>
                </>
              )}
            </span>

            <div className="mt-3 grid grid-cols-2 gap-5 tabular-nums">
              <div>
                <small className="mb-1.5 block text-sm text-muted-foreground">HPP terhitung</small>
                <strong className="block text-2xl font-semibold tracking-tight break-words text-primary sm:text-3xl">
                  {hasil.sah ? <AngkaBergerak nilai={hasil.hpp} format="rupiah" /> : "—"}
                </strong>
              </div>
              <div>
                <small className="mb-1.5 block text-sm text-muted-foreground">Margin aktual</small>
                <strong className="block text-2xl font-semibold tracking-tight break-words text-primary sm:text-3xl">
                  {hasil.sah ? <AngkaBergerak nilai={hasil.margin} format="persen" /> : "—"}
                </strong>
              </div>
            </div>

            {hasil.sah && <StatusMargin hasil={hasil} />}

            <dl className="my-6 text-sm tabular-nums">
              {[
                ["Total bahan", hasil.sah ? formatRupiah(hasil.bahan) : "—"],
                ["Alokasi biaya tetap", formatRupiah(ALOKASI_TETAP)],
                ["Selisih harga jual dan HPP", hasil.sah ? formatRupiah(hasil.selisih) : "—"],
              ].map(([label, nilai]) => (
                <div
                  key={label}
                  className="flex flex-wrap justify-between gap-1.5 border-b border-success-border py-2.5"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium text-foreground">{nilai}</dd>
                </div>
              ))}
            </dl>

            <div className="border-t border-success-border pt-5">
              <span className="mb-2 inline-block text-xs font-semibold tracking-wider text-primary">
                04 · HARGA DARI TARGET MARGIN
              </span>
              <h4 className="font-semibold text-foreground">Harga jual yang memenuhi target</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Mengikuti HPP dan targetmu, dibulatkan ke atas ke kelipatan Rp 500.
              </p>
              <output
                htmlFor="sim-ayam sim-target"
                className="my-3 block text-3xl font-semibold tracking-tight text-primary tabular-nums"
              >
                {hasil.sah ? formatRupiah(hasil.rekomendasi) : "—"}
              </output>
              <Button
                type="button"
                className="h-11 w-full"
                disabled={!hasil.sah || Number(isian.jual) === hasil.rekomendasi}
                onClick={pakaiRekomendasi}
              >
                Pakai harga ini di simulasi
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-7 grid gap-6 border-t border-border pt-8 sm:grid-cols-[1.4fr_1fr] sm:items-center">
        <div>
          <span className="mb-3 inline-block text-xs font-semibold tracking-wider text-primary">
            05 · KALKULATOR TITIK IMPAS
          </span>
          <h3 className="text-2xl font-semibold tracking-tight text-foreground">
            Tahu berapa porsi yang perlu terjual.
          </h3>
          <p className="mt-2.5 text-muted-foreground">
            Dengan biaya tetap Rp 1.800.000 per bulan, hitung kebutuhan penjualan untuk menutupnya.
            Hasil mengikuti harga dan biaya pada simulasi di atas.
          </p>
        </div>
        <div className="rounded-card border border-border bg-card p-6 tabular-nums" aria-live="polite">
          <strong className="block text-4xl font-semibold tracking-tighter whitespace-nowrap text-primary sm:text-5xl">
            {!hasil.sah ? (
              "—"
            ) : hasil.titikImpas !== null ? (
              <>
                {hasil.titikImpas.toLocaleString("id-ID")}
                <span className="ml-2 text-xl tracking-tight text-muted-foreground">porsi</span>
              </>
            ) : (
              <span className="text-2xl tracking-tight">Belum tercapai</span>
            )}
          </strong>
          <span className="text-sm text-muted-foreground">per bulan untuk menutup biaya tetap</span>
          <p className="mt-2.5 text-sm text-foreground">
            {!hasil.sah
              ? "Periksa kolom yang ditandai."
              : hasil.titikImpas !== null
                ? `Kontribusi setiap porsi: ${formatRupiah(hasil.kontribusi)}.`
                : "Harga jual harus lebih tinggi dari biaya bahan untuk menutup biaya tetap."}
          </p>
        </div>
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import { AngkaBergerak } from "@/components/ui/AngkaBergerak";
import { Button } from "@/components/ui/Button";
import { InputAngka } from "@/components/ui/InputAngka";
import { cn } from "@/lib/cn";
import { formatRupiah } from "@/lib/format";

/**
 * Simulasi satu porsi nasi ayam untuk pengunjung yang belum punya akun.
 *
 * Asumsinya dikunci supaya angka di halaman selalu bisa dicocokkan dengan
 * rincian di bawahnya: 100 gram ayam, bahan lain Rp6.500, dan alokasi biaya
 * tetap Rp1.500 per porsi (Rp1.800.000 dibagi 1.200 porsi). Tidak ada yang
 * disimpan ke server.
 */

const GRAM_AYAM = 0.1;
const BAHAN_LAIN = 6_500;
const ALOKASI_TETAP = 1_500;
const BIAYA_TETAP_BULANAN = 1_800_000;
const KELIPATAN_HARGA = 500;

const AYAM_MIN = 40_000;
const AYAM_MAKS = 60_000;

const AWAL = { ayam: "55000", jual: "20000", target: "40" };

type Isian = typeof AWAL;

type Hasil =
  | { sah: false; pesan: string }
  | {
      sah: true;
      bahan: number;
      hpp: number;
      selisih: number;
      margin: number;
      target: number;
      rekomendasi: number;
      kontribusi: number;
    };

function hitung(isian: Isian): Hasil {
  const ayam = Number(isian.ayam);
  const jual = Number(isian.jual);
  const target = Number(isian.target);

  if (isian.ayam === "" || ayam < AYAM_MIN || ayam > AYAM_MAKS) {
    return { sah: false, pesan: "Isi harga ayam antara Rp 40.000 dan Rp 60.000." };
  }
  if (isian.jual === "" || jual < 1_000 || jual > 1_000_000) {
    return { sah: false, pesan: "Isi harga jual antara Rp 1.000 dan Rp 1.000.000." };
  }
  if (isian.target === "" || target > 80) {
    return { sah: false, pesan: "Isi target margin dengan angka bulat dari 0 sampai 80." };
  }

  const bahan = ayam * GRAM_AYAM + BAHAN_LAIN;
  const hpp = bahan + ALOKASI_TETAP;
  const selisih = jual - hpp;
  // Pengurang kecil menahan galat pembulatan float supaya harga yang tepat di
  // kelipatan tidak naik satu tingkat.
  const rekomendasi =
    Math.ceil((hpp / (1 - target / 100) - 1e-8) / KELIPATAN_HARGA) * KELIPATAN_HARGA;

  return {
    sah: true,
    bahan,
    hpp,
    selisih,
    margin: (selisih / jual) * 100,
    target,
    rekomendasi,
    kontribusi: jual - bahan,
  };
}

function StatusMargin({ hasil }: { hasil: Extract<Hasil, { sah: true }> }) {
  const { margin, target } = hasil;
  const [teks, kelas] =
    margin < 0
      ? ["Harga jual belum menutup HPP", "border-destructive/30 bg-destructive/5 text-destructive"]
      : margin + 1e-8 >= target
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
  const [isian, setIsian] = useState<Isian>(AWAL);
  // InputAngka hanya membaca nilai awalnya sekali. Saat nilai diubah dari luar
  // (geser slider, tombol pakai harga, atau reset), kolomnya dipasang ulang
  // lewat key supaya tampilannya ikut berganti.
  const [versi, setVersi] = useState({ ayam: 0, jual: 0, semua: 0 });

  const hasil = hitung(isian);

  function ubah(kolom: keyof Isian, nilai: string) {
    setIsian((lama) => ({ ...lama, [kolom]: nilai }));
  }

  function geserAyam(nilai: string) {
    ubah("ayam", nilai);
    setVersi((v) => ({ ...v, ayam: v.ayam + 1 }));
  }

  function pakaiRekomendasi() {
    if (!hasil.sah) return;
    ubah("jual", String(hasil.rekomendasi));
    setVersi((v) => ({ ...v, jual: v.jual + 1 }));
  }

  function kembalikan() {
    setIsian(AWAL);
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
                  onNilaiUbah={(d) => ubah("ayam", d)}
                  helper="100 gram ayam per porsi. Bahan lain tetap Rp 6.500."
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
                onNilaiUbah={(d) => ubah("jual", d)}
              />

              <InputAngka
                key={`target-${versi.semua}`}
                id="sim-target"
                label="Target margin"
                akhiran="%"
                nilai={isian.target}
                onNilaiUbah={(d) => ubah("target", d)}
                helper="Margin dihitung dari harga jual. Target 0–80%."
              />

              {!hasil.sah && (
                <p
                  role="alert"
                  className="rounded-card border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                >
                  {hasil.pesan}
                </p>
              )}

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
              {hasil.sah ? "Hasil simulasi per porsi" : "Lengkapi isian untuk menghitung ulang"}
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
            ) : hasil.kontribusi > 0 ? (
              <>
                {Math.ceil(BIAYA_TETAP_BULANAN / hasil.kontribusi).toLocaleString("id-ID")}
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
              : hasil.kontribusi > 0
                ? `Kontribusi setiap porsi: ${formatRupiah(hasil.kontribusi)}.`
                : "Harga jual harus lebih tinggi dari biaya bahan untuk menutup biaya tetap."}
          </p>
        </div>
      </div>
    </>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconPanahKanan, IconPanahNaik, IconPanahTurun, IconTren } from "@/components/ui/icons";
import { formatPersen, formatRupiah, formatTanggalPendek } from "@/lib/format";
import type { TitikHarga } from "@/lib/data";
import type { BahanBaku } from "@/lib/types";
import { GrafikHarga } from "./GrafikHarga";

export function WidgetHargaBahan({
  bahan,
  deret,
}: {
  bahan: BahanBaku[];
  deret: Record<number, TitikHarga[]>;
}) {
  const [bahanId, setBahanId] = useState(bahan[0]?.id ?? 0);
  const bahanTerpilih = bahan.find((b) => b.id === bahanId);

  const data = useMemo(
    () =>
      (deret[bahanId] ?? []).map((titik) => ({
        label: formatTanggalPendek(titik.tanggal),
        harga: titik.harga,
      })),
    [deret, bahanId],
  );

  // Tanpa satu pun catatan harga, kartu ini hanya akan memperlihatkan "Rp 0"
  // dan grafik kosong yang tidak menjelaskan apa-apa.
  if (bahan.length === 0) {
    return (
      <Card className="flex h-full flex-col">
        <CardHeader className="flex-col items-stretch">
          <div>
            <CardTitle>Pergerakan harga bahan</CardTitle>
            <CardDescription className="mt-1">Belum ada catatan perubahan</CardDescription>
          </div>
        </CardHeader>
        <div className="flex flex-1 items-center px-5 py-5">
          <EmptyState
            ikon={<IconTren />}
            judul="Grafik muncul setelah harga berubah"
            deskripsi="Setiap kali kamu memperbarui harga sebuah bahan, perubahannya tercatat otomatis di sini."
            className="w-full border-0 bg-transparent py-6"
          />
        </div>
      </Card>
    );
  }

  const hargaAwal = data[0]?.harga ?? 0;
  const hargaAkhir = data.at(-1)?.harga ?? 0;
  const perubahan = hargaAwal === 0 ? 0 : ((hargaAkhir - hargaAwal) / hargaAwal) * 100;
  const naik = perubahan > 0;
  const turun = perubahan < 0;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-start">
        <div>
          <CardTitle>Pergerakan harga bahan</CardTitle>
          <CardDescription className="mt-1">
            Harga per {bahanTerpilih?.satuan ?? "satuan"} · 30 hari terakhir
          </CardDescription>
        </div>
        <label className="sm:ml-auto">
          <span className="sr-only">Pilih bahan baku</span>
          <select
            value={bahanId}
            onChange={(e) => setBahanId(Number(e.target.value))}
            className="h-9 rounded-card border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
          >
            {bahan.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nama}
              </option>
            ))}
          </select>
        </label>
      </CardHeader>

      <div className="px-5 pt-4">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight text-foreground">
            {formatRupiah(hargaAkhir)}
          </span>
          {perubahan !== 0 && (
            <span
              className={`inline-flex items-center gap-1 text-sm font-medium ${
                naik ? "text-warning" : "text-success"
              }`}
            >
              {naik ? (
                <IconPanahNaik width={14} height={14} />
              ) : (
                <IconPanahTurun width={14} height={14} />
              )}
              {formatPersen(Math.abs(perubahan))}
            </span>
          )}
          {!naik && !turun && <span className="text-sm text-muted-foreground">Stabil</span>}
        </div>
      </div>

      <div className="mt-2 h-48 w-full px-2 pb-2">
        <GrafikHarga data={data} gradientId="gradienWidgetHarga" />
      </div>

      <div className="mt-auto border-t border-border px-5 py-3">
        <Link
          href="/tren-harga"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4"
        >
          Lihat tren
          <IconPanahKanan width={14} height={14} />
        </Link>
      </div>
    </Card>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconPanahKanan, IconPanahNaik, IconPanahTurun, IconTren } from "@/components/ui/icons";
import { PilihBahan } from "@/components/produk/PilihBahan";
import { formatPersen, formatRupiah } from "@/lib/format";
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

  const catatan = useMemo(() => deret[bahanId] ?? [], [deret, bahanId]);

  // Sama dengan halaman Tren harga: titik pertama grafik adalah harga sebelum
  // perubahan pertama, supaya satu perubahan tergambar sebagai garis naik/turun.
  const data = useMemo(
    () =>
      catatan.length === 0
        ? []
        : [
            {
              waktu: new Date(catatan[0].tanggal).getTime(),
              harga: catatan[0].hargaLama,
              label: { sumbu: "Awal", tooltip: "Sebelum perubahan pertama" },
            },
            ...catatan.map((titik) => ({
              waktu: new Date(titik.tanggal).getTime(),
              harga: titik.harga,
            })),
          ],
    [catatan],
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

  // Baseline = harga sebelum perubahan pertama, sama dengan HalamanTren.
  const hargaAwal = catatan[0]?.hargaLama ?? 0;
  const hargaAkhir = catatan.at(-1)?.harga ?? 0;
  const stabil = hargaAkhir === hargaAwal;
  const naik = hargaAkhir > hargaAwal;
  const perubahan = hargaAwal === 0 ? 0 : ((hargaAkhir - hargaAwal) / hargaAwal) * 100;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-start">
        <div>
          <CardTitle>Pergerakan harga bahan</CardTitle>
          <CardDescription className="mt-1">
            Harga per {bahanTerpilih?.satuan ?? "satuan"} · 30 hari terakhir
          </CardDescription>
        </div>
        {/* Lebar dipatok di pembungkusnya, bukan mengikuti nama bahan
            terpanjang seperti <select> dulu: kotak yang berubah lebar tiap
            ganti bahan menggeser judul kartu di sebelahnya. */}
        <div className="w-full sm:ml-auto sm:w-56">
          <PilihBahan
            bahan={bahan}
            nilai={bahanId}
            onPilih={setBahanId}
            label="Pilih bahan baku"
          />
        </div>
      </CardHeader>

      <div className="px-5 pt-4">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight text-foreground">
            {formatRupiah(hargaAkhir)}
          </span>
          {!stabil && (
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
          {stabil && <span className="text-sm text-muted-foreground">Stabil</span>}
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

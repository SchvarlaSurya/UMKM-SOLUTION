"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { IconPanahKanan, IconPanahNaik, IconPanahTurun } from "@/components/ui/icons";
import { formatPersen, formatRupiah, formatTanggalPendek } from "@/lib/format";
import type { TitikHarga } from "@/lib/data";
import type { BahanBaku } from "@/lib/types";

/** Ringkas angka sumbu Y: 65000 -> "65rb". */
function ringkasRibuan(nilai: number): string {
  return nilai >= 1000 ? `${(nilai / 1000).toLocaleString("id-ID")}rb` : String(nilai);
}

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
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
            <defs>
              <linearGradient id="gradienHarga" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <YAxis
              width={46}
              tickLine={false}
              axisLine={false}
              domain={["dataMin - 2000", "dataMax + 2000"]}
              tickFormatter={ringkasRibuan}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <Tooltip
              formatter={(nilai) => [formatRupiah(Number(nilai)), "Harga"]}
              contentStyle={{
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="harga"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#gradienHarga)"
            />
          </AreaChart>
        </ResponsiveContainer>
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

"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatRupiah } from "@/lib/format";

export type TitikGrafik = { label: string; harga: number };

/** Ringkas angka sumbu Y: 65000 -> "65rb". */
function ringkasRibuan(nilai: number): string {
  return nilai >= 1000 ? `${(nilai / 1000).toLocaleString("id-ID")}rb` : String(nilai);
}

/** Grafik area harga bahan; dipakai widget dashboard dan halaman tren. */
export function GrafikHarga({
  data,
  gradientId = "gradienHarga",
}: {
  data: TitikGrafik[];
  gradientId?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
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
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

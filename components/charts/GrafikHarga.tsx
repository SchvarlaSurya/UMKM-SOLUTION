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

export type TitikGrafik = {
  /** Waktu perubahan dalam milidetik, dipakai sebagai posisi sumbu X. */
  waktu: number;
  harga: number;
};

/** Ringkas angka sumbu Y: 65000 -> "65rb". */
function ringkasRibuan(nilai: number): string {
  return nilai >= 1000 ? `${(nilai / 1000).toLocaleString("id-ID")}rb` : String(nilai);
}

function tanggalPendek(waktu: number): string {
  return new Date(waktu).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function tanggalDanJam(waktu: number): string {
  return new Date(waktu).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Grafik area harga bahan; dipakai widget dashboard dan halaman tren.
 *
 * Sumbu X memakai skala waktu, bukan label tanggal sebagai kategori. Dengan
 * kategori, dua perubahan harga pada hari yang sama akan berbagi satu posisi X:
 * titiknya bertumpuk dan tooltip menyebut nilai perubahan pertama meski garis
 * sudah naik ke perubahan berikutnya.
 */
export function GrafikHarga({
  data,
  gradientId = "gradienHarga",
}: {
  data: TitikGrafik[];
  gradientId?: string;
}) {
  // Beberapa perubahan di hari yang sama hanya bisa dibedakan lewat jamnya.
  const adaHariKembar =
    new Set(data.map((titik) => tanggalPendek(titik.waktu))).size !== data.length;

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
          dataKey="waktu"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          tickLine={false}
          axisLine={false}
          tickFormatter={tanggalPendek}
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
          labelFormatter={(waktu) =>
            adaHariKembar ? tanggalDanJam(Number(waktu)) : tanggalPendek(Number(waktu))
          }
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
          dot={data.length <= 12 ? { r: 2.5, strokeWidth: 0, fill: "var(--primary)" } : false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

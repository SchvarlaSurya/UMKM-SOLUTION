"use client";

import { useMemo } from "react";
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
  /** Waktu perubahan dalam milidetik. */
  waktu: number;
  harga: number;
};

/**
 * Seberapa lebar jeda tersempit dibanding jeda terlebar. 0,35 berarti dua
 * perubahan berselang satu jam tetap mendapat 35% lebar dari jeda terlama,
 * cukup untuk dibaca dan disorot satu per satu.
 */
const LEBAR_JEDA_MINIMUM = 0.35;

/** Banyak label tanggal maksimum sebelum sumbu X mulai berdesakan. */
const TICK_MAKSIMUM = 6;

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

type TitikTerplot = TitikGrafik & { posisi: number };

/**
 * Ubah waktu jadi posisi sumbu X yang menjamin jarak minimum antar titik.
 *
 * Skala waktu murni membuat perubahan yang berselang beberapa jam menempel
 * jadi satu gumpalan ketika deretnya juga memuat jeda berminggu-minggu. Di
 * sini tiap jeda dipetakan ke rentang LEBAR_JEDA_MINIMUM sampai 1, jadi yang
 * rapat tetap terbaca sementara urutan dan perbandingan kasar antar jeda
 * masih terlihat.
 */
function hitungPosisi(data: TitikGrafik[]): TitikTerplot[] {
  if (data.length <= 1) return data.map((titik, i) => ({ ...titik, posisi: i }));

  const jeda = data.slice(1).map((titik, i) => Math.max(0, titik.waktu - data[i].waktu));
  const jedaTerlama = Math.max(...jeda);

  let berjalan = 0;
  const hasil: TitikTerplot[] = [{ ...data[0], posisi: 0 }];

  jeda.forEach((selisih, i) => {
    // Kalau semua perubahan terjadi pada detik yang sama, bagi rata.
    const bagian = jedaTerlama > 0 ? selisih / jedaTerlama : 1;
    berjalan += LEBAR_JEDA_MINIMUM + (1 - LEBAR_JEDA_MINIMUM) * bagian;
    hasil.push({ ...data[i + 1], posisi: berjalan });
  });

  return hasil;
}

/** Ambil paling banyak TICK_MAKSIMUM titik, selalu termasuk yang pertama dan terakhir. */
function pilihTick(titik: TitikTerplot[]): number[] {
  if (titik.length <= TICK_MAKSIMUM) return titik.map((t) => t.posisi);

  const langkah = (titik.length - 1) / (TICK_MAKSIMUM - 1);
  return Array.from({ length: TICK_MAKSIMUM }, (_, i) => titik[Math.round(i * langkah)].posisi);
}

/** Grafik area harga bahan; dipakai widget dashboard dan halaman tren. */
export function GrafikHarga({
  data,
  gradientId = "gradienHarga",
}: {
  data: TitikGrafik[];
  gradientId?: string;
}) {
  const titik = useMemo(() => hitungPosisi(data), [data]);

  // Beberapa perubahan di hari yang sama hanya bisa dibedakan lewat jamnya.
  const adaHariKembar =
    new Set(data.map((t) => tanggalPendek(t.waktu))).size !== data.length;

  const waktuDariPosisi = useMemo(() => {
    const peta = new Map<number, number>();
    for (const t of titik) peta.set(t.posisi, t.waktu);
    return peta;
  }, [titik]);

  function labelWaktu(posisi: number, panjang: boolean): string {
    const waktu = waktuDariPosisi.get(posisi);
    if (waktu === undefined) return "";
    return panjang && adaHariKembar ? tanggalDanJam(waktu) : tanggalPendek(waktu);
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={titik} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="posisi"
          type="number"
          domain={["dataMin", "dataMax"]}
          ticks={pilihTick(titik)}
          tickLine={false}
          axisLine={false}
          tickFormatter={(posisi: number) => labelWaktu(posisi, false)}
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
          labelFormatter={(posisi) => labelWaktu(Number(posisi), true)}
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
          dot={titik.length <= 12 ? { r: 2.5, strokeWidth: 0, fill: "var(--primary)" } : false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

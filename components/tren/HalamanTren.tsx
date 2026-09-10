"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GrafikHarga } from "@/components/charts/GrafikHarga";
import { Badge } from "@/components/ui/Badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, TBody, TD, TH, THead, TR, TableFooterNote } from "@/components/ui/Table";
import {
  IconPanahKanan,
  IconPanahNaik,
  IconPanahTurun,
  IconTren,
} from "@/components/ui/icons";
import { formatPersen, formatRupiah, formatTanggal, formatTanggalPendek } from "@/lib/format";
import type { BahanBaku, HistoriHarga } from "@/lib/types";
import type { TrendResult } from "@/lib/trendAnalyzer";

export function HalamanTren({
  bahan,
  histori,
  pemakaian,
  tren,
}: {
  bahan: BahanBaku[];
  histori: Record<number, HistoriHarga[]>;
  pemakaian: Record<number, number>;
  tren: Record<number, TrendResult>;
}) {
  const [bahanId, setBahanId] = useState(bahan[0]?.id ?? 0);
  const bahanTerpilih = bahan.find((b) => b.id === bahanId);

  // Histori sudah urut naik dari lapisan data; salin sebelum dibalik.
  const catatan = useMemo(() => [...(histori[bahanId] ?? [])], [histori, bahanId]);

  const dataGrafik = useMemo(
    () =>
      catatan.map((h) => ({
        label: formatTanggalPendek(h.tanggal),
        harga: h.hargaBaru,
      })),
    [catatan],
  );

  if (!bahanTerpilih) {
    return (
      <>
        <PageHeader
          label="Pantau perubahan"
          judul="Tren harga bahan"
          subjudul="Lihat perubahan harga sebelum margin ikut berubah."
        />
        <EmptyState
          ikon={<IconTren />}
          judul="Belum ada catatan perubahan harga"
          deskripsi="Histori terisi otomatis setiap kali harga sebuah bahan baku diperbarui."
        />
      </>
    );
  }

  const hargaAwal = catatan[0]?.hargaBaru ?? 0;
  const hargaAkhir = catatan.at(-1)?.hargaBaru ?? 0;
  const perubahan = hargaAwal === 0 ? 0 : ((hargaAkhir - hargaAwal) / hargaAwal) * 100;
  const naik = perubahan > 0;
  const statusTren = tren[bahanId];

  return (
    <>
      <PageHeader
        label="Pantau perubahan"
        judul="Tren harga bahan"
        subjudul="Lihat perubahan harga sebelum margin ikut berubah."
      />

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Histori harga bahan baku</CardTitle>
            <CardDescription className="mt-1">
              {catatan.length > 0
                ? `${formatTanggal(catatan[0].tanggal)} – ${formatTanggal(catatan.at(-1)!.tanggal)}`
                : "Belum ada data"}
            </CardDescription>
          </div>
          <label>
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

        <div className="grid gap-4 px-5 pt-5 sm:grid-cols-3">
          <div className="rounded-card border border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Harga saat ini / {bahanTerpilih.satuan}
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {formatRupiah(hargaAkhir)}
            </p>
          </div>

          <div className="rounded-card border border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">Perubahan sejak awal histori</p>
            <p
              className={`mt-1 flex items-center gap-1 text-xl font-semibold ${
                perubahan === 0 ? "text-foreground" : naik ? "text-warning" : "text-success"
              }`}
            >
              {perubahan !== 0 &&
                (naik ? (
                  <IconPanahNaik width={16} height={16} />
                ) : (
                  <IconPanahTurun width={16} height={16} />
                ))}
              {perubahan === 0 ? "Stabil" : formatPersen(Math.abs(perubahan))}
            </p>
          </div>

          <div className="rounded-card border border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">Produk terkait</p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {pemakaian[bahanId] ?? 0} produk
            </p>
          </div>
        </div>

        {statusTren?.status === "tren_naik" && (
          <div className="px-5 pt-4">
            <Badge varian="warning" ikon={<IconPanahNaik width={13} height={13} />}>
              Tiga perubahan terakhir naik berturut-turut
            </Badge>
          </div>
        )}

        <div className="mt-2 h-64 w-full px-3 pb-4">
          <GrafikHarga data={dataGrafik} gradientId="gradienTrenHarga" />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catatan perubahan · {bahanTerpilih.nama}</CardTitle>
          <Link
            href="/bahan-baku"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4"
          >
            Perbarui harga
            <IconPanahKanan width={14} height={14} />
          </Link>
        </CardHeader>

        <div className="mt-4">
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Tanggal</TH>
                <TH className="text-right">Harga / {bahanTerpilih.satuan}</TH>
                <TH className="text-right">Perubahan</TH>
              </TR>
            </THead>
            <TBody>
              {[...catatan].reverse().map((h, i, urutBaru) => {
                // Entri paling awal tidak punya pembanding.
                const pertama = i === urutBaru.length - 1;
                const delta = h.hargaBaru - h.hargaLama;
                return (
                  <TR key={h.id}>
                    <TD className="whitespace-nowrap">{formatTanggal(h.tanggal)}</TD>
                    <TD className="text-right font-medium whitespace-nowrap">
                      {formatRupiah(h.hargaBaru)}
                    </TD>
                    <TD
                      className={`text-right whitespace-nowrap ${
                        pertama || delta === 0
                          ? "text-muted-foreground"
                          : delta > 0
                            ? "text-warning"
                            : "text-success"
                      }`}
                    >
                      {pertama
                        ? "—"
                        : delta === 0
                          ? "Tetap"
                          : `${delta > 0 ? "+" : "−"}${formatRupiah(Math.abs(delta))}`}
                    </TD>
                  </TR>
                );
              })}
              {catatan.length === 0 && (
                <TR className="hover:bg-transparent">
                  <TD colSpan={3} className="py-10 text-center text-sm text-muted-foreground">
                    Belum ada catatan perubahan untuk bahan ini.
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </div>

        <TableFooterNote
          kiri={`${catatan.length} catatan perubahan`}
          kanan="Setiap pembaruan harga bahan tercatat otomatis"
        />
      </Card>
    </>
  );
}

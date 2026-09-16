"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GrafikHarga } from "@/components/charts/GrafikHarga";
import { Badge } from "@/components/ui/Badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  MobileDataEmpty,
  MobileDataList,
  MobileDataListItem,
} from "@/components/ui/MobileDataList";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, TBody, TD, TH, THead, TR, TableFooterNote } from "@/components/ui/Table";
import {
  IconPanahKanan,
  IconPanahNaik,
  IconPanahTurun,
  IconTren,
} from "@/components/ui/icons";
import { formatPersen, formatRupiah, formatTanggal } from "@/lib/format";
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

  // Setiap catatan menyimpan harga sebelum dan sesudah perubahan. Titik pertama
  // grafik adalah hargaLama catatan paling awal, supaya bahan yang baru punya
  // satu perubahan tetap tergambar sebagai garis naik/turun, bukan satu titik.
  const dataGrafik = useMemo(
    () =>
      catatan.length === 0
        ? []
        : [
            {
              waktu: new Date(catatan[0].tanggal).getTime(),
              harga: catatan[0].hargaLama,
              label: { sumbu: "Awal", tooltip: "Sebelum perubahan pertama" },
            },
            ...catatan.map((h) => ({
              waktu: new Date(h.tanggal).getTime(),
              harga: h.hargaBaru,
            })),
          ],
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

  // Beberapa perubahan pada hari yang sama hanya bisa dibedakan lewat jamnya.
  const adaHariKembar =
    new Set(catatan.map((h) => h.tanggal.slice(0, 10))).size !== catatan.length;
  const tampilkanWaktu = (iso: string) =>
    adaHariKembar
      ? `${formatTanggal(iso)}, ${new Date(iso).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })}`
      : formatTanggal(iso);

  // Baseline adalah harga SEBELUM perubahan pertama. Memakai hargaBaru catatan
  // pertama membuat bahan dengan satu perubahan (40000 -> 44000) terbaca
  // "Stabil", karena awal dan akhirnya catatan yang sama.
  const hargaAwal = catatan[0]?.hargaLama ?? 0;
  const hargaAkhir = catatan.at(-1)?.hargaBaru ?? 0;
  const stabil = hargaAkhir === hargaAwal;
  const naik = hargaAkhir > hargaAwal;
  const perubahan = hargaAwal === 0 ? 0 : ((hargaAkhir - hargaAwal) / hargaAwal) * 100;
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
                stabil ? "text-foreground" : naik ? "text-warning" : "text-success"
              }`}
            >
              {!stabil &&
                (naik ? (
                  <IconPanahNaik width={16} height={16} />
                ) : (
                  <IconPanahTurun width={16} height={16} />
                ))}
              {stabil ? "Stabil" : formatPersen(Math.abs(perubahan))}
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

        <div className="mt-4 hidden md:block">
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Tanggal</TH>
                <TH className="text-right">Harga / {bahanTerpilih.satuan}</TH>
                <TH className="text-right">Perubahan</TH>
              </TR>
            </THead>
            <TBody>
              {[...catatan].reverse().map((h) => {
                // Setiap catatan membawa pembandingnya sendiri (hargaLama),
                // termasuk catatan paling awal.
                const delta = h.hargaBaru - h.hargaLama;
                return (
                  <TR key={h.id}>
                    <TD className="whitespace-nowrap">{tampilkanWaktu(h.tanggal)}</TD>
                    <TD className="text-right font-medium whitespace-nowrap">
                      {formatRupiah(h.hargaBaru)}
                    </TD>
                    <TD
                      className={`text-right whitespace-nowrap ${
                        delta === 0
                          ? "text-muted-foreground"
                          : delta > 0
                            ? "text-warning"
                            : "text-success"
                      }`}
                    >
                      {delta === 0
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

        <MobileDataList className="mt-4">
          {[...catatan].reverse().map((h) => {
            const delta = h.hargaBaru - h.hargaLama;
            return (
              <MobileDataListItem key={h.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {tampilkanWaktu(h.tanggal)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Sebelumnya {formatRupiah(h.hargaLama)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {formatRupiah(h.hargaBaru)}
                    </p>
                    <p
                      className={`mt-1 text-xs font-medium ${
                        delta === 0
                          ? "text-muted-foreground"
                          : delta > 0
                            ? "text-warning"
                            : "text-success"
                      }`}
                    >
                      {delta === 0
                        ? "Tetap"
                        : `${delta > 0 ? "+" : "−"}${formatRupiah(Math.abs(delta))}`}
                    </p>
                  </div>
                </div>
              </MobileDataListItem>
            );
          })}
          {catatan.length === 0 && (
            <MobileDataEmpty>Belum ada catatan perubahan untuk bahan ini.</MobileDataEmpty>
          )}
        </MobileDataList>

        <TableFooterNote
          kiri={`${catatan.length} catatan perubahan`}
          kanan="Setiap pembaruan harga bahan tercatat otomatis"
        />
      </Card>
    </>
  );
}

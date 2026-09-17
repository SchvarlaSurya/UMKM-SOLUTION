"use client";

import { useMemo, useRef, useState } from "react";
import { AngkaBergerak } from "@/components/ui/AngkaBergerak";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  MobileDataEmpty,
  MobileDataList,
  MobileDataListItem,
} from "@/components/ui/MobileDataList";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Table, TBody, TD, TH, THead, TR, TableFooterNote } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { useAnimasiGantiFilter } from "@/components/ui/useAnimasiGantiFilter";
import { IconCari, IconCentang, IconPanahKeluar, IconPeringatan } from "@/components/ui/icons";
import type { RincianHpp } from "@/lib/hpp";
import type { ProdukDenganHpp } from "@/lib/types";
import { ModalRincianHpp } from "./ModalRincianHpp";

type Filter = "semua" | "perhatian" | "aman";

export function TabelMargin({
  produk,
  rincian,
}: {
  produk: ProdukDenganHpp[];
  rincian: Record<number, RincianHpp>;
}) {
  const [filter, setFilter] = useState<Filter>("semua");
  const [cari, setCari] = useState("");
  const [produkTerpilih, setProdukTerpilih] = useState<ProdukDenganHpp | null>(null);
  // Tabel dan daftar mobile dirender berdampingan, hanya satu yang terlihat
  // per lebar layar; keduanya diserahkan sekaligus dan yang belum terpasang
  // dilewati di dalam hook.
  const refIsiTabel = useRef<HTMLTableSectionElement>(null);
  const refIsiMobile = useRef<HTMLDivElement>(null);

  useAnimasiGantiFilter(filter, [refIsiTabel, refIsiMobile]);

  const jumlahPerhatian = produk.filter((p) => !p.statusAman).length;

  const terlihat = useMemo(() => {
    const kunci = cari.trim().toLowerCase();
    return produk.filter((p) => {
      const lolosFilter =
        filter === "semua" ||
        (filter === "perhatian" && !p.statusAman) ||
        (filter === "aman" && p.statusAman);
      const lolosCari = kunci === "" || p.nama.toLowerCase().includes(kunci);
      return lolosFilter && lolosCari;
    });
  }, [produk, filter, cari]);

  return (
    <Card>
      <CardHeader className="flex-col items-stretch gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>Margin produk</CardTitle>
              <Badge varian="count">{produk.length}</Badge>
            </div>
            <CardDescription className="mt-1">
              HPP sudah termasuk bahan baku dan biaya operasional.
            </CardDescription>
          </div>
          <Badge varian="success" ikon={<IconCentang width={13} height={13} />}>
            Terhitung otomatis
          </Badge>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            nilai={filter}
            onChange={(id) => setFilter(id as Filter)}
            items={[
              { id: "semua", label: "Semua produk" },
              { id: "perhatian", label: "Perlu perhatian", jumlah: jumlahPerhatian },
              { id: "aman", label: "Aman" },
            ]}
          />
          <div className="relative w-full sm:w-auto">
            <IconCari
              width={16}
              height={16}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Cari nama produk…"
              aria-label="Cari nama produk"
              className="h-9 w-full rounded-card border border-border bg-card pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring sm:w-56"
            />
          </div>
        </div>
      </CardHeader>

      <div className="mt-4 hidden md:block">
        <Table>
          <THead>
            <TR className="hover:bg-transparent">
              <TH>Nama produk</TH>
              <TH className="text-right">HPP / porsi</TH>
              <TH className="text-right">Harga jual</TH>
              <TH>Margin</TH>
              <TH>Status</TH>
              <TH className="text-right">Detail</TH>
            </TR>
          </THead>
          <TBody ref={refIsiTabel}>
            {terlihat.map((p) => (
              <TR key={p.id}>
                <TD>
                  <span className="block font-medium">{p.nama}</span>
                  <span className="block text-xs text-muted-foreground">{p.kategori}</span>
                </TD>
                <TD className="text-right whitespace-nowrap">
                  <AngkaBergerak nilai={p.hppTerhitung} format="rupiah" />
                </TD>
                <TD className="text-right font-medium whitespace-nowrap">
                  <AngkaBergerak nilai={p.hargaJual} format="rupiah" />
                </TD>
                <TD>
                  <AngkaBergerak
                    nilai={p.marginPersen}
                    format="persen"
                    className={`block text-sm font-medium transition-colors duration-300 motion-reduce:transition-none ${
                      p.statusAman ? "text-success" : "text-warning"
                    }`}
                  />
                  <ProgressBar
                    nilai={Math.max(p.marginPersen, 0)}
                    aman={p.statusAman}
                    label={`Margin ${p.nama}`}
                    className="mt-1.5"
                  />
                </TD>
                <TD>
                  {p.statusAman ? (
                    <Badge varian="success" ikon={<IconCentang width={13} height={13} />}>
                      Aman
                    </Badge>
                  ) : (
                    <Badge varian="warning" ikon={<IconPeringatan width={13} height={13} />}>
                      Margin rendah
                    </Badge>
                  )}
                </TD>
                <TD className="text-right">
                  <Button
                    varian="ghost"
                    ukuran="sm"
                    className="px-2"
                    aria-label={`Lihat rincian HPP ${p.nama}`}
                    onClick={() => setProdukTerpilih(p)}
                  >
                    <IconPanahKeluar width={16} height={16} />
                  </Button>
                </TD>
              </TR>
            ))}
            {terlihat.length === 0 && (
              <TR className="hover:bg-transparent">
                <TD colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  {produk.length === 0
                    ? "Belum ada produk yang dicatat."
                    : "Tidak ada produk yang cocok dengan pencarian."}
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </div>

      {/* mt-4 menyamai versi tabel di atasnya. CardHeader sengaja tidak punya
          padding bawah, jadi jarak ke isi kartu memang tugas isinya sendiri —
          tanpa ini garis atas daftar menempel persis di kolom pencarian. */}
      <MobileDataList ref={refIsiMobile} className="mt-4">
        {terlihat.map((p) => (
          <MobileDataListItem key={p.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-foreground">{p.nama}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{p.kategori}</p>
              </div>
              {p.statusAman ? (
                <Badge varian="success" ikon={<IconCentang width={13} height={13} />}>
                  Aman
                </Badge>
              ) : (
                <Badge varian="warning" ikon={<IconPeringatan width={13} height={13} />}>
                  Margin rendah
                </Badge>
              )}
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-3">
              <div>
                <dt className="text-[11px] text-muted-foreground">HPP / porsi</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">
                  <AngkaBergerak nilai={p.hppTerhitung} format="rupiah" />
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted-foreground">Harga jual</dt>
                <dd className="mt-1 text-sm font-semibold text-foreground">
                  <AngkaBergerak nilai={p.hargaJual} format="rupiah" />
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted-foreground">Margin</dt>
                <dd
                  className={`mt-1 text-sm font-semibold ${
                    p.statusAman ? "text-success" : "text-warning"
                  }`}
                >
                  <AngkaBergerak nilai={p.marginPersen} format="persen" />
                </dd>
              </div>
            </dl>

            <ProgressBar
              nilai={Math.max(p.marginPersen, 0)}
              aman={p.statusAman}
              label={`Margin ${p.nama}`}
              className="mt-3"
            />

            <Button
              varian="secondary"
              ukuran="sm"
              className="mt-4 w-full"
              onClick={() => setProdukTerpilih(p)}
            >
              Lihat rincian HPP
              <IconPanahKeluar width={15} height={15} />
            </Button>
          </MobileDataListItem>
        ))}
        {terlihat.length === 0 && (
          <MobileDataEmpty>
            {produk.length === 0
              ? "Belum ada produk yang dicatat."
              : "Tidak ada produk yang cocok dengan pencarian."}
          </MobileDataEmpty>
        )}
      </MobileDataList>

      <TableFooterNote
        kiri={`Menampilkan ${terlihat.length} dari ${produk.length} produk`}
        kanan="Margin = (harga jual − HPP) ÷ harga jual"
      />

      <ModalRincianHpp
        terbuka={produkTerpilih !== null}
        onTutup={() => setProdukTerpilih(null)}
        namaProduk={produkTerpilih?.nama ?? ""}
        hargaJual={produkTerpilih?.hargaJual ?? 0}
        rincian={produkTerpilih ? rincian[produkTerpilih.id] : null}
      />
    </Card>
  );
}

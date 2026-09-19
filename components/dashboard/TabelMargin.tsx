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
import { Paginasi } from "@/components/ui/Paginasi";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Table, TBody, TD, TH, THead, TR, TableFooterNote } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { useAnimasiGantiFilter } from "@/components/ui/useAnimasiGantiFilter";
import { IconCari, IconCentang, IconPanahKeluar, IconPeringatan } from "@/components/ui/icons";
import { durasiGerak } from "@/lib/gerak";
import type { RincianHpp } from "@/lib/hpp";
import type { ProdukDenganHpp } from "@/lib/types";
import { ModalRincianHpp } from "./ModalRincianHpp";

type Filter = "semua" | "perhatian" | "aman";

/**
 * Baris per halaman.
 *
 * Satu angka untuk kedua tampilan, meski tingginya jauh berbeda: baris tabel
 * 61px, kartu mobile 194px. Delapan menahan tabelnya di sekitar 490px di layar
 * besar — muat sekali pandang — dan memotong daftar mobile dari 4.207px jadi
 * sekitar 1.550px. Angka yang berbeda per lebar layar berarti potongan
 * halamannya ikut berubah saat jendela diubah ukurannya, dan pembaca kehilangan
 * tempatnya.
 */
const UKURAN_HALAMAN = 8;

export function TabelMargin({
  produk,
  rincian,
}: {
  produk: ProdukDenganHpp[];
  rincian: Record<number, RincianHpp>;
}) {
  const [filter, setFilter] = useState<Filter>("semua");
  const [cari, setCari] = useState("");
  const [halaman, setHalaman] = useState(1);
  // Hanya id-nya yang disimpan. Menyimpan objek produknya membuat modal
  // memegang salinan lama: harga jual di modal berasal dari salinan itu,
  // sedangkan rincian dibaca dari props yang ikut diperbarui, jadi keduanya
  // bisa menampilkan angka berbeda untuk produk yang sama.
  const [idTerpilih, setIdTerpilih] = useState<number | null>(null);
  // Tabel dan daftar mobile dirender berdampingan, hanya satu yang terlihat
  // per lebar layar; keduanya diserahkan sekaligus dan yang belum terpasang
  // dilewati di dalam hook.
  const refIsiTabel = useRef<HTMLTableSectionElement>(null);
  const refIsiMobile = useRef<HTMLDivElement>(null);
  const refKartu = useRef<HTMLElement>(null);

  const jumlahPerhatian = produk.filter((p) => !p.statusAman).length;

  // Selalu dari daftar produk yang sedang dirender tabel, bukan salinan saat
  // baris diklik. Produk yang terhapus di render berikutnya menutup modalnya.
  const produkTerpilih = idTerpilih === null ? null : (produk.find((p) => p.id === idTerpilih) ?? null);

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

  // Menyaring mengubah isi daftar, jadi halaman 3 dari hasil lama tidak berarti
  // apa-apa untuk hasil baru. Disesuaikan saat render, bukan lewat efek: kalau
  // menunggu efek, satu frame sempat tergambar dengan potongan halaman yang
  // salah.
  const kunciSaring = `${filter}|${cari.trim().toLowerCase()}`;
  const [kunciSebelumnya, setKunciSebelumnya] = useState(kunciSaring);
  if (kunciSaring !== kunciSebelumnya) {
    setKunciSebelumnya(kunciSaring);
    setHalaman(1);
  }

  const totalHalaman = Math.max(1, Math.ceil(terlihat.length / UKURAN_HALAMAN));
  // Dijepit, bukan cuma direset saat menyaring: data bisa menyusut sendiri
  // sesudah revalidatePath, dan halaman di luar rentang membuat tabelnya kosong
  // tanpa sebab yang terlihat.
  const halamanAktif = Math.min(halaman, totalHalaman);
  const mulai = (halamanAktif - 1) * UKURAN_HALAMAN;
  const halamanIni = terlihat.slice(mulai, mulai + UKURAN_HALAMAN);

  // Berganti halaman menukar isi daftar sama seperti berganti tab, jadi
  // keduanya memakai jeda yang sama.
  useAnimasiGantiFilter(`${filter}|${halamanAktif}`, [refIsiTabel, refIsiMobile]);

  function pindahHalaman(tujuan: number) {
    setHalaman(tujuan);

    // Tanpa ini pembaca tertinggal di kaki tabel setelah menekan panah, dan di
    // ponsel baris pertama halaman baru berada jauh di atas layar. 72px adalah
    // tinggi topbar lengket ditambah sedikit ruang napas.
    const kartu = refKartu.current;
    if (!kartu) return;
    const atas = kartu.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top: atas, behavior: durasiGerak(1) === 0 ? "auto" : "smooth" });
  }

  return (
    <Card ref={refKartu}>
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
            {halamanIni.map((p) => (
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
                    onClick={() => setIdTerpilih(p.id)}
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
        {halamanIni.map((p) => (
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
              onClick={() => setIdTerpilih(p.id)}
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

      {/* Rumus margin menyerah pada pindah halaman saat produknya sudah banyak.
          Ia keterangan pengenalan — paling berguna justru di akun yang produknya
          masih sedikit, dan di situ paginasinya belum muncul. */}
      <TableFooterNote
        kiri={
          terlihat.length === 0
            ? `Tidak ada dari ${produk.length} produk yang cocok`
            : `Menampilkan ${mulai + 1}–${mulai + halamanIni.length} dari ${terlihat.length} produk`
        }
        kanan={
          totalHalaman > 1 ? (
            <Paginasi
              halaman={halamanAktif}
              totalHalaman={totalHalaman}
              onPindah={pindahHalaman}
              label="Halaman tabel margin produk"
            />
          ) : (
            "Margin = (harga jual − HPP) ÷ harga jual"
          )
        }
      />

      <ModalRincianHpp
        terbuka={produkTerpilih !== null}
        onTutup={() => setIdTerpilih(null)}
        namaProduk={produkTerpilih?.nama ?? ""}
        hargaJual={produkTerpilih?.hargaJual ?? 0}
        rincian={produkTerpilih ? (rincian[produkTerpilih.id] ?? null) : null}
      />
    </Card>
  );
}

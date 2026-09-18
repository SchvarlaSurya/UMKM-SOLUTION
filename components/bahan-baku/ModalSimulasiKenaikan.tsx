"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  MobileDataList,
  MobileDataListItem,
} from "@/components/ui/MobileDataList";
import { Modal } from "@/components/ui/Modal";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { useSesiModal } from "@/components/ui/useSesiModal";
import { IconKalkulator, IconPeringatan } from "@/components/ui/icons";
import { formatPersen, formatRupiah } from "@/lib/format";
import type { DampakProduk, HasilSimulasiKenaikan } from "@/lib/simulasiKenaikan";
import type { BahanBaku } from "@/lib/types";

const ID_FORM = "form-simulasi-kenaikan";
const URL_BAPANAS = "https://www.bapanas.go.id/harga-pangan";

type Status =
  | { jenis: "awal" }
  | { jenis: "memuat" }
  | { jenis: "galat"; pesan: string }
  | { jenis: "sukses"; hasil: HasilSimulasiKenaikan };

function pesanGalat(isi: unknown): string {
  if (isi && typeof isi === "object" && "error" in isi && typeof isi.error === "string") {
    return isi.error;
  }
  return "Simulasi belum dapat dihitung. Coba lagi.";
}

/** Selisih margin dalam poin persen: -3.24 -> "−3,2 poin". */
function formatSelisih(nilai: number): string {
  const bulat = Math.round(nilai * 10) / 10;
  if (bulat === 0) return "Tetap";
  const angka = Math.abs(bulat).toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${bulat > 0 ? "+" : "−"}${angka} poin`;
}

export function ModalSimulasiKenaikan({
  bahan,
  terbuka,
  onTutup,
}: {
  bahan: BahanBaku | null;
  terbuka: boolean;
  onTutup: () => void;
}) {
  // Modal (<dialog>) tetap merender isinya saat tertutup. Tanpa penghitung
  // sesi di key, persentase dan hasil simulasi bahan sebelumnya ikut terbawa
  // saat modal dibuka lagi — kebocoran yang sama dengan form produk dulu.
  const sesi = useSesiModal(terbuka);

  return (
    <Modal
      terbuka={terbuka}
      onTutup={onTutup}
      judul="Simulasi kenaikan harga"
      subjudul={bahan ? `${bahan.nama} · dihitung dari data resep dan biaya milikmu` : undefined}
      lebar="lg"
      aksiSekunder={
        <Button varian="secondary" ukuran="sm" type="button" onClick={onTutup}>
          Tutup
        </Button>
      }
      aksiPrimer={
        <Button varian="primary" ukuran="sm" type="submit" form={ID_FORM} disabled={!bahan}>
          <IconKalkulator width={14} height={14} />
          Hitung
        </Button>
      }
    >
      {bahan && <FormSimulasi key={`${bahan.id}-${sesi}`} bahan={bahan} />}
    </Modal>
  );
}

function FormSimulasi({ bahan }: { bahan: BahanBaku }) {
  const [persen, setPersen] = useState("");
  const [galatInput, setGalatInput] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ jenis: "awal" });
  const permintaan = useRef<AbortController | null>(null);

  // Hentikan permintaan yang masih berjalan saat modal ditutup/berganti bahan.
  useEffect(() => () => permintaan.current?.abort(), []);

  async function hitung(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const angka = Number(persen);
    if (persen.trim() === "" || !Number.isFinite(angka) || angka <= 0) {
      setGalatInput("Isi persentase kenaikan lebih dari 0.");
      // Hasil hitungan sebelumnya ikut dibuang. Tanpa ini panel hasil tetap
      // terpampang di bawah pesan galat, dan angka lamanya mudah terbaca
      // sebagai jawaban untuk isian yang baru saja ditolak.
      setStatus({ jenis: "awal" });
      return;
    }
    setGalatInput(null);

    permintaan.current?.abort();
    const controller = new AbortController();
    permintaan.current = controller;
    setStatus({ jenis: "memuat" });

    try {
      const respons = await fetch(`/api/bahan-baku/${bahan.id}/simulasi-kenaikan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persenKenaikan: angka }),
        cache: "no-store",
        signal: controller.signal,
      });
      const isi: unknown = await respons.json().catch(() => null);
      if (!respons.ok) throw new Error(pesanGalat(isi));
      setStatus({ jenis: "sukses", hasil: isi as HasilSimulasiKenaikan });
    } catch (error) {
      if (controller.signal.aborted) return;
      setStatus({
        jenis: "galat",
        pesan: error instanceof Error ? error.message : pesanGalat(null),
      });
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Tautan biasa untuk dicek manual oleh pengguna. Aplikasi tidak mengambil
          data apa pun dari situs ini. */}
      <p className="text-xs">
        <a
          href={URL_BAPANAS}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary hover:underline underline-offset-4"
        >
          Cek harga pasar terkini di Bapanas ↗
        </a>
      </p>

      <form id={ID_FORM} onSubmit={hitung} className="grid gap-4 sm:grid-cols-2 sm:items-start">
        <div className="rounded-card border border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">Harga sekarang</p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {formatRupiah(bahan.hargaPerSatuan)}
            <span className="text-sm font-normal text-muted-foreground"> / {bahan.satuan}</span>
          </p>
        </div>

        {/* Input bertipe number dari komponen Input sudah melepas fokus saat
            di-scroll, jadi angkanya tidak berubah diam-diam oleh roda mouse. */}
        <Input
          id="persen-kenaikan"
          label="Kenaikan harga (%)"
          type="number"
          min={0}
          step="any"
          inputMode="decimal"
          placeholder="Contoh: 20"
          value={persen}
          onChange={(e) => setPersen(e.target.value)}
          error={galatInput ?? undefined}
          helper="Tekan Hitung untuk melihat dampaknya ke setiap produk."
        />
      </form>

      <HasilSimulasi status={status} satuan={bahan.satuan} />
    </div>
  );
}

function HasilSimulasi({ status, satuan }: { status: Status; satuan: string }) {
  if (status.jenis === "awal") return null;

  if (status.jenis === "memuat") {
    return (
      <div className="space-y-3" aria-label="Menghitung simulasi">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="grid animate-pulse grid-cols-[1fr_6rem] gap-4 rounded-card border border-border p-3 motion-reduce:animate-none"
          >
            <div className="space-y-2">
              <div className="h-3 rounded bg-muted" />
              <div className="h-3 w-2/3 rounded bg-muted" />
            </div>
            <div className="h-3 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (status.jenis === "galat") {
    return (
      <div
        role="alert"
        className="rounded-card border border-warning-border bg-warning-bg px-4 py-3 text-sm text-foreground"
      >
        {status.pesan}
      </div>
    );
  }

  const { hasil } = status;
  const adaTargetMargin = hasil.produk.some((p) => p.modePenentuanHarga === "targetMargin");
  const jatuhDiBawahBatas = hasil.produk.filter(
    (p) => p.statusAmanLama && !p.statusAmanHipotetis,
  ).length;

  return (
    <section aria-live="polite" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-card border border-border bg-muted/40 px-4 py-3 text-sm">
        <span className="text-muted-foreground">Harga hipotetis</span>
        <span className="font-semibold text-foreground">
          {formatRupiah(hasil.bahanBaku.hargaSekarang)} → {formatRupiah(hasil.bahanBaku.hargaHipotetis)}
        </span>
        <span className="text-muted-foreground">
          per {satuan} (+{formatPersen(hasil.persenKenaikan)})
        </span>
      </div>

      {hasil.produk.length === 0 ? (
        <div className="rounded-card border border-border px-4 py-8 text-center">
          <p className="text-sm font-medium text-foreground">Tidak ada produk terdampak</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
            Bahan ini belum dipakai di resep produk mana pun, jadi kenaikannya tidak mengubah
            HPP atau margin.
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {hasil.produk.length} produk terdampak, diurutkan dari margin yang turun paling
            banyak.
            {jatuhDiBawahBatas > 0 &&
              ` ${jatuhDiBawahBatas} produk akan jatuh di bawah batas margin aman ${formatPersen(hasil.batasMarginAman, 0)}.`}
            {adaTargetMargin &&
              " Produk bertarget margin ikut menyesuaikan harga jual, jadi marginnya tetap."}
          </p>

          <div className="hidden overflow-hidden rounded-card border border-border md:block">
            <Table>
              <THead>
                <TR className="hover:bg-transparent">
                  <TH>Produk</TH>
                  <TH className="text-right">HPP / porsi</TH>
                  <TH className="text-right">Harga jual</TH>
                  <TH className="text-right">Margin</TH>
                  <TH className="text-right">Perubahan</TH>
                </TR>
              </THead>
              <TBody>
                {hasil.produk.map((p) => (
                  <TR key={p.produkId}>
                    <TD>
                      <span className="block font-medium">{p.nama}</span>
                      <LabelProduk produk={p} />
                    </TD>
                    <TD className="text-right whitespace-nowrap">
                      <DuaAngka lama={formatRupiah(p.hppLama)} baru={formatRupiah(p.hppHipotetis)} />
                    </TD>
                    <TD className="text-right whitespace-nowrap">
                      {p.hargaJualHipotetis === p.hargaJualLama ? (
                        formatRupiah(p.hargaJualLama)
                      ) : (
                        <DuaAngka
                          lama={formatRupiah(p.hargaJualLama)}
                          baru={formatRupiah(p.hargaJualHipotetis)}
                        />
                      )}
                    </TD>
                    <TD className="text-right whitespace-nowrap">
                      <DuaAngka
                        lama={formatPersen(p.marginLama)}
                        baru={formatPersen(p.marginHipotetis)}
                        nadaBaru={p.statusAmanHipotetis ? "aman" : "rendah"}
                      />
                    </TD>
                    <TD className="text-right font-medium whitespace-nowrap">
                      <SelisihMargin nilai={p.selisihMargin} />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>

          <MobileDataList className="rounded-card border border-border">
            {hasil.produk.map((p) => (
              <MobileDataListItem key={p.produkId}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-foreground">{p.nama}</h3>
                    <LabelProduk produk={p} />
                  </div>
                  <span className="shrink-0 text-sm font-semibold">
                    <SelisihMargin nilai={p.selisihMargin} />
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <dt className="text-muted-foreground">HPP</dt>
                    <dd className="mt-0.5">
                      <DuaAngka
                        rataKiri
                        lama={formatRupiah(p.hppLama)}
                        baru={formatRupiah(p.hppHipotetis)}
                      />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Harga jual</dt>
                    <dd className="mt-0.5">
                      <DuaAngka
                        rataKiri
                        lama={formatRupiah(p.hargaJualLama)}
                        baru={formatRupiah(p.hargaJualHipotetis)}
                      />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Margin</dt>
                    <dd className="mt-0.5">
                      <DuaAngka
                        rataKiri
                        lama={formatPersen(p.marginLama)}
                        baru={formatPersen(p.marginHipotetis)}
                        nadaBaru={p.statusAmanHipotetis ? "aman" : "rendah"}
                      />
                    </dd>
                  </div>
                </dl>
              </MobileDataListItem>
            ))}
          </MobileDataList>
        </>
      )}
    </section>
  );
}

function LabelProduk({ produk }: { produk: DampakProduk }) {
  return (
    <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      {produk.kategori}
      {produk.modePenentuanHarga === "targetMargin" && <Badge varian="count">Target margin</Badge>}
      {produk.statusAmanLama && !produk.statusAmanHipotetis && (
        <Badge varian="warning" ikon={<IconPeringatan width={12} height={12} />}>
          Jatuh di bawah batas
        </Badge>
      )}
    </span>
  );
}

function DuaAngka({
  lama,
  baru,
  nadaBaru,
  rataKiri = false,
}: {
  lama: string;
  baru: string;
  nadaBaru?: "aman" | "rendah";
  /** Kartu mobile menaruh angka di bawah labelnya, jadi rata kiri. */
  rataKiri?: boolean;
}) {
  return (
    <span className={`inline-flex flex-col ${rataKiri ? "items-start" : "items-end"}`}>
      <span className="text-xs text-muted-foreground line-through">{lama}</span>
      <span
        className={
          nadaBaru === "rendah"
            ? "font-medium text-warning"
            : nadaBaru === "aman"
              ? "font-medium text-success"
              : "font-medium text-foreground"
        }
      >
        {baru}
      </span>
    </span>
  );
}

function SelisihMargin({ nilai }: { nilai: number }) {
  const teks = formatSelisih(nilai);
  const warna =
    teks === "Tetap" ? "text-muted-foreground" : nilai < 0 ? "text-warning" : "text-success";
  return <span className={warna}>{teks}</span>;
}

"use client";

import { useMemo, useState, useTransition } from "react";
import {
  hapusBiaya,
  perbaruiBiaya,
  simpanPengaturan,
  tambahBiaya,
} from "@/lib/actions/biaya-operasional";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, TBody, TD, TH, THead, TR, TableFooterNote } from "@/components/ui/Table";
import { ModalKonfirmasiHapus } from "@/components/ui/ModalKonfirmasiHapus";
import { IconHapus, IconPensil, IconTambah } from "@/components/ui/icons";
import { formatPersen, formatRupiah } from "@/lib/format";
import type { BiayaOperasional, Pengaturan } from "@/lib/types";
import { ModalBiaya, type NilaiFormBiaya } from "./ModalBiaya";

/**
 * Daftar biaya datang dari Server Component; setelah Server Action selesai,
 * revalidatePath membuat halaman ini dirender ulang dari database.
 *
 * Dua input pengaturan tetap dipegang state karena hasil pembagiannya dihitung
 * langsung saat diketik. Penyimpanannya sendiri harus ditekan, supaya angka
 * setengah jadi tidak ikut tersimpan.
 */
export function HalamanBiayaOperasional({
  biaya,
  pengaturan,
}: {
  biaya: BiayaOperasional[];
  pengaturan: Pengaturan;
}) {
  const [menyimpan, mulaiSimpan] = useTransition();
  const [porsi, setPorsi] = useState(String(pengaturan.estimasiPorsiPerBulan));
  const [batasMargin, setBatasMargin] = useState(String(pengaturan.batasMarginAman));
  const [galatPengaturan, setGalatPengaturan] = useState<string | null>(null);
  const [mode, setMode] = useState<"tambah" | "edit">("tambah");
  const [terpilih, setTerpilih] = useState<BiayaOperasional | null>(null);
  const [modalTerbuka, setModalTerbuka] = useState(false);
  const [galatBiaya, setGalatBiaya] = useState<string | null>(null);
  const [akanDihapus, setAkanDihapus] = useState<BiayaOperasional | null>(null);
  const [galatHapus, setGalatHapus] = useState<string | null>(null);

  const estimasiPorsi = Number(porsi) > 0 ? Number(porsi) : 0;
  const pengaturanBerubah =
    Number(porsi) !== pengaturan.estimasiPorsiPerBulan ||
    Number(batasMargin) !== pengaturan.batasMarginAman;

  const { totalTetap, totalPersentase, perPorsi } = useMemo(() => {
    const tetap = biaya
      .filter((b) => b.jenis === "tetap")
      .reduce((total, b) => total + b.nilai, 0);
    const persentase = biaya
      .filter((b) => b.jenis === "persentase")
      .reduce((total, b) => total + b.nilai, 0);
    return {
      totalTetap: tetap,
      totalPersentase: persentase,
      perPorsi: estimasiPorsi > 0 ? tetap / estimasiPorsi : 0,
    };
  }, [biaya, estimasiPorsi]);

  function bukaTambah() {
    setMode("tambah");
    setTerpilih(null);
    setGalatBiaya(null);
    setModalTerbuka(true);
  }

  function bukaEdit(item: BiayaOperasional) {
    setMode("edit");
    setTerpilih(item);
    setGalatBiaya(null);
    setModalTerbuka(true);
  }

  function simpan(nilai: NilaiFormBiaya) {
    setGalatBiaya(null);
    mulaiSimpan(async () => {
      const hasil =
        mode === "edit" && terpilih
          ? await perbaruiBiaya(terpilih.id, nilai)
          : await tambahBiaya(nilai);

      if (!hasil.ok) {
        setGalatBiaya(hasil.error);
        return;
      }

      setModalTerbuka(false);
      window.dispatchEvent(new Event("notifikasi:segarkan"));
    });
  }

  function hapus() {
    if (!akanDihapus) return;
    setGalatHapus(null);
    mulaiSimpan(async () => {
      const hasil = await hapusBiaya(akanDihapus.id);

      if (!hasil.ok) {
        setGalatHapus(hasil.error);
        return;
      }

      setAkanDihapus(null);
      window.dispatchEvent(new Event("notifikasi:segarkan"));
    });
  }

  function simpanAlokasi() {
    setGalatPengaturan(null);
    mulaiSimpan(async () => {
      const hasil = await simpanPengaturan({
        estimasiPorsiPerBulan: Number(porsi),
        batasMarginAman: Number(batasMargin),
      });

      if (!hasil.ok) {
        setGalatPengaturan(hasil.error);
        return;
      }

      window.dispatchEvent(new Event("notifikasi:segarkan"));
    });
  }

  return (
    <>
      <PageHeader
        label="Kelola usaha"
        judul="Biaya operasional"
        subjudul="Masukkan biaya yang sering luput dari perhitungan."
        aksi={
          <Button varian="primary" onClick={bukaTambah}>
            <IconTambah width={16} height={16} />
            Tambah biaya
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex-col items-stretch">
          <div>
            <CardTitle>Alokasi biaya tetap</CardTitle>
            <CardDescription className="mt-1">
              Biaya bulanan dibagi ke total porsi seluruh produk.
            </CardDescription>
          </div>
        </CardHeader>

        <div className="grid gap-5 px-5 py-5 md:grid-cols-3">
          <Input
            id="estimasi-porsi"
            label="Estimasi porsi per bulan"
            type="number"
            min={1}
            step={50}
            inputMode="numeric"
            value={porsi}
            onChange={(e) => setPorsi(e.target.value)}
            helper="Perkiraan total porsi terjual seluruh produk."
            error={estimasiPorsi === 0 ? "Isi lebih dari 0 agar bisa dibagi." : undefined}
          />

          <Input
            id="batas-margin"
            label="Batas margin aman (%)"
            type="number"
            min={0}
            max={100}
            step={1}
            inputMode="numeric"
            value={batasMargin}
            onChange={(e) => setBatasMargin(e.target.value)}
            helper="Produk di bawah angka ini ditandai perlu perhatian."
          />

          <div className="flex flex-col justify-center rounded-card border border-success-border bg-success-bg px-4 py-3">
            <span className="text-xs text-muted-foreground">Biaya tetap per porsi</span>
            <span className="mt-1 text-2xl font-semibold text-success">
              {formatRupiah(perPorsi)}
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              {formatRupiah(totalTetap)} per bulan
              {totalPersentase > 0 && ` · plus ${formatPersen(totalPersentase, 0)} dari harga jual`}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
          <p className="text-xs text-muted-foreground">
            {galatPengaturan ? (
              <span className="text-destructive">{galatPengaturan}</span>
            ) : pengaturanBerubah ? (
              "Angka di atas baru berlaku setelah disimpan."
            ) : (
              "Angka ini dipakai seluruh perhitungan HPP."
            )}
          </p>
          <Button
            varian="primary"
            ukuran="sm"
            disabled={!pengaturanBerubah || menyimpan}
            onClick={simpanAlokasi}
          >
            {menyimpan ? "Menyimpan…" : "Simpan pengaturan"}
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Daftar biaya operasional</CardTitle>
            <Badge varian="count">{biaya.length}</Badge>
          </div>
        </CardHeader>

        <div className="mt-4">
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Nama biaya</TH>
                <TH>Jenis</TH>
                <TH className="text-right">Nilai</TH>
                <TH>Dasar perhitungan</TH>
                <TH className="text-right">Aksi</TH>
              </TR>
            </THead>
            <TBody>
              {biaya.map((b) => (
                <TR key={b.id}>
                  <TD className="font-medium">{b.nama}</TD>
                  <TD>
                    <Badge varian={b.jenis === "tetap" ? "neutral" : "count"}>
                      {b.jenis === "tetap" ? "Tetap" : "Persentase"}
                    </Badge>
                  </TD>
                  <TD className="text-right font-medium whitespace-nowrap">
                    {b.jenis === "tetap" ? formatRupiah(b.nilai) : formatPersen(b.nilai, 0)}
                  </TD>
                  <TD className="text-sm text-muted-foreground">
                    {b.jenis === "tetap"
                      ? `Per bulan · ${formatRupiah(estimasiPorsi > 0 ? b.nilai / estimasiPorsi : 0)} / porsi`
                      : "Dari harga jual setiap produk"}
                  </TD>
                  <TD className="text-right">
                    <span className="inline-flex items-center gap-1">
                      <Button varian="link" ukuran="sm" onClick={() => bukaEdit(b)}>
                        <IconPensil width={14} height={14} />
                        Edit
                      </Button>
                      <Button
                        varian="ghost"
                        ukuran="sm"
                        className="px-2 hover:text-destructive"
                        aria-label={`Hapus ${b.nama}`}
                        onClick={() => {
                          setAkanDihapus(b);
                          setGalatHapus(null);
                        }}
                      >
                        <IconHapus width={16} height={16} />
                      </Button>
                    </span>
                  </TD>
                </TR>
              ))}
              {biaya.length === 0 && (
                <TR className="hover:bg-transparent">
                  <TD colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    Belum ada biaya operasional yang dicatat.
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </div>

        <TableFooterNote
          kiri={`${biaya.length} biaya tercatat`}
          kanan="Biaya tetap masuk HPP, biaya persentase memotong margin"
        />
      </Card>

      <ModalBiaya
        terbuka={modalTerbuka}
        mode={mode}
        biaya={terpilih}
        estimasiPorsi={estimasiPorsi}
        menyimpan={menyimpan}
        galatServer={galatBiaya}
        onTutup={() => setModalTerbuka(false)}
        onSimpan={simpan}
      />

      <ModalKonfirmasiHapus
        terbuka={akanDihapus !== null}
        judul="Hapus biaya operasional"
        nama={akanDihapus?.nama ?? ""}
        keterangan="Alokasi biaya tetap per porsi ikut terhitung ulang, jadi HPP seluruh produk akan berubah."
        galat={galatHapus}
        menghapus={menyimpan}
        onTutup={() => setAkanDihapus(null)}
        onHapus={hapus}
      />
    </>
  );
}

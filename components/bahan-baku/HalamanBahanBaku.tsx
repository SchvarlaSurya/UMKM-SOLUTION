"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, TBody, TD, TH, THead, TR, TableFooterNote } from "@/components/ui/Table";
import { IconCari, IconPensil, IconTambah } from "@/components/ui/icons";
import { formatRupiah, formatTanggal } from "@/lib/format";
import type { BahanBaku } from "@/lib/types";
import { ModalBahanBaku, type NilaiFormBahan } from "./ModalBahanBaku";

/**
 * Perubahan hanya disimpan di state komponen — lapisan data masih mock.
 * Saat lib/data.ts beralih ke API, simpan diganti panggilan
 * POST /api/bahan-baku dan PUT /api/bahan-baku/[id].
 */
export function HalamanBahanBaku({
  bahanAwal,
  pemakaian,
}: {
  bahanAwal: BahanBaku[];
  pemakaian: Record<number, number>;
}) {
  const [bahan, setBahan] = useState(bahanAwal);
  const [cari, setCari] = useState("");
  const [mode, setMode] = useState<"tambah" | "edit">("tambah");
  const [terpilih, setTerpilih] = useState<BahanBaku | null>(null);
  const [modalTerbuka, setModalTerbuka] = useState(false);

  const terlihat = useMemo(() => {
    const kunci = cari.trim().toLowerCase();
    return kunci === "" ? bahan : bahan.filter((b) => b.nama.toLowerCase().includes(kunci));
  }, [bahan, cari]);

  function bukaTambah() {
    setMode("tambah");
    setTerpilih(null);
    setModalTerbuka(true);
  }

  function bukaEdit(item: BahanBaku) {
    setMode("edit");
    setTerpilih(item);
    setModalTerbuka(true);
  }

  function simpan(nilai: NilaiFormBahan) {
    const sekarang = new Date().toISOString();
    setBahan((sebelumnya) =>
      mode === "edit" && terpilih
        ? sebelumnya.map((b) =>
            b.id === terpilih.id
              ? { ...b, hargaPerSatuan: nilai.hargaPerSatuan, updatedAt: sekarang }
              : b,
          )
        : [
            ...sebelumnya,
            {
              id: Math.max(0, ...sebelumnya.map((b) => b.id)) + 1,
              nama: nilai.nama,
              satuan: nilai.satuan,
              hargaPerSatuan: nilai.hargaPerSatuan,
              updatedAt: sekarang,
            },
          ].sort((a, b) => a.nama.localeCompare(b.nama, "id-ID")),
    );
    setModalTerbuka(false);
  }

  return (
    <>
      <PageHeader
        label="Kelola usaha"
        judul="Bahan baku"
        subjudul="Satu harga diperbarui, semua resep terkait ikut terhitung."
        aksi={
          <Button varian="primary" onClick={bukaTambah}>
            <IconTambah width={16} height={16} />
            Tambah bahan
          </Button>
        }
      />

      <Banner varian="info">
        Perubahan harga akan menghitung ulang HPP seluruh produk yang memakai bahan ini.
      </Banner>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Daftar bahan baku</CardTitle>
            <Badge varian="count">{bahan.length}</Badge>
          </div>
          <div className="relative">
            <IconCari
              width={16}
              height={16}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Cari nama bahan…"
              aria-label="Cari nama bahan"
              className="h-9 w-56 rounded-card border border-border bg-card pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
            />
          </div>
        </CardHeader>

        <div className="mt-4">
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Nama bahan</TH>
                <TH>Satuan</TH>
                <TH className="text-right">Harga / satuan</TH>
                <TH>Dipakai di</TH>
                <TH className="text-right">Aksi</TH>
              </TR>
            </THead>
            <TBody>
              {terlihat.map((b) => {
                const dipakai = pemakaian[b.id] ?? 0;
                return (
                  <TR key={b.id}>
                    <TD>
                      <span className="block font-medium">{b.nama}</span>
                      <span className="block text-xs text-muted-foreground">
                        Diperbarui {formatTanggal(b.updatedAt)}
                      </span>
                    </TD>
                    <TD className="text-muted-foreground">{b.satuan}</TD>
                    <TD className="text-right font-medium whitespace-nowrap">
                      {formatRupiah(b.hargaPerSatuan)}
                    </TD>
                    <TD className="whitespace-nowrap">
                      {dipakai > 0 ? (
                        <span className="text-sm">{dipakai} produk</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Belum dipakai</span>
                      )}
                    </TD>
                    <TD className="text-right">
                      <Button varian="link" ukuran="sm" onClick={() => bukaEdit(b)}>
                        <IconPensil width={14} height={14} />
                        Edit harga
                      </Button>
                    </TD>
                  </TR>
                );
              })}
              {terlihat.length === 0 && (
                <TR className="hover:bg-transparent">
                  <TD colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    Tidak ada bahan yang cocok dengan pencarian.
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </div>

        <TableFooterNote
          kiri={`Menampilkan ${terlihat.length} dari ${bahan.length} bahan`}
          kanan="Harga dipakai untuk menghitung HPP setiap resep terkait"
        />
      </Card>

      <ModalBahanBaku
        terbuka={modalTerbuka}
        mode={mode}
        bahan={terpilih}
        jumlahProdukTerkait={terpilih ? (pemakaian[terpilih.id] ?? 0) : 0}
        onTutup={() => setModalTerbuka(false)}
        onSimpan={simpan}
      />
    </>
  );
}

"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { hapusBahanBaku, perbaruiHargaBahan, tambahBahanBaku } from "@/lib/actions/bahan-baku";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { ModalKonfirmasiHapus } from "@/components/ui/ModalKonfirmasiHapus";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, TBody, TD, TH, THead, TR, TableFooterNote } from "@/components/ui/Table";
import { IconCari, IconHapus, IconPensil, IconTambah } from "@/components/ui/icons";
import { formatRupiah, formatTanggal } from "@/lib/format";
import type { BahanBaku } from "@/lib/types";
import { ModalBahanBaku, type NilaiFormBahan } from "./ModalBahanBaku";

/**
 * Daftar bahan datang dari Server Component dan tidak disalin ke state:
 * setelah Server Action selesai, revalidatePath membuat halaman ini dirender
 * ulang dengan data terbaru dari database.
 */
export function HalamanBahanBaku({
  bahan,
  pemakaian,
}: {
  bahan: BahanBaku[];
  pemakaian: Record<number, number>;
}) {
  const router = useRouter();
  const [menyimpan, mulaiSimpan] = useTransition();
  const [cari, setCari] = useState("");
  const [mode, setMode] = useState<"tambah" | "edit">("tambah");
  const [terpilih, setTerpilih] = useState<BahanBaku | null>(null);
  const [modalTerbuka, setModalTerbuka] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [akanDihapus, setAkanDihapus] = useState<BahanBaku | null>(null);
  const [galatHapus, setGalatHapus] = useState<string | null>(null);

  const terlihat = useMemo(() => {
    const kunci = cari.trim().toLowerCase();
    return kunci === "" ? bahan : bahan.filter((b) => b.nama.toLowerCase().includes(kunci));
  }, [bahan, cari]);

  function bukaTambah() {
    setMode("tambah");
    setTerpilih(null);
    setGalat(null);
    setModalTerbuka(true);
  }

  function bukaEdit(item: BahanBaku) {
    setMode("edit");
    setTerpilih(item);
    setGalat(null);
    setModalTerbuka(true);
  }

  function bukaHapus(item: BahanBaku) {
    setAkanDihapus(item);
    setGalatHapus(null);
  }

  function hapus() {
    if (!akanDihapus) return;
    setGalatHapus(null);
    mulaiSimpan(async () => {
      const hasil = await hapusBahanBaku(akanDihapus.id);

      if (!hasil.ok) {
        setGalatHapus(hasil.error);
        return;
      }

      setAkanDihapus(null);
      router.refresh();
    });
  }

  function simpan(nilai: NilaiFormBahan) {
    setGalat(null);
    mulaiSimpan(async () => {
      const hasil =
        mode === "edit" && terpilih
          ? await perbaruiHargaBahan(terpilih.id, nilai.hargaPerSatuan)
          : await tambahBahanBaku(nilai);

      if (!hasil.ok) {
        setGalat(hasil.error);
        return;
      }

      setModalTerbuka(false);
      // Ambil ulang hasil render server yang sudah disegarkan Server Action.
      router.refresh();
    });
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
                      <span className="inline-flex items-center gap-1">
                        <Button varian="link" ukuran="sm" onClick={() => bukaEdit(b)}>
                          <IconPensil width={14} height={14} />
                          Edit harga
                        </Button>
                        <Button
                          varian="ghost"
                          ukuran="sm"
                          className="px-2 hover:text-destructive"
                          aria-label={`Hapus ${b.nama}`}
                          onClick={() => bukaHapus(b)}
                        >
                          <IconHapus width={16} height={16} />
                        </Button>
                      </span>
                    </TD>
                  </TR>
                );
              })}
              {terlihat.length === 0 && (
                <TR className="hover:bg-transparent">
                  <TD colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    {bahan.length === 0 ? (
                      <>
                        <span className="block font-medium text-foreground">
                          Belum ada bahan baku
                        </span>
                        <span className="mx-auto mt-1 block max-w-sm">
                          Mulai dari bahan yang paling sering dibeli. Harganya dipakai
                          menghitung HPP setiap resep.
                        </span>
                      </>
                    ) : (
                      "Tidak ada bahan yang cocok dengan pencarian."
                    )}
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
        menyimpan={menyimpan}
        galatServer={galat}
        onTutup={() => setModalTerbuka(false)}
        onSimpan={simpan}
      />

      <ModalKonfirmasiHapus
        terbuka={akanDihapus !== null}
        judul="Hapus bahan baku"
        nama={akanDihapus?.nama ?? ""}
        keterangan="Catatan perubahan harganya ikut terhapus. Produk yang memakai bahan ini harus dilepas dari resepnya lebih dulu."
        galat={galatHapus}
        menghapus={menyimpan}
        onTutup={() => setAkanDihapus(null)}
        onHapus={hapus}
      />
    </>
  );
}

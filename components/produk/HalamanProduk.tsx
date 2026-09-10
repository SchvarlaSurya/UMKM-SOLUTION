"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { IconCari, IconProduk, IconTambah } from "@/components/ui/icons";
import type { BahanBaku, BiayaOperasional, Pengaturan, Produk, ProdukDenganHpp } from "@/lib/types";
import { turunkanHpp } from "@/lib/hpp";
import { KartuProduk } from "./KartuProduk";
import { ModalProduk, type NilaiFormProduk } from "./ModalProduk";

type Filter = "semua" | "perhatian" | "aman";

/**
 * Perubahan hanya disimpan di state komponen — lapisan data masih mock.
 * Saat lib/data.ts beralih ke API: POST /api/produk dan PUT /api/produk/[id],
 * lalu HPP diambil ulang dari GET /api/produk/hpp-semua.
 */
export function HalamanProduk({
  produkAwal,
  bahan,
  biaya,
  pengaturan,
}: {
  produkAwal: Produk[];
  bahan: BahanBaku[];
  biaya: BiayaOperasional[];
  pengaturan: Pengaturan;
}) {
  const [produk, setProduk] = useState(produkAwal);
  const [filter, setFilter] = useState<Filter>("semua");
  const [cari, setCari] = useState("");
  const [mode, setMode] = useState<"tambah" | "edit">("tambah");
  const [terpilih, setTerpilih] = useState<Produk | null>(null);
  const [modalTerbuka, setModalTerbuka] = useState(false);

  const denganHpp: ProdukDenganHpp[] = useMemo(
    () => turunkanHpp(produk, biaya, pengaturan),
    [produk, biaya, pengaturan],
  );

  const jumlahPerhatian = denganHpp.filter((p) => !p.statusAman).length;

  const terlihat = useMemo(() => {
    const kunci = cari.trim().toLowerCase();
    return denganHpp.filter((p) => {
      const lolosFilter =
        filter === "semua" ||
        (filter === "perhatian" && !p.statusAman) ||
        (filter === "aman" && p.statusAman);
      const lolosCari =
        kunci === "" ||
        p.nama.toLowerCase().includes(kunci) ||
        p.kategori.toLowerCase().includes(kunci);
      return lolosFilter && lolosCari;
    });
  }, [denganHpp, filter, cari]);

  function bukaTambah() {
    setMode("tambah");
    setTerpilih(null);
    setModalTerbuka(true);
  }

  function bukaEdit(item: Produk) {
    setMode("edit");
    setTerpilih(item);
    setModalTerbuka(true);
  }

  function simpan(nilai: NilaiFormProduk) {
    const bahanById = new Map(bahan.map((b) => [b.id, b]));

    setProduk((sebelumnya) => {
      const id = mode === "edit" && terpilih ? terpilih.id : Math.max(0, ...sebelumnya.map((p) => p.id)) + 1;
      const baru: Produk = {
        id,
        nama: nilai.nama,
        kategori: nilai.kategori,
        hargaJual: nilai.hargaJual,
        resep: nilai.resep.map((r) => ({
          produkId: id,
          bahanBakuId: r.bahanBakuId,
          jumlahDipakai: r.jumlahDipakai,
          bahanBaku: bahanById.get(r.bahanBakuId)!,
        })),
      };

      return mode === "edit" && terpilih
        ? sebelumnya.map((p) => (p.id === terpilih.id ? baru : p))
        : [...sebelumnya, baru];
    });

    setModalTerbuka(false);
  }

  return (
    <>
      <PageHeader
        label="Kelola usaha"
        judul="Produk & resep"
        subjudul="Takaran yang tepat membuat HPP lebih akurat."
        aksi={
          <Button varian="primary" onClick={bukaTambah}>
            <IconTambah width={16} height={16} />
            Tambah produk
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          nilai={filter}
          onChange={(id) => setFilter(id as Filter)}
          items={[
            { id: "semua", label: "Semua produk", jumlah: denganHpp.length },
            { id: "perhatian", label: "Perlu perhatian", jumlah: jumlahPerhatian },
            { id: "aman", label: "Aman" },
          ]}
        />
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
            placeholder="Cari produk atau kategori…"
            aria-label="Cari produk atau kategori"
            className="h-9 w-64 rounded-card border border-border bg-card pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
          />
        </div>
      </div>

      {terlihat.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {terlihat.map((p) => (
            <KartuProduk key={p.id} produk={p} onEdit={() => bukaEdit(p)} />
          ))}
        </div>
      ) : (
        <EmptyState
          ikon={<IconProduk />}
          judul="Tidak ada produk yang cocok"
          deskripsi="Ubah kata kunci pencarian atau pilih filter lain."
        />
      )}

      <ModalProduk
        terbuka={modalTerbuka}
        mode={mode}
        produk={terpilih}
        bahan={bahan}
        onTutup={() => setModalTerbuka(false)}
        onSimpan={simpan}
      />
    </>
  );
}

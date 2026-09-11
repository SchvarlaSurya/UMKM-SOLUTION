"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { perbaruiProduk, tambahProduk } from "@/lib/actions/produk";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { IconCari, IconPanahKanan, IconProduk, IconTambah } from "@/components/ui/icons";
import type { BahanBaku, ProdukDenganHpp } from "@/lib/types";
import { KartuProduk } from "./KartuProduk";
import { ModalProduk, type NilaiFormProduk } from "./ModalProduk";

type Filter = "semua" | "perhatian" | "aman";

/**
 * Produk beserta HPP-nya datang dari Server Component; setelah Server Action
 * selesai, revalidatePath membuat halaman ini dirender ulang dari database.
 */
export function HalamanProduk({
  produk,
  bahan,
}: {
  produk: ProdukDenganHpp[];
  bahan: BahanBaku[];
}) {
  const router = useRouter();
  const [menyimpan, mulaiSimpan] = useTransition();
  const [filter, setFilter] = useState<Filter>("semua");
  const [cari, setCari] = useState("");
  const [mode, setMode] = useState<"tambah" | "edit">("tambah");
  const [terpilih, setTerpilih] = useState<ProdukDenganHpp | null>(null);
  const [modalTerbuka, setModalTerbuka] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const denganHpp = produk;
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
    setGalat(null);
    setModalTerbuka(true);
  }

  function bukaEdit(item: ProdukDenganHpp) {
    setMode("edit");
    setTerpilih(item);
    setGalat(null);
    setModalTerbuka(true);
  }

  function simpan(nilai: NilaiFormProduk) {
    setGalat(null);
    mulaiSimpan(async () => {
      const hasil =
        mode === "edit" && terpilih
          ? await perbaruiProduk(terpilih.id, nilai)
          : await tambahProduk(nilai);

      if (!hasil.ok) {
        setGalat(hasil.error);
        return;
      }

      setModalTerbuka(false);
      router.refresh();
    });
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
      ) : produk.length === 0 ? (
        <EmptyState
          ikon={<IconProduk />}
          judul="Belum ada produk"
          deskripsi={
            bahan.length === 0
              ? "Catat bahan baku dulu, karena resep butuh minimal satu bahan."
              : "Buat produk pertama beserta takaran per porsinya, lalu HPP dan marginnya terhitung otomatis."
          }
          aksi={
            bahan.length === 0 ? (
              <ButtonLink href="/bahan-baku" varian="secondary" ukuran="sm">
                Ke bahan baku
                <IconPanahKanan width={14} height={14} />
              </ButtonLink>
            ) : (
              <Button varian="primary" ukuran="sm" onClick={bukaTambah}>
                <IconTambah width={14} height={14} />
                Tambah produk
              </Button>
            )
          }
        />
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
        menyimpan={menyimpan}
        galatServer={galat}
        onTutup={() => setModalTerbuka(false)}
        onSimpan={simpan}
      />
    </>
  );
}

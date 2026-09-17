"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { hapusProduk } from "@/lib/actions/produk";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ModalKonfirmasiHapus } from "@/components/ui/ModalKonfirmasiHapus";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { useAnimasiGantiFilter } from "@/components/ui/useAnimasiGantiFilter";
import { IconCari, IconPanahKanan, IconProduk, IconTambah } from "@/components/ui/icons";
import { formatPersen } from "@/lib/format";
import type { BahanBaku, ProdukDenganHpp } from "@/lib/types";
import { KartuProduk } from "./KartuProduk";
import { ModalHistoriHargaJual } from "./ModalHistoriHargaJual";
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
  const tampilkanToast = useToast();
  const [menyimpan, mulaiSimpan] = useTransition();
  const [filter, setFilter] = useState<Filter>("semua");
  const [cari, setCari] = useState("");
  const [mode, setMode] = useState<"tambah" | "edit">("tambah");
  const [terpilih, setTerpilih] = useState<ProdukDenganHpp | null>(null);
  const [modalTerbuka, setModalTerbuka] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [akanDihapus, setAkanDihapus] = useState<ProdukDenganHpp | null>(null);
  const [produkHistori, setProdukHistori] = useState<ProdukDenganHpp | null>(null);
  const [galatHapus, setGalatHapus] = useState<string | null>(null);

  const denganHpp = produk;
  const jumlahPerhatian = denganHpp.filter((p) => !p.statusAman).length;

  // Dipasang di pembungkus hasil, bukan di grid kartunya: filter yang tidak
  // menemukan apa pun menukar grid itu dengan EmptyState, dan pergantian ke
  // keadaan kosong sama perlunya dijelaskan.
  const refHasil = useRef<HTMLDivElement>(null);

  useAnimasiGantiFilter(filter, [refHasil]);

  // Rata-rata margin sengaja dipilih: jumlah per status sudah terbaca di tab
  // tepat di bawahnya, jadi mengulangnya di sini tidak menambah apa pun.
  const ringkasanProduk = useMemo(() => {
    if (produk.length === 0) return undefined;
    const rata = produk.reduce((total, p) => total + p.marginPersen, 0) / produk.length;
    return `${produk.length} produk · rata-rata margin ${formatPersen(rata)}`;
  }, [produk]);

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

  function hapus() {
    if (!akanDihapus) return;
    const namaProduk = akanDihapus.nama;
    setGalatHapus(null);
    mulaiSimpan(async () => {
      const hasil = await hapusProduk(akanDihapus.id);

      if (!hasil.ok) {
        setGalatHapus(hasil.error);
        return;
      }

      setAkanDihapus(null);
      tampilkanToast({
        varian: "sukses",
        pesan: `${namaProduk} berhasil dihapus.`,
      });
    });
  }

  function simpan(nilai: NilaiFormProduk) {
    const sedangEdit = mode === "edit" && terpilih !== null;
    setGalat(null);
    mulaiSimpan(async () => {
      try {
        const url =
          mode === "edit" && terpilih
            ? `/api/produk/${terpilih.id}`
            : "/api/produk";
        const respons = await fetch(url, {
          method: mode === "edit" ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nilai),
          cache: "no-store",
        });
        const isi: unknown = await respons.json().catch(() => null);

        if (!respons.ok) {
          const pesan =
            isi &&
            typeof isi === "object" &&
            "error" in isi &&
            typeof isi.error === "string"
              ? isi.error
              : "Produk belum dapat disimpan. Coba lagi.";
          setGalat(pesan);
          return;
        }

        setModalTerbuka(false);
        tampilkanToast({
          varian: "sukses",
          pesan: sedangEdit
            ? `Perubahan ${nilai.nama} berhasil disimpan.`
            : `${nilai.nama} berhasil ditambahkan.`,
        });
        window.dispatchEvent(new Event("notifikasi:segarkan"));
        router.refresh();
      } catch {
        setGalat("Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.");
      }
    });
  }

  return (
    <>
      <PageHeader
        judul="Produk & resep"
        subjudul={ringkasanProduk}
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

      <div ref={refHasil}>
        {terlihat.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {terlihat.map((p) => (
              <KartuProduk
                key={p.id}
                produk={p}
                onEdit={() => bukaEdit(p)}
                onLihatHistori={() => setProdukHistori(p)}
                onHapus={() => {
                  setAkanDihapus(p);
                  setGalatHapus(null);
                }}
              />
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
      </div>

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
      <ModalHistoriHargaJual
        produk={produkHistori}
        terbuka={produkHistori !== null}
        onTutup={() => setProdukHistori(null)}
      />
      <ModalKonfirmasiHapus
        terbuka={akanDihapus !== null}
        judul="Hapus produk"
        nama={akanDihapus?.nama ?? ""}
        keterangan="Resep produk ini ikut terhapus. Bahan bakunya tetap ada, hanya kaitannya yang hilang."
        galat={galatHapus}
        menghapus={menyimpan}
        onTutup={() => setAkanDihapus(null)}
        onHapus={hapus}
      />
    </>
  );
}

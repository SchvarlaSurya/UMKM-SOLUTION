"use client";

import { useState, useTransition } from "react";
import { tambahProduk } from "@/lib/actions/produk";
import { Button } from "@/components/ui/Button";
import { IconTambah } from "@/components/ui/icons";
import type { BahanBaku } from "@/lib/types";
import { ModalProduk, type NilaiFormProduk } from "./ModalProduk";

/**
 * Tombol "Tambah produk" beserta modalnya, supaya halaman yang memakainya
 * tetap bisa berupa Server Component. Dipakai dashboard; halaman Produk &
 * Resep punya tombolnya sendiri karena di sana modal yang sama juga dipakai
 * untuk menyunting.
 */
export function TombolTambahProduk({ bahan }: { bahan: BahanBaku[] }) {
  const [menyimpan, mulaiSimpan] = useTransition();
  const [terbuka, setTerbuka] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  function simpan(nilai: NilaiFormProduk) {
    setGalat(null);
    mulaiSimpan(async () => {
      const hasil = await tambahProduk(nilai);

      if (!hasil.ok) {
        setGalat(hasil.error);
        return;
      }

      setTerbuka(false);
    });
  }

  return (
    <>
      <Button
        varian="primary"
        // Resep butuh minimal satu bahan, jadi produk tidak bisa dibuat
        // sebelum ada bahan baku yang tercatat.
        disabled={bahan.length === 0}
        title={bahan.length === 0 ? "Catat bahan baku dulu sebelum membuat produk." : undefined}
        onClick={() => {
          setGalat(null);
          setTerbuka(true);
        }}
      >
        <IconTambah width={16} height={16} />
        Tambah produk
      </Button>

      <ModalProduk
        terbuka={terbuka}
        mode="tambah"
        produk={null}
        bahan={bahan}
        menyimpan={menyimpan}
        galatServer={galat}
        onTutup={() => setTerbuka(false)}
        onSimpan={simpan}
      />
    </>
  );
}

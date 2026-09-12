import { AppShell } from "@/components/layout/AppShell";
import { HalamanProduk } from "@/components/produk/HalamanProduk";
import type { BahanBaku, ProdukDenganHpp } from "@/lib/types";

const bahan: BahanBaku[] = [
  {
    id: 1,
    nama: "Ayam fillet",
    satuan: "kg",
    hargaPerSatuan: 42000,
    updatedAt: "2026-09-12T00:00:00.000Z",
  },
  {
    id: 2,
    nama: "Beras",
    satuan: "kg",
    hargaPerSatuan: 15000,
    updatedAt: "2026-09-12T00:00:00.000Z",
  },
  {
    id: 3,
    nama: "Cabai rawit",
    satuan: "kg",
    hargaPerSatuan: 65000,
    updatedAt: "2026-09-12T00:00:00.000Z",
  },
];

const produk: ProdukDenganHpp[] = [
  {
    id: 1,
    nama: "Nasi Ayam Geprek",
    kategori: "Makanan utama",
    hargaJual: 22000,
    modePenentuanHarga: "targetMargin",
    targetMarginPersen: 25,
    hppTerhitung: 13240,
    marginPersen: 34.8,
    statusAman: true,
    resep: [
      { produkId: 1, bahanBakuId: 1, jumlahDipakai: 0.18, bahanBaku: bahan[0] },
      { produkId: 1, bahanBakuId: 2, jumlahDipakai: 0.2, bahanBaku: bahan[1] },
      { produkId: 1, bahanBakuId: 3, jumlahDipakai: 0.05, bahanBaku: bahan[2] },
    ],
  },
  {
    id: 2,
    nama: "Es Teh Manis",
    kategori: "Minuman",
    hargaJual: 6000,
    modePenentuanHarga: "manual",
    targetMarginPersen: null,
    hppTerhitung: 2400,
    marginPersen: 55,
    statusAman: true,
    resep: [
      { produkId: 2, bahanBakuId: 2, jumlahDipakai: 0.03, bahanBaku: bahan[1] },
    ],
  },
];

export default function UiPreviewPage() {
  return (
    <AppShell
      profil={{
        namaUsaha: "Dapur Uji",
        kategoriUsaha: "Usaha kuliner",
        namaPemilik: "Akun Uji",
        peran: "Pemilik usaha",
      }}
    >
      <HalamanProduk produk={produk} bahan={bahan} />
    </AppShell>
  );
}

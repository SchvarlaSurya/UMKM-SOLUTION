import { HalamanProduk } from "@/components/produk/HalamanProduk";
import { getBahanBaku, getProdukDenganHpp } from "@/lib/data";

export default async function ProdukPage() {
  const [produk, bahan] = await Promise.all([getProdukDenganHpp(), getBahanBaku()]);

  return <HalamanProduk produk={produk} bahan={bahan} />;
}

import { HalamanProduk } from "@/components/produk/HalamanProduk";
import { getBahanBaku, getBiayaOperasional, getPengaturan, getProduk } from "@/lib/data";

export default async function ProdukPage() {
  const [produk, bahan, biaya, pengaturan] = await Promise.all([
    getProduk(),
    getBahanBaku(),
    getBiayaOperasional(),
    getPengaturan(),
  ]);

  return (
    <HalamanProduk
      produkAwal={produk}
      bahan={bahan}
      biaya={biaya}
      pengaturan={pengaturan}
    />
  );
}

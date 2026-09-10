import { HalamanBahanBaku } from "@/components/bahan-baku/HalamanBahanBaku";
import { getBahanBaku, getPemakaianBahan } from "@/lib/data";

export default async function BahanBakuPage() {
  const [bahan, pemakaian] = await Promise.all([getBahanBaku(), getPemakaianBahan()]);

  return (
    <HalamanBahanBaku bahan={bahan} pemakaian={Object.fromEntries(pemakaian)} />
  );
}

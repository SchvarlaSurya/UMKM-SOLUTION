import { HalamanTren } from "@/components/tren/HalamanTren";
import {
  getBahanBerhistori,
  getHistoriHarga,
  getPemakaianBahan,
  getStatusTren,
} from "@/lib/data";
import type { HistoriHarga } from "@/lib/types";
import type { TrendResult } from "@/lib/trendAnalyzer";

export default async function TrenHargaPage() {
  const [bahan, pemakaian] = await Promise.all([getBahanBerhistori(), getPemakaianBahan()]);

  const perBahan = await Promise.all(
    bahan.map(async (b) => {
      const [catatan, tren] = await Promise.all([getHistoriHarga(b.id), getStatusTren(b.id)]);
      return { id: b.id, catatan, tren };
    }),
  );

  const histori: Record<number, HistoriHarga[]> = {};
  const tren: Record<number, TrendResult> = {};
  for (const item of perBahan) {
    histori[item.id] = [...item.catatan].sort(
      (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime(),
    );
    tren[item.id] = item.tren;
  }

  return (
    <HalamanTren
      bahan={bahan}
      histori={histori}
      pemakaian={Object.fromEntries(pemakaian)}
      tren={tren}
    />
  );
}

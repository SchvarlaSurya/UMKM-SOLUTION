import { WidgetHargaBahan } from "@/components/charts/WidgetHargaBahan";
import { AlertMargin } from "@/components/dashboard/AlertMargin";
import { PanelCatatanMargin } from "@/components/dashboard/PanelCatatanMargin";
import { RingkasanCards } from "@/components/dashboard/RingkasanCards";
import { TabelMargin } from "@/components/dashboard/TabelMargin";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { IconTambah } from "@/components/ui/icons";
import {
  getBahanBerhistori,
  getDeretHarga,
  getProdukDenganHpp,
  getRincianHppSemua,
  getRingkasanDashboard,
  type TitikHarga,
} from "@/lib/data";

export default async function DashboardPage() {
  const [produk, rincian, ringkasan, bahanBerhistori] = await Promise.all([
    getProdukDenganHpp(),
    getRincianHppSemua(),
    getRingkasanDashboard(),
    getBahanBerhistori(),
  ]);

  const deretPerBahan = await Promise.all(
    bahanBerhistori.map(async (b) => [b.id, await getDeretHarga(b.id)] as const),
  );
  const deret: Record<number, TitikHarga[]> = Object.fromEntries(deretPerBahan);

  return (
    <>
      <PageHeader
        label="Kesehatan usaha"
        judul="Kenali angka. Jaga untung."
        subjudul="Pantau HPP dan margin setiap produk, tanpa biaya yang terlewat."
        aksi={
          <Button varian="primary">
            <IconTambah width={16} height={16} />
            Tambah produk
          </Button>
        }
      />

      <RingkasanCards ringkasan={ringkasan} />

      <AlertMargin
        namaProduk={ringkasan.namaPerluPerhatian}
        batasMargin={ringkasan.batasMarginAman}
      />

      <TabelMargin produk={produk} rincian={rincian} />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <WidgetHargaBahan bahan={bahanBerhistori} deret={deret} />
        </div>
        <div className="lg:col-span-2">
          <PanelCatatanMargin biayaTetapPerPorsi={ringkasan.biayaTetapPerPorsi} />
        </div>
      </div>
    </>
  );
}

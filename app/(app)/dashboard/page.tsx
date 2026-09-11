import { WidgetHargaBahan } from "@/components/charts/WidgetHargaBahan";
import { AlertMargin } from "@/components/dashboard/AlertMargin";
import { LangkahAwal } from "@/components/dashboard/LangkahAwal";
import { PanelCatatanMargin } from "@/components/dashboard/PanelCatatanMargin";
import { RingkasanCards } from "@/components/dashboard/RingkasanCards";
import { TabelMargin } from "@/components/dashboard/TabelMargin";
import { TombolTambahProduk } from "@/components/produk/TombolTambahProduk";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  getBahanBaku,
  getBahanBerhistori,
  getDeretHarga,
  getProdukDenganHpp,
  getRincianHppSemua,
  getRingkasanDashboard,
  type TitikHarga,
} from "@/lib/data";

export default async function DashboardPage() {
  const [produk, rincian, ringkasan, bahanBerhistori, bahan] = await Promise.all([
    getProdukDenganHpp(),
    getRincianHppSemua(),
    getRingkasanDashboard(),
    getBahanBerhistori(),
    getBahanBaku(),
  ]);

  const deretPerBahan = await Promise.all(
    bahanBerhistori.map(async (b) => [b.id, await getDeretHarga(b.id)] as const),
  );
  const deret: Record<number, TitikHarga[]> = Object.fromEntries(deretPerBahan);

  // Akun yang baru mendaftar belum punya apa pun; tabel dan grafik kosong tidak
  // memberi tahu apa-apa, jadi ganti dengan urutan langkah pertama.
  const belumAdaData = produk.length === 0 && bahan.length === 0;

  return (
    <>
      <PageHeader
        label="Kesehatan usaha"
        judul="Kenali angka. Jaga untung."
        subjudul="Pantau HPP dan margin setiap produk, tanpa biaya yang terlewat."
        aksi={<TombolTambahProduk bahan={bahan} />}
      />

      <RingkasanCards ringkasan={ringkasan} />

      <AlertMargin
        namaProduk={ringkasan.namaPerluPerhatian}
        batasMargin={ringkasan.batasMarginAman}
      />

      {belumAdaData ? (
        <LangkahAwal />
      ) : (
        <>
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
      )}
    </>
  );
}

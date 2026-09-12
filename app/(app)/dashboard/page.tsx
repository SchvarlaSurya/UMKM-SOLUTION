import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { WidgetHargaBahan } from "@/components/charts/WidgetHargaBahan";
import { AlertMargin } from "@/components/dashboard/AlertMargin";
import { LangkahAwal } from "@/components/dashboard/LangkahAwal";
import { PanelCatatanMargin } from "@/components/dashboard/PanelCatatanMargin";
import { RingkasanCards } from "@/components/dashboard/RingkasanCards";
import { TabelMargin } from "@/components/dashboard/TabelMargin";
import { TombolTambahProduk } from "@/components/produk/TombolTambahProduk";
import { PageHeader } from "@/components/ui/PageHeader";
import { authOptions } from "@/lib/authOptions";
import { getDataDashboard } from "@/lib/data";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);
  if (!Number.isSafeInteger(userId) || userId <= 0) redirect("/login");

  const { produk, rincian, ringkasan, bahanBerhistori, bahan, deret } =
    await getDataDashboard(userId);

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

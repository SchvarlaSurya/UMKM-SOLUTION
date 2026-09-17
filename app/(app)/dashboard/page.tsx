import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { WidgetHargaBahan } from "@/components/charts/WidgetHargaBahan";
import { AlertHargaBasi } from "@/components/dashboard/AlertHargaBasi";
import { AlertMargin } from "@/components/dashboard/AlertMargin";
import { LangkahAwal } from "@/components/dashboard/LangkahAwal";
import { PanelCatatanMargin } from "@/components/dashboard/PanelCatatanMargin";
import { RingkasanCards } from "@/components/dashboard/RingkasanCards";
import { TabelMargin } from "@/components/dashboard/TabelMargin";
import { TombolTambahProduk } from "@/components/produk/TombolTambahProduk";
import { PageHeader } from "@/components/ui/PageHeader";
import { authOptions } from "@/lib/authOptions";
import { getDataDashboard } from "@/lib/data";
import { bahanHargaBasi } from "@/lib/hargaBasi";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);
  if (!Number.isSafeInteger(userId) || userId <= 0) redirect("/login");

  const { produk, rincian, ringkasan, bahanBerhistori, bahan, deret } =
    await getDataDashboard(userId);

  // Akun yang baru mendaftar belum punya apa pun; tabel dan grafik kosong tidak
  // memberi tahu apa-apa, jadi ganti dengan urutan langkah pertama.
  const belumAdaData = produk.length === 0 && bahan.length === 0;

  const basi = bahanHargaBasi(bahan);

  // Dihitung dari resep produk yang memang sudah dimuat halaman ini, bukan
  // lewat query pemakaian tersendiri seperti halaman bahan baku. Hasilnya sama
  // — keduanya menghitung baris resep per bahan — tanpa menambah beban query
  // pada halaman yang paling sering dibuka.
  const pemakaian: Record<number, number> = {};
  for (const item of produk) {
    for (const baris of item.resep) {
      pemakaian[baris.bahanBakuId] = (pemakaian[baris.bahanBakuId] ?? 0) + 1;
    }
  }

  return (
    <>
      <PageHeader
        judul="Ringkasan usaha"
        aksi={<TombolTambahProduk bahan={bahan} />}
      />

      <RingkasanCards ringkasan={ringkasan} />

      <AlertMargin
        namaProduk={ringkasan.namaPerluPerhatian}
        batasMargin={ringkasan.batasMarginAman}
      />

      <AlertHargaBasi basi={basi} pemakaian={pemakaian} />

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

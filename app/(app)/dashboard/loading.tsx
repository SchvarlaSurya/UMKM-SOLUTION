import { Badge } from "@/components/ui/Badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { MobileDataList, MobileDataListItem } from "@/components/ui/MobileDataList";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TBody, TD, TH, THead, TR, TableFooterNote } from "@/components/ui/Table";
import { IconCentang } from "@/components/ui/icons";

/**
 * Tampil selama dashboard menghitung ulang HPP semua produk. Bentuknya meniru
 * page.tsx urutan demi urutan; teks statis dirender asli supaya tidak melompat
 * saat konten masuk. AlertMargin sengaja tidak diberi slot karena kondisional.
 */
export default function MemuatDashboard() {
  return (
    <>
      <p role="status" className="sr-only">
        Memuat dashboard…
      </p>

      <PageHeader
        judul="Ringkasan usaha"
        aksi={<Skeleton nada="latar" bentuk="kotak" className="h-10 w-36" />}
      />

      {/* RingkasanCards: 4 StatCard */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="flex h-full flex-col justify-between p-5">
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="my-0.5 h-4 w-24" />
              <Skeleton bentuk="kotak" className="size-5" />
            </div>
            <Skeleton className="mt-3 h-9 w-20" />
            <Skeleton className="mt-3 h-3 w-36" />
          </Card>
        ))}
      </div>

      {/* TabelMargin */}
      <Card>
        <CardHeader className="flex-col items-stretch gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>Margin produk</CardTitle>
                <Skeleton bentuk="pil" className="h-5 w-7" />
              </div>
              <CardDescription className="mt-1">
                HPP sudah termasuk bahan baku dan biaya operasional.
              </CardDescription>
            </div>
            <Badge varian="success" ikon={<IconCentang width={13} height={13} />}>
              Terhitung otomatis
            </Badge>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <Skeleton bentuk="kotak" className="h-8 w-28" />
              <Skeleton bentuk="kotak" className="h-8 w-32" />
              <Skeleton bentuk="kotak" className="h-8 w-16" />
            </div>
            <Skeleton bentuk="kotak" className="h-9 w-full sm:w-56" />
          </div>
        </CardHeader>

        <div className="mt-4 hidden md:block">
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Nama produk</TH>
                <TH className="text-right">HPP / porsi</TH>
                <TH className="text-right">Harga jual</TH>
                <TH>Margin</TH>
                <TH>Status</TH>
                <TH className="text-right">Detail</TH>
              </TR>
            </THead>
            <TBody>
              {[0, 1, 2, 3, 4].map((i) => (
                <TR key={i} className="hover:bg-transparent">
                  <TD>
                    <Skeleton className="my-0.5 h-4 w-32" />
                    <Skeleton className="mt-1.5 h-3 w-20" />
                  </TD>
                  <TD>
                    <Skeleton className="ml-auto h-4 w-20" />
                  </TD>
                  <TD>
                    <Skeleton className="ml-auto h-4 w-20" />
                  </TD>
                  <TD>
                    <Skeleton className="my-0.5 h-4 w-12" />
                    <Skeleton bentuk="pil" className="mt-1.5 h-1.5 w-20" />
                  </TD>
                  <TD>
                    <Skeleton bentuk="pil" className="h-5 w-16" />
                  </TD>
                  <TD>
                    <Skeleton bentuk="kotak" className="ml-auto size-8" />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>

        <MobileDataList>
          {[0, 1, 2, 3].map((i) => (
            <MobileDataListItem key={i}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-2 h-3 w-20" />
                </div>
                <Skeleton bentuk="pil" className="h-5 w-20" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[0, 1, 2].map((j) => (
                  <div key={j}>
                    <Skeleton className="h-3 w-14" />
                    <Skeleton className="mt-2 h-4 w-16" />
                  </div>
                ))}
              </div>
              <Skeleton bentuk="pil" className="mt-3 h-1.5 w-full" />
              <Skeleton bentuk="kotak" className="mt-4 h-8 w-full" />
            </MobileDataListItem>
          ))}
        </MobileDataList>

        <TableFooterNote
          kiri={<Skeleton className="inline-block h-3 w-40 align-middle" />}
          kanan="Margin = (harga jual − HPP) ÷ harga jual"
        />
      </Card>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* WidgetHargaBahan */}
        <div className="lg:col-span-3">
          <Card className="flex h-full flex-col">
            <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-start">
              <div>
                <CardTitle>Pergerakan harga bahan</CardTitle>
                <Skeleton className="mt-1.5 h-4 w-48" />
              </div>
              <Skeleton bentuk="kotak" className="h-9 w-36 sm:ml-auto" />
            </CardHeader>

            <div className="px-5 pt-4">
              <Skeleton className="h-8 w-32" />
            </div>

            <div className="mt-2 h-48 w-full px-2 pb-2">
              <Skeleton bentuk="kotak" className="size-full" />
            </div>

            <div className="mt-auto border-t border-border px-5 py-3">
              <Skeleton className="my-0.5 h-4 w-20" />
            </div>
          </Card>
        </div>

        {/* PanelCatatanMargin */}
        <div className="lg:col-span-2">
          <section className="flex h-full flex-col rounded-card border border-success-border bg-success-bg px-5 py-5">
            <Skeleton nada="sukses" bentuk="kotak" className="size-9" />
            <Skeleton nada="sukses" className="mt-4 h-3 w-28" />
            <Skeleton nada="sukses" className="mt-2 h-6 w-32" />
            <Skeleton nada="sukses" className="mt-1 h-6 w-40" />
            <Skeleton nada="sukses" className="mt-3 h-4 w-full" />
            <Skeleton nada="sukses" className="mt-1.5 h-4 w-3/4" />
            <div className="mt-5 flex items-center justify-between gap-3 rounded-card bg-card px-4 py-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton nada="sukses" className="mt-4 h-4 w-44" />
          </section>
        </div>
      </div>
    </>
  );
}

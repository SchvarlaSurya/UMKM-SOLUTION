import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { MobileDataList, MobileDataListItem } from "@/components/ui/MobileDataList";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TBody, TD, TH, THead, TR, TableFooterNote } from "@/components/ui/Table";

/** Meniru HalamanTren (saat ada data): card grafik lalu tabel catatan perubahan. */
export default function MemuatTrenHarga() {
  return (
    <>
      <p role="status" className="sr-only">
        Memuat tren harga…
      </p>

      <PageHeader
        judul="Tren harga bahan"
        subjudul={<Skeleton nada="latar" className="my-0.5 h-4 w-64" />}
      />

      {/* Grafik histori */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Histori harga bahan baku</CardTitle>
            <Skeleton className="mt-1.5 h-4 w-44" />
          </div>
          <Skeleton bentuk="kotak" className="h-9 w-36" />
        </CardHeader>

        <div className="grid gap-4 px-5 pt-5 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-card border border-border px-4 py-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="mt-2 h-6 w-24" />
            </div>
          ))}
        </div>

        <div className="mt-2 h-64 w-full px-3 pb-4">
          <Skeleton bentuk="kotak" className="size-full" />
        </div>
      </Card>

      {/* Catatan perubahan */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-1.5">
            <CardTitle>Catatan perubahan ·</CardTitle>
            <Skeleton className="h-5 w-28" />
          </div>
          <Skeleton className="my-0.5 h-4 w-28" />
        </CardHeader>

        <div className="mt-4 hidden md:block">
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Tanggal</TH>
                {/* Satuan berasal dari data bahan, jadi hanya "Harga" di sini */}
                <TH className="text-right">Harga</TH>
                <TH className="text-right">Perubahan</TH>
              </TR>
            </THead>
            <TBody>
              {[0, 1, 2, 3, 4].map((i) => (
                <TR key={i} className="hover:bg-transparent">
                  <TD>
                    <Skeleton className="h-4 w-28" />
                  </TD>
                  <TD>
                    <Skeleton className="ml-auto h-4 w-24" />
                  </TD>
                  <TD>
                    <Skeleton className="ml-auto h-4 w-20" />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>

        <MobileDataList className="mt-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <MobileDataListItem key={i}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="mt-2 h-3 w-24" />
                </div>
                <div>
                  <Skeleton className="ml-auto h-4 w-24" />
                  <Skeleton className="mt-2 ml-auto h-3 w-16" />
                </div>
              </div>
            </MobileDataListItem>
          ))}
        </MobileDataList>

        <TableFooterNote
          kiri={<Skeleton className="inline-block h-3 w-28 align-middle" />}
          kanan="Setiap pembaruan harga bahan tercatat otomatis"
        />
      </Card>
    </>
  );
}

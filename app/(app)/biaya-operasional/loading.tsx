import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TBody, TD, TH, THead, TR, TableFooterNote } from "@/components/ui/Table";

/** Meniru HalamanBiayaOperasional: card alokasi biaya tetap, lalu tabel biaya. */
export default function MemuatBiayaOperasional() {
  return (
    <>
      <p role="status" className="sr-only">
        Memuat biaya operasional…
      </p>

      <PageHeader
        label="Kelola usaha"
        judul="Biaya operasional"
        subjudul="Masukkan biaya yang sering luput dari perhitungan."
        aksi={<Skeleton nada="latar" bentuk="kotak" className="h-10 w-36" />}
      />

      {/* Alokasi biaya tetap */}
      <Card>
        <CardHeader className="flex-col items-stretch">
          <div>
            <CardTitle>Alokasi biaya tetap</CardTitle>
            <CardDescription className="mt-1">
              Biaya bulanan dibagi ke total porsi seluruh produk.
            </CardDescription>
          </div>
        </CardHeader>

        <div className="grid gap-5 px-5 py-5 md:grid-cols-3">
          {[0, 1].map((i) => (
            <div key={i}>
              <Skeleton className="my-0.5 h-4 w-36" />
              <Skeleton bentuk="kotak" className="mt-1.5 h-10 w-full" />
              <Skeleton className="mt-2 h-3 w-44" />
            </div>
          ))}

          <div className="flex flex-col justify-center rounded-card border border-success-border bg-success-bg px-4 py-3">
            <Skeleton nada="sukses" className="h-3 w-28" />
            <Skeleton nada="sukses" className="mt-2 h-8 w-28" />
            <Skeleton nada="sukses" className="mt-2 h-3 w-36" />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
          <Skeleton className="h-3 w-52" />
          <Skeleton bentuk="kotak" className="h-8 w-36" />
        </div>
      </Card>

      {/* Daftar biaya */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Daftar biaya operasional</CardTitle>
            <Skeleton bentuk="pil" className="h-5 w-7" />
          </div>
        </CardHeader>

        <div className="mt-4">
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Nama biaya</TH>
                <TH>Jenis</TH>
                <TH className="text-right">Nilai</TH>
                <TH>Dasar perhitungan</TH>
                <TH className="text-right">Aksi</TH>
              </TR>
            </THead>
            <TBody>
              {[0, 1, 2, 3].map((i) => (
                <TR key={i} className="hover:bg-transparent">
                  <TD>
                    <Skeleton className="h-4 w-32" />
                  </TD>
                  <TD>
                    <Skeleton bentuk="pil" className="h-5 w-16" />
                  </TD>
                  <TD>
                    <Skeleton className="ml-auto h-4 w-20" />
                  </TD>
                  <TD>
                    <Skeleton className="h-4 w-44" />
                  </TD>
                  <TD>
                    <span className="flex items-center justify-end gap-2">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton bentuk="kotak" className="size-8" />
                    </span>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>

        <TableFooterNote
          kiri={<Skeleton className="inline-block h-3 w-24 align-middle" />}
          kanan="Biaya tetap masuk HPP, biaya persentase memotong margin"
        />
      </Card>
    </>
  );
}

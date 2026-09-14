import { Banner } from "@/components/ui/Banner";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TBody, TD, TH, THead, TR, TableFooterNote } from "@/components/ui/Table";

/** Meniru HalamanBahanBaku: header, banner info, dan tabel bahan. */
export default function MemuatBahanBaku() {
  return (
    <>
      <p role="status" className="sr-only">
        Memuat bahan baku…
      </p>

      <PageHeader
        label="Kelola usaha"
        judul="Bahan baku"
        subjudul="Satu harga diperbarui, semua resep terkait ikut terhitung."
        aksi={<Skeleton nada="latar" bentuk="kotak" className="h-10 w-36" />}
      />

      <Banner varian="info">
        Perubahan harga akan menghitung ulang HPP seluruh produk yang memakai bahan ini.
      </Banner>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Daftar bahan baku</CardTitle>
            <Skeleton bentuk="pil" className="h-5 w-7" />
          </div>
          <Skeleton bentuk="kotak" className="h-9 w-56" />
        </CardHeader>

        <div className="mt-4">
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Nama bahan</TH>
                <TH>Satuan</TH>
                <TH className="text-right">Harga / satuan</TH>
                <TH>Dipakai di</TH>
                <TH className="text-right">Aksi</TH>
              </TR>
            </THead>
            <TBody>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <TR key={i} className="hover:bg-transparent">
                  <TD>
                    <Skeleton className="my-0.5 h-4 w-32" />
                    <Skeleton className="mt-1.5 h-3 w-36" />
                  </TD>
                  <TD>
                    <Skeleton className="h-4 w-10" />
                  </TD>
                  <TD>
                    <Skeleton className="ml-auto h-4 w-24" />
                  </TD>
                  <TD>
                    <Skeleton className="h-4 w-16" />
                  </TD>
                  <TD>
                    <span className="flex items-center justify-end gap-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton bentuk="kotak" className="size-8" />
                    </span>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>

        <TableFooterNote
          kiri={<Skeleton className="inline-block h-3 w-36 align-middle" />}
          kanan="Harga dipakai untuk menghitung HPP setiap resep terkait"
        />
      </Card>
    </>
  );
}

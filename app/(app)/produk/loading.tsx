import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";

/** Meniru HalamanProduk: baris filter lalu grid KartuProduk. */
export default function MemuatProduk() {
  return (
    <>
      <p role="status" className="sr-only">
        Memuat produk…
      </p>

      <PageHeader
        label="Kelola usaha"
        judul="Produk & resep"
        subjudul="Takaran yang tepat membuat HPP lebih akurat."
        aksi={<Skeleton nada="latar" bentuk="kotak" className="h-10 w-36" />}
      />

      {/* Tab filter dan kotak cari duduk langsung di latar halaman */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Skeleton nada="latar" bentuk="kotak" className="h-8 w-32" />
          <Skeleton nada="latar" bentuk="kotak" className="h-8 w-32" />
          <Skeleton nada="latar" bentuk="kotak" className="h-8 w-16" />
        </div>
        <Skeleton nada="latar" bentuk="kotak" className="h-9 w-64" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="flex h-full flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <Skeleton bentuk="kotak" className="size-9" />
              <Skeleton bentuk="pil" className="h-5 w-16" />
            </div>

            <Skeleton className="mt-4 h-3 w-16" />
            <Skeleton className="mt-1.5 h-5 w-40" />
            <Skeleton className="mt-1.5 h-3 w-28" />

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
              {[0, 1].map((j) => (
                <div key={j}>
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="mt-1.5 h-4 w-20" />
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
              <Skeleton className="h-4 w-24" />
              <span className="inline-flex items-center gap-2">
                <Skeleton bentuk="kotak" className="size-8" />
                <Skeleton className="h-4 w-20" />
                <Skeleton bentuk="kotak" className="size-8" />
              </span>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

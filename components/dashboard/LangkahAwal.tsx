import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { IconBahan, IconBiaya, IconPanahKanan, IconProduk } from "@/components/ui/icons";

type Langkah = {
  ikon: ReactNode;
  judul: string;
  deskripsi: string;
  href: string;
  aksi: string;
};

/** Urutannya bukan selera: resep butuh bahan, dan HPP butuh biaya operasional. */
const LANGKAH: Langkah[] = [
  {
    ikon: <IconBahan />,
    judul: "Catat bahan baku",
    deskripsi: "Mulai dari bahan yang paling sering dibeli beserta harga belinya.",
    href: "/bahan-baku",
    aksi: "Tambah bahan",
  },
  {
    ikon: <IconBiaya />,
    judul: "Catat biaya operasional",
    deskripsi: "Gas, listrik, kemasan, dan komisi aplikasi ikut memotong untung tiap porsi.",
    href: "/biaya-operasional",
    aksi: "Tambah biaya",
  },
  {
    ikon: <IconProduk />,
    judul: "Buat produk & resepnya",
    deskripsi: "Isi takaran per porsi, lalu HPP dan marginnya terhitung otomatis.",
    href: "/produk",
    aksi: "Tambah produk",
  },
];

/** Tampilan dashboard untuk akun yang belum punya data sama sekali. */
export function LangkahAwal() {
  return (
    <Card>
      <CardHeader className="flex-col items-stretch">
        <div>
          <CardTitle>Tiga langkah sebelum angkanya muncul</CardTitle>
          <CardDescription className="mt-1">
            Dashboard terisi sendiri begitu bahan, biaya, dan produk sudah tercatat.
          </CardDescription>
        </div>
      </CardHeader>

      <ol className="grid gap-4 px-5 py-5 md:grid-cols-3">
        {LANGKAH.map((langkah, urutan) => (
          <li
            key={langkah.href}
            className="flex flex-col rounded-card border border-border px-4 py-4"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-card bg-accent text-accent-foreground">
                {langkah.ikon}
              </span>
              <span className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                Langkah {urutan + 1}
              </span>
            </div>

            <p className="mt-3 text-sm font-semibold text-foreground">{langkah.judul}</p>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{langkah.deskripsi}</p>

            <Link
              href={langkah.href}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4"
            >
              {langkah.aksi}
              <IconPanahKanan width={14} height={14} />
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}

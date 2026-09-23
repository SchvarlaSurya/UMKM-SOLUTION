import type { ReactNode } from "react";
import { IconBahan, IconDashboard, IconToko } from "@/components/ui/icons";
import { Eyebrow, JudulBagian } from "./BagianStatis";

/** Urutannya sama dengan panduan langkah awal di dashboard akun baru. */
const LANGKAH: { ikon: ReactNode; judul: string; deskripsi: string }[] = [
  {
    ikon: <IconToko />,
    judul: "Buat akun & profil usaha",
    deskripsi: "Isi nama dan jenis usahamu. Data setiap akun terpisah dari pengguna lain.",
  },
  {
    ikon: <IconBahan />,
    judul: "Catat bahan, biaya, dan resep",
    deskripsi:
      "Masukkan harga beli bahan, biaya bulanan seperti gas dan listrik, lalu takaran per porsi.",
  },
  {
    ikon: <IconDashboard />,
    judul: "Pantau HPP & margin",
    deskripsi:
      "HPP dan margin terhitung sendiri. Saat harga bahan diperbarui, angkanya ikut menyesuaikan.",
  },
];

export function BagianLangkah() {
  return (
    <section
      id="mulai"
      className="scroll-mt-20 border-t border-border bg-card py-18 lg:py-24"
      aria-labelledby="judul-langkah"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
        <div className="mb-10 max-w-3xl">
          <Eyebrow>05 / CARA MULAI</Eyebrow>
          <JudulBagian id="judul-langkah">Tiga langkah sampai angkanya muncul.</JudulBagian>
        </div>

        <ol className="grid gap-4 md:grid-cols-3">
          {LANGKAH.map((langkah, urutan) => (
            <li key={langkah.judul} className="flex flex-col rounded-card border border-border p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-card bg-accent text-accent-foreground">
                  {langkah.ikon}
                </span>
                <span className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  Langkah {urutan + 1}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
                {langkah.judul}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{langkah.deskripsi}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

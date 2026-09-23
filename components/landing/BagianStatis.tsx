import Link from "next/link";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { IconPanahKanan } from "@/components/ui/icons";
import { Merek } from "./Merek";

/** Label kecil di atas judul bagian, misalnya "01 / KENALI YANG TERLEWAT". */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="mb-5 block text-xs font-semibold tracking-widest text-primary">
      {children}
    </span>
  );
}

export function JudulBagian({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl lg:text-5xl"
    >
      {children}
    </h2>
  );
}

const RINCIAN_BIAYA = [
  {
    nama: "Ayam 100 gram",
    ket: "Harga per kg naik Rp 15.000",
    nilai: "Rp 5.500",
    catatan: "Sebelumnya Rp 4.000",
  },
  { nama: "Bahan lainnya", ket: "Beras, bumbu, dan pelengkap", nilai: "Rp 6.500", catatan: "Tetap" },
  {
    nama: "Alokasi biaya tetap",
    ket: "Biaya bulanan dibagi estimasi porsi",
    nilai: "Rp 1.500",
    catatan: "Per porsi",
  },
];

export function BagianMasalah() {
  return (
    <section
      id="masalah"
      className="scroll-mt-20 border-t border-border bg-card py-18 lg:py-24"
      aria-labelledby="judul-masalah"
    >
      <div className="mx-auto grid w-full max-w-6xl items-start gap-10 px-4 sm:px-8 lg:grid-cols-2 lg:gap-24">
        <div>
          <Eyebrow>01 / KENALI YANG TERLEWAT</Eyebrow>
          <JudulBagian id="judul-masalah">
            Penjualan tetap ramai.
            <br />
            Biayanya sudah berbeda.
          </JudulBagian>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Harga belanja minggu lalu belum tentu sama dengan hari ini. Gas, listrik, dan biaya usaha
            juga perlu masuk hitungan setiap porsi.
          </p>
          <a
            href="#simulasi"
            className="mt-4 inline-flex min-h-11 items-center gap-1.5 font-medium text-primary hover:underline underline-offset-4"
          >
            Lihat pengaruhnya pada menumu
            <IconPanahKanan width={16} height={16} />
          </a>
        </div>

        <div>
          <dl className="tabular-nums">
            {RINCIAN_BIAYA.map((baris) => (
              <div
                key={baris.nama}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-border py-5"
              >
                <dt className="font-medium text-foreground">
                  {baris.nama}
                  <small className="block text-sm font-normal text-muted-foreground">{baris.ket}</small>
                </dt>
                <dd className="text-right font-medium text-foreground">
                  {baris.nilai}
                  <small className="block text-sm font-normal text-muted-foreground">
                    {baris.catatan}
                  </small>
                </dd>
              </div>
            ))}
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b-2 border-primary py-5 text-lg font-semibold text-primary">
              <dt>HPP sebenarnya</dt>
              <dd className="text-right">Rp 13.500</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            Contoh simulasi nasi ayam. Harga jual tetap Rp 20.000; selisih per porsi turun Rp 1.500.
          </p>
        </div>
      </div>
    </section>
  );
}

const TABEL_BUKTI = [
  { komponen: "Harga jual / porsi", sebelum: "Rp 20.000", sesudah: "Rp 20.000" },
  { komponen: "HPP / porsi", sebelum: "Rp 12.000", sesudah: "Rp 13.500" },
  { komponen: "Margin", sebelum: "40%", sesudah: "32,5%" },
];

export function BagianBukti() {
  return (
    <section id="bukti" className="scroll-mt-20 py-18 lg:py-24" aria-labelledby="judul-bukti">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 sm:px-8 lg:grid-cols-2 lg:gap-24">
        <div>
          <Eyebrow>04 / ANGKA YANG BISA DIPERIKSA</Eyebrow>
          <JudulBagian id="judul-bukti">
            Selisih kecil per porsi.
            <br />
            Terasa di 100 pesanan.
          </JudulBagian>
          <p className="mt-6 mb-3 text-5xl font-semibold tracking-tighter text-primary tabular-nums sm:text-7xl">
            Rp 150.000
          </p>
          <p className="max-w-xl text-lg text-muted-foreground">
            lebih sedikit pada 100 porsi ketika HPP naik Rp 1.500 dan harga jual tetap.
          </p>
        </div>

        <div>
          <div className="rounded-card border border-border bg-card p-5 sm:p-6">
            <table className="w-full border-collapse text-sm tabular-nums">
              <caption className="mb-3 text-left font-semibold text-foreground">
                Contoh tetap · 100 porsi nasi ayam
              </caption>
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th scope="col" className="py-3 text-left font-medium">
                    Komponen
                  </th>
                  <th scope="col" className="px-2 py-3 text-right font-medium">
                    Sebelum
                  </th>
                  <th scope="col" className="py-3 pl-2 text-right font-medium">
                    Sesudah
                  </th>
                </tr>
              </thead>
              <tbody>
                {TABEL_BUKTI.map((baris) => (
                  <tr key={baris.komponen} className="border-b border-border text-foreground">
                    <th scope="row" className="py-3.5 text-left font-normal">
                      {baris.komponen}
                    </th>
                    <td className="px-2 py-3.5 text-right">{baris.sebelum}</td>
                    <td className="py-3.5 pl-2 text-right">{baris.sesudah}</td>
                  </tr>
                ))}
                <tr className="font-semibold text-primary">
                  <th scope="row" className="py-3.5 text-left font-semibold">
                    Selisih untuk 100 porsi
                  </th>
                  <td className="px-2 py-3.5 text-right">Rp 800.000</td>
                  <td className="py-3.5 pl-2 text-right">Rp 650.000</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Ilustrasi perhitungan, bukan hasil pelanggan. HPP memakai alokasi biaya tetap pada estimasi
            1.200 porsi/bulan. Selisih ini bukan laba bersih bulanan; hasil usaha mengikuti biaya dan
            volume aktual.
          </p>
        </div>
      </div>
    </section>
  );
}

export function BagianPenutup() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-18 sm:px-8 lg:pb-24" aria-labelledby="judul-penutup">
      <div className="grid gap-7 rounded-b-2xl border-t-4 border-primary bg-accent p-6 sm:p-11 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <Eyebrow>MULAI DARI SATU MENU</Eyebrow>
          <JudulBagian id="judul-penutup">
            Sebelum menentukan harga,
            <br />
            kenali dulu marginnya.
          </JudulBagian>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Catat bahan dan biaya sekali, lalu biarkan HPP dan margin tiap produk terhitung sendiri
            setiap harga bahan berubah.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <ButtonLink href="/register" className="h-12 px-6 text-base">
            Daftar sekarang
          </ButtonLink>
          <ButtonLink href="/login" varian="secondary" className="h-12 px-6 text-base">
            Sudah punya akun? Masuk
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

export function FooterLanding() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-8">
        <Merek />
        <p className="text-sm text-muted-foreground">
          Kenali angka. Jaga untung. Dibuat untuk usaha kuliner Indonesia.
        </p>
        <Link
          href="#atas"
          className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline underline-offset-4"
        >
          Kembali ke atas ↑
        </Link>
      </div>
    </footer>
  );
}

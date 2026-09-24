import type { ReactNode } from "react";
import { MasukBerurutan } from "@/components/ui/MasukBerurutan";
import { MasukSaatTampil } from "@/components/ui/MasukSaatTampil";
import { Eyebrow, JudulBagian } from "./BagianStatis";
import { SimulasiMargin } from "./SimulasiMargin";

function Rincian({ ringkasan, children }: { ringkasan: string; children: ReactNode }) {
  return (
    <details className="group mt-5 text-sm">
      <summary className="flex min-h-11 cursor-pointer items-center font-medium text-primary">
        {ringkasan}
      </summary>
      <div className="flex max-w-3xl flex-col gap-2.5 text-muted-foreground">{children}</div>
    </details>
  );
}

export function BagianFitur() {
  return (
    <section
      id="fitur"
      className="scroll-mt-20 border-t border-border py-18 lg:py-24"
      aria-labelledby="judul-fitur"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
        <MasukSaatTampil className="mb-9 max-w-3xl">
          <Eyebrow>02 / DARI RESEP KE KEPUTUSAN</Eyebrow>
          <JudulBagian id="judul-fitur">
            Lima cara menjaga
            <br />
            hitungan usahamu.
          </JudulBagian>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Mulai dari biaya bahan, periksa perubahan, lalu tentukan harga dan jumlah penjualan yang
            perlu dicapai.
          </p>
        </MasukSaatTampil>

        <MasukBerurutan className="mb-8 grid gap-7 md:grid-cols-2 md:gap-10">
          <article className="py-2">
            <span className="mb-3 inline-block text-xs font-semibold tracking-wider text-primary">
              01 · HPP OTOMATIS
            </span>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              Setiap biaya punya tempat.
            </h3>
            <p className="mt-3 text-muted-foreground">
              Ruang Margin menjumlahkan bahan sesuai resep dan alokasi biaya tetap per porsi. Kamu
              bisa melihat asal angkanya, termasuk biaya yang sering terlewat.
            </p>
            <Rincian ringkasan="Lihat contoh rincian HPP">
              <p>
                Bahan Rp 10.500 + alokasi biaya tetap Rp 1.500 = HPP Rp 12.000. Alokasi berasal dari
                biaya tetap Rp 1.800.000 dibagi estimasi 1.200 porsi per bulan.
              </p>
            </Rincian>
          </article>

          <article className="rounded-card border border-warning-border bg-warning-bg p-6">
            <span className="mb-3 inline-block text-xs font-semibold tracking-wider text-warning">
              02 · PEMERIKSAAN HARGA
            </span>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              Harga lama perlu dicek lagi.
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Peringatan membantu menemukan harga bahan yang sudah lama tidak diperbarui, sebelum
              dipakai menghitung margin.
            </p>
            <div className="mt-5 mb-2.5 flex flex-wrap justify-between gap-2 border-t border-warning-border pt-3.5 text-sm">
              <span className="text-foreground">Ayam · Rp 40.000/kg</span>
              <strong className="font-semibold text-warning">Perlu diperiksa</strong>
            </div>
            <p className="text-sm text-muted-foreground">
              Contoh: terakhir diperbarui 21 hari lalu. Ini umur data harga, bukan kondisi bahan.
            </p>
          </article>
        </MasukBerurutan>

        <SimulasiMargin />

        <Rincian ringkasan="Periksa asumsi dan rumus simulasi">
          <p>
            Contoh ini memakai 100 gram ayam dan bahan lain Rp 6.500 per porsi, biaya tetap
            Rp 1.800.000 per bulan, estimasi produksi 1.200 porsi, serta komisi 0%. HPP = total bahan
            + Rp 1.500 alokasi biaya tetap.
          </p>
          <p>
            Margin = (harga jual − HPP) ÷ harga jual × 100%. Harga sesuai target = HPP ÷ (1 − target
            margin). Harga kemudian dibulatkan ke atas ke kelipatan Rp 500 untuk demo ini.
          </p>
          <p>
            Titik impas = biaya tetap ÷ (harga jual − biaya bahan), dibulatkan ke atas ke porsi utuh.
            Alokasi biaya tetap tidak dihitung lagi sebagai biaya variabel. Jika kontribusi nol atau
            negatif, titik impas belum dapat dicapai.
          </p>
        </Rincian>
      </div>
    </section>
  );
}

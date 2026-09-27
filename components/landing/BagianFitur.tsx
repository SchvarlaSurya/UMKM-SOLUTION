import type { ReactNode } from "react";
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
        <div className="mb-9 max-w-3xl">
          <Eyebrow>02 / DARI RESEP SAMPAI HARGA</Eyebrow>
          <JudulBagian id="judul-fitur">
            Lima cara menjaga
            <br />
            hitungan usahamu.
          </JudulBagian>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Mulai dari biaya bahan, cek harga yang berubah, lalu tentukan harga jual dan berapa
            porsi yang perlu terjual.
          </p>
        </div>

        <div className="mb-8 grid gap-7 md:grid-cols-2 md:gap-10">
          <article className="py-2">
            <span className="mb-3 inline-block text-xs font-semibold tracking-wider text-primary">
              01 · MODAL TERHITUNG SENDIRI
            </span>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              Tidak ada biaya yang terlewat.
            </h3>
            <p className="mt-3 text-muted-foreground">
              Ruang Margin menjumlahkan semua bahan sesuai resepmu, lalu menambahkan bagian biaya
              bulanan untuk tiap porsi. Kamu bisa lihat angkanya datang dari mana.
            </p>
            <Rincian ringkasan="Lihat contoh rinciannya">
              <p>
                Bahan Rp 10.500 + bagian biaya bulanan Rp 1.500 = modal Rp 12.000 per porsi. Bagian
                biaya bulanan itu dari Rp 1.800.000 sebulan dibagi 1.200 porsi.
              </p>
            </Rincian>
          </article>

          <article className="rounded-card border border-warning-border bg-warning-bg p-6">
            <span className="mb-3 inline-block text-xs font-semibold tracking-wider text-warning">
              02 · PENGINGAT HARGA LAMA
            </span>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              Harga lama perlu dicek lagi.
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Ruang Margin menandai bahan yang harganya sudah lama tidak diperbarui, sebelum
              angkanya terlanjur dipakai menghitung untung.
            </p>
            <div className="mt-5 mb-2.5 flex flex-wrap justify-between gap-2 border-t border-warning-border pt-3.5 text-sm">
              <span className="text-foreground">Ayam · Rp 40.000/kg</span>
              <strong className="font-semibold text-warning">Perlu diperiksa</strong>
            </div>
            <p className="text-sm text-muted-foreground">
              Contoh: terakhir diperbarui 21 hari lalu. Yang sudah lama itu catatan harganya, bukan
              bahannya.
            </p>
          </article>
        </div>

        <SimulasiMargin />

        <Rincian ringkasan="Lihat angka contoh dan cara hitungnya">
          <p>
            Contoh ini memakai 100 gram ayam, bahan lain Rp 6.500 per porsi, biaya bulanan
            Rp 1.800.000, dan 1.200 porsi per bulan. Modal per porsi = total bahan + Rp 1.500 bagian
            biaya bulanan.
          </p>
          <p>
            Untung (%) = (harga jual − modal) ÷ harga jual × 100. Harga sesuai target = modal ÷
            (1 − target untung), lalu dibulatkan ke atas ke kelipatan Rp 500.
          </p>
          <p>
            Porsi untuk balik modal = biaya bulanan ÷ (harga jual − biaya bahan), dibulatkan ke atas
            ke porsi utuh. Kalau harga jualnya belum melebihi biaya bahan, biaya bulanan tidak akan
            pernah tertutup.
          </p>
        </Rincian>
      </div>
    </section>
  );
}

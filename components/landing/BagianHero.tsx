import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { IconPanahTurun } from "@/components/ui/icons";

/** Satu baris batang: bagian biaya lalu sisa selisih harga jual. */
function BatangMargin({
  label,
  hpp,
  persenBiaya,
  tipis,
}: {
  label: string;
  hpp: string;
  persenBiaya: number;
  tipis?: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <strong className="font-semibold text-foreground">{hpp}</strong>
      </div>
      <div className="flex h-3 gap-0.5" aria-hidden="true">
        <span className="rounded-sm bg-muted-foreground/60" style={{ width: `${persenBiaya}%` }} />
        <span
          className={tipis ? "rounded-sm bg-warning" : "rounded-sm bg-primary"}
          style={{ width: `${100 - persenBiaya}%` }}
        />
      </div>
    </div>
  );
}

/** Kartu ilustrasi di samping judul: satu menu yang marginnya tergerus. */
function VisualMargin() {
  return (
    <figure
      className="w-full rounded-2xl bg-accent p-4 motion-safe:animate-tiba sm:p-7"
      aria-label="Contoh margin nasi ayam turun dari 40 persen ke 32,5 persen"
    >
      <figcaption className="mb-4 flex justify-between gap-3 text-xs text-primary">
        <strong className="font-semibold">Satu menu. Biaya yang berubah.</strong>
        <span>Simulasi</span>
      </figcaption>

      <div className="rounded-card border border-border bg-card shadow-[0_14px_30px_rgba(23,99,75,0.06)]">
        <div className="flex justify-between gap-4 border-b border-border p-5">
          <div>
            <strong className="block font-semibold text-foreground">Nasi ayam</strong>
            <span className="text-sm text-muted-foreground">Harga jual tetap Rp 20.000 / porsi</span>
          </div>
          <svg
            width="36"
            height="36"
            viewBox="0 0 40 40"
            fill="none"
            aria-hidden="true"
            className="shrink-0 text-primary"
          >
            <rect x="5" y="3" width="29" height="34" rx="5" stroke="currentColor" strokeWidth="1.7" />
            <path
              d="M12 12h15M12 19h6M12 26h6M23 20l3 3 5-6"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="p-5 tabular-nums">
          <p className="text-sm text-muted-foreground">Margin setelah harga bahan naik</p>
          <div className="mt-2 mb-2 flex items-baseline gap-3">
            <strong className="text-5xl font-semibold tracking-tighter text-primary sm:text-6xl">
              32,5<span className="text-2xl text-muted-foreground">%</span>
            </strong>
            <span className="text-lg text-muted-foreground">dari 40%</span>
          </div>
          <Badge varian="warning" ikon={<IconPanahTurun width={12} height={12} />}>
            Di bawah target 40%
          </Badge>

          <div className="mt-6 grid gap-3">
            <BatangMargin label="Sebelum kenaikan" hpp="HPP Rp 12.000" persenBiaya={60} />
            <BatangMargin label="Sesudah kenaikan" hpp="HPP Rp 13.500" persenBiaya={67.5} tipis />
          </div>

          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <i className="size-2 bg-muted-foreground/60" aria-hidden="true" />
              Biaya per porsi
            </span>
            <span className="flex items-center gap-1.5">
              <i className="size-2 bg-primary" aria-hidden="true" />
              Selisih harga jual dan HPP
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-card border border-warning-border bg-warning-bg p-4 text-sm text-warning">
        <strong className="block font-semibold">Harga ayam berubah. Hitungan ikut berubah.</strong>
        Rp 40.000 menjadi Rp 55.000/kg berarti tambahan Rp 1.500 untuk setiap porsi.
      </div>
    </figure>
  );
}

export function BagianHero() {
  return (
    <section
      className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-10 pb-16 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-20 lg:pb-24"
      aria-labelledby="judul-hero"
    >
      <div>
        <span className="mb-5 block text-xs font-semibold tracking-widest text-primary">
          HPP & MARGIN UNTUK USAHA KULINER
        </span>
        <h1
          id="judul-hero"
          className="text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl"
        >
          Harga bahan naik.
          <br />
          <span className="text-primary">Margin tergerus</span> tanpa terasa.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Hitung biaya setiap porsi, lihat margin yang tersisa, dan tentukan harga jual sesuai
          target. Ruang Margin membantumu mengambil keputusan dari angka yang jelas.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <ButtonLink href="/register" className="h-12 px-6 text-base">
            Mulai catat usahamu
          </ButtonLink>
          <ButtonLink href="#simulasi" varian="secondary" className="h-12 px-6 text-base">
            Coba simulasi dulu
          </ButtonLink>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Simulasi bisa dicoba langsung di halaman ini, tanpa akun.
        </p>
      </div>

      <div className="mx-auto w-full max-w-xl">
        <VisualMargin />
      </div>
    </section>
  );
}

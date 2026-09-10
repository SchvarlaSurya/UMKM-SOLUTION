import Link from "next/link";
import { IconPanahKanan, IconPerisai } from "@/components/ui/icons";
import { formatRupiah } from "@/lib/format";

/** Panel edukasi di bawah kanan dashboard. */
export function PanelCatatanMargin({ biayaTetapPerPorsi }: { biayaTetapPerPorsi: number }) {
  return (
    <section className="flex h-full flex-col rounded-card border border-success-border bg-success-bg px-5 py-5">
      <span className="flex size-9 items-center justify-center rounded-card bg-card text-primary">
        <IconPerisai />
      </span>

      <p className="mt-4 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
        Catatan margin
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
        Biaya kecil.
        <br />
        Dampaknya besar.
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Gas, listrik, dan komisi ikut memotong untung setiap porsi. Semuanya sudah masuk
        dalam HPP-mu.
      </p>

      <div className="mt-5 flex items-center justify-between gap-3 rounded-card bg-card px-4 py-3">
        <span className="text-sm text-muted-foreground">Operasional tetap / porsi</span>
        <span className="text-sm font-semibold text-foreground">
          {formatRupiah(biayaTetapPerPorsi)}
        </span>
      </div>

      <Link
        href="/biaya-operasional"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4"
      >
        Tinjau biaya operasional
        <IconPanahKanan width={14} height={14} />
      </Link>
    </section>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function PageHeader({
  label,
  judul,
  subjudul,
  aksi,
}: {
  label?: string;
  judul: string;
  subjudul?: ReactNode;
  aksi?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {label && (
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {label}
          </p>
        )}
        {/* Jarak atas hanya kalau ada label di atasnya, kalau tidak judulnya
            menggantung jauh dari tepi. */}
        <h1
          className={cn(
            "text-2xl font-semibold tracking-tight text-foreground sm:text-3xl",
            label && "mt-2",
          )}
        >
          {judul}
        </h1>
        {/* <div>, bukan <p>: loading.tsx mengisinya dengan batang Skeleton,
            dan <div> di dalam <p> bukan sarang HTML yang sah. */}
        {subjudul && (
          <div className="mt-2 max-w-xl text-sm text-muted-foreground">{subjudul}</div>
        )}
      </div>
      {aksi && <div className="shrink-0">{aksi}</div>}
    </header>
  );
}

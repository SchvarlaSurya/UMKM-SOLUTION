import type { ReactNode } from "react";

export function PageHeader({
  label,
  judul,
  subjudul,
  aksi,
}: {
  label?: string;
  judul: string;
  subjudul?: string;
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
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {judul}
        </h1>
        {subjudul && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{subjudul}</p>}
      </div>
      {aksi && <div className="shrink-0">{aksi}</div>}
    </header>
  );
}

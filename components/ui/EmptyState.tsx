import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function EmptyState({
  ikon,
  judul,
  deskripsi,
  aksi,
  className,
}: {
  ikon?: ReactNode;
  judul: string;
  deskripsi?: ReactNode;
  aksi?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border bg-card px-6 py-14 text-center",
        className,
      )}
    >
      {ikon && (
        <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
          {ikon}
        </span>
      )}
      <div>
        <p className="text-sm font-semibold text-foreground">{judul}</p>
        {deskripsi && (
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{deskripsi}</p>
        )}
      </div>
      {aksi}
    </div>
  );
}

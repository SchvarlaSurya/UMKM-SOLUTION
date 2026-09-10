import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Card } from "./Card";

/**
 * Summary card dashboard: label kecil, angka besar, subtext/link,
 * ikon dekoratif di kanan atas.
 */
export function StatCard({
  label,
  nilai,
  satuan,
  subtext,
  aksi,
  ikon,
  nada = "default",
  className,
}: {
  label: string;
  nilai: ReactNode;
  satuan?: string;
  subtext?: ReactNode;
  aksi?: ReactNode;
  ikon?: ReactNode;
  nada?: "default" | "warning";
  className?: string;
}) {
  return (
    <Card className={cn("flex h-full flex-col justify-between p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        {ikon && (
          <span className={cn("text-muted-foreground", nada === "warning" && "text-warning")}>
            {ikon}
          </span>
        )}
      </div>

      <p className="mt-3 flex items-baseline gap-1.5">
        <span
          className={cn(
            "text-3xl font-semibold tracking-tight",
            nada === "warning" ? "text-warning" : "text-foreground",
          )}
        >
          {nilai}
        </span>
        {satuan && <span className="text-sm text-muted-foreground">{satuan}</span>}
      </p>

      {subtext && <p className="mt-3 text-xs text-muted-foreground">{subtext}</p>}
      {aksi && <div className="mt-3">{aksi}</div>}
    </Card>
  );
}

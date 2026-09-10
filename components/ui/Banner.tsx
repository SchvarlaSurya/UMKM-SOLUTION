import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconInfo, IconPeringatan } from "./icons";

type BannerVarian = "info" | "warning";

const varianClass: Record<BannerVarian, string> = {
  info: "border-info-border bg-info-bg text-info",
  warning: "border-warning-border bg-warning-bg text-warning",
};

const ikonDefault: Record<BannerVarian, ReactNode> = {
  info: <IconInfo />,
  warning: <IconPeringatan />,
};

/**
 * Banner kontekstual: menjelaskan konsekuensi sebuah aksi (varian info)
 * atau menandai kondisi yang perlu perhatian (varian warning).
 */
export function Banner({
  varian = "info",
  judul,
  children,
  aksi,
  className,
}: {
  varian?: BannerVarian;
  judul?: ReactNode;
  children?: ReactNode;
  aksi?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start gap-3 rounded-card border px-4 py-3.5",
        varianClass[varian],
        className,
      )}
    >
      <span className="mt-0.5 shrink-0">{ikonDefault[varian]}</span>
      <div className="min-w-40 flex-1">
        {judul && <p className="text-sm font-semibold">{judul}</p>}
        {children && (
          <div className={cn("text-sm text-foreground/80", judul ? "mt-1" : "")}>{children}</div>
        )}
      </div>
      {aksi && <div className="shrink-0 self-center">{aksi}</div>}
    </div>
  );
}

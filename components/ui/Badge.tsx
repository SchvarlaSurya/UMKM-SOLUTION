import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeVarian = "success" | "warning" | "neutral" | "count";

const varianClass: Record<BadgeVarian, string> = {
  success: "border-success-border bg-success-bg text-success",
  warning: "border-warning-border bg-warning-bg text-warning",
  neutral: "border-border bg-muted text-muted-foreground",
  count: "border-transparent bg-accent text-accent-foreground",
};

export function Badge({
  children,
  varian = "neutral",
  ikon,
  className,
}: {
  children: ReactNode;
  varian?: BadgeVarian;
  ikon?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        varianClass[varian],
        className,
      )}
    >
      {ikon}
      {children}
    </span>
  );
}

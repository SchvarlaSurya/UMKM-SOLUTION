"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";

export type TabItem = {
  id: string;
  label: string;
  jumlah?: number;
};

/**
 * Filter tab ala prototipe ("Semua produk / Perlu perhatian (N) / Aman").
 * Terkontrol bila `nilai` diberikan, selain itu memakai state internal.
 */
export function Tabs({
  items,
  nilai,
  onChange,
  className,
}: {
  items: TabItem[];
  nilai?: string;
  onChange?: (id: string) => void;
  className?: string;
}) {
  const groupId = useId();
  const [internal, setInternal] = useState(items[0]?.id ?? "");
  const aktif = nilai ?? internal;

  function pilih(id: string) {
    if (nilai === undefined) setInternal(id);
    onChange?.(id);
  }

  return (
    <div role="tablist" aria-label="Filter" className={cn("flex flex-wrap gap-1", className)}>
      {items.map((item) => {
        const terpilih = item.id === aktif;
        return (
          <button
            key={item.id}
            id={`${groupId}-${item.id}`}
            role="tab"
            type="button"
            aria-selected={terpilih}
            onClick={() => pilih(item.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-card px-3 py-1.5 text-sm font-medium transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              terpilih
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
            {item.jumlah !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs",
                  terpilih ? "bg-primary/10 text-primary" : "bg-border text-muted-foreground",
                )}
              >
                {item.jumlah}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

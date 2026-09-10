"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { IconChevronKanan, IconMenu } from "@/components/ui/icons";
import { formatTanggal, inisial } from "@/lib/format";
import { labelDariPath } from "./nav-items";

/** Tanggal tidak berubah selama sesi, jadi store-nya tidak perlu berlangganan. */
const langgananKosong = () => () => {};

export function Topbar({
  namaPemilik,
  onBukaMenu,
}: {
  namaPemilik: string;
  onBukaMenu: () => void;
}) {
  const pathname = usePathname();
  const label = labelDariPath(pathname);

  // Tanggal hanya dihitung di client: halaman di-prerender statis, jadi hasil
  // render server akan basi dan berbeda dari tanggal pengguna.
  const tanggal = useSyncExternalStore(
    langgananKosong,
    () => formatTanggal(new Date()),
    () => null,
  );

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          varian="ghost"
          ukuran="sm"
          onClick={onBukaMenu}
          aria-label="Buka menu"
          className="px-2 lg:hidden"
        >
          <IconMenu />
        </Button>
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm">
          <span className="hidden text-muted-foreground sm:inline">Ruang usaha</span>
          <IconChevronKanan
            width={14}
            height={14}
            className="hidden shrink-0 text-muted-foreground sm:inline"
          />
          <span className="truncate font-medium text-foreground">{label}</span>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <Badge varian="neutral" className="hidden sm:inline-flex">
          Data demo
        </Badge>
        <span className="hidden min-w-28 text-right text-xs text-muted-foreground md:inline">
          {tanggal}
        </span>
        <span className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
          {inisial(namaPemilik)}
        </span>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { inisial } from "@/lib/format";
import { navItems } from "./nav-items";
import { IconBenih, IconKeluar, IconPanahKanan, IconToko, IconTutup } from "@/components/ui/icons";
import { Button } from "@/components/ui/Button";

type SidebarProps = {
  namaUsaha: string;
  kategoriUsaha: string;
  namaPemilik: string;
  peran: string;
  /** Dipakai versi drawer di layar kecil. */
  onTutup?: () => void;
};

export function Sidebar({
  namaUsaha,
  kategoriUsaha,
  namaPemilik,
  peran,
  onTutup,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center justify-between gap-2 px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-sidebar-foreground">
          <span className="flex size-8 items-center justify-center rounded-card bg-primary text-primary-foreground">
            <IconBenih width={18} height={18} />
          </span>
          <span className="text-sm font-semibold tracking-tight">
            ruang<span className="text-primary">margin</span>
          </span>
        </Link>
        {onTutup && (
          <Button varian="ghost" ukuran="sm" onClick={onTutup} aria-label="Tutup menu" className="px-2 lg:hidden">
            <IconTutup />
          </Button>
        )}
      </div>

      <div className="mx-3 flex items-center gap-3 rounded-card border border-sidebar-border bg-background px-3 py-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-card bg-accent text-accent-foreground">
          <IconToko width={18} height={18} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-sidebar-foreground">
            {namaUsaha}
          </span>
          <span className="block truncate text-xs text-muted-foreground">{kategoriUsaha}</span>
        </span>
      </div>

      <nav aria-label="Navigasi utama" className="mt-5 flex-1 px-3">
        <p className="px-2 pb-2 text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Ruang usaha
        </p>
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const aktif =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Ikon = item.ikon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={aktif ? "page" : undefined}
                  onClick={onTutup}
                  className={cn(
                    "flex items-center gap-2.5 rounded-card px-2.5 py-2 text-sm transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    aktif
                      ? "bg-sidebar-accent font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Ikon width={18} height={18} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mx-3 mb-3 rounded-card bg-accent px-3 py-3.5">
        <span className="flex size-7 items-center justify-center rounded-full bg-card text-primary">
          <IconBenih width={16} height={16} />
        </span>
        <p className="mt-2.5 text-sm font-semibold text-accent-foreground">
          Untung dimulai dari tahu.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Perbarui harga bahan secara rutin agar HPP tetap akurat.
        </p>
        <Link
          href="/bahan-baku"
          onClick={onTutup}
          className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline underline-offset-4"
        >
          Cek bahan baku
          <IconPanahKanan width={14} height={14} />
        </Link>
      </div>

      <div className="flex items-center gap-2.5 border-t border-sidebar-border px-4 py-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
          {inisial(namaPemilik)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-sidebar-foreground">{peran}</span>
          <span className="block text-xs text-muted-foreground">Mode demo</span>
        </span>
        <Button varian="ghost" ukuran="sm" aria-label="Keluar" className="px-2">
          <IconKeluar width={18} height={18} />
        </Button>
      </div>
    </div>
  );
}

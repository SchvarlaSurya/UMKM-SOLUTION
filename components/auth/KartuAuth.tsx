import Link from "next/link";
import type { ReactNode } from "react";
import { IconBenih } from "@/components/ui/icons";
import { PanelSambutan } from "./PanelSambutan";

/**
 * Kerangka halaman masuk & daftar: panel sambutan di kiri, form di kanan.
 *
 * Dari lg ke bawah panelnya disembunyikan dan form memakai seluruh lebar,
 * karena di layar kecil ruang lebih berguna untuk isian daripada hiasan.
 */
export function KartuAuth({
  varian,
  judul,
  subjudul,
  children,
  footer,
}: {
  /** Menentukan kata-kata di panel kiri. */
  varian: "masuk" | "daftar";
  judul: string;
  subjudul: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-screen flex-1 bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <PanelSambutan varian={varian} />

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          {/* Brand hanya perlu diulang di layar kecil; di layar besar sudah ada di panel. */}
          <Link
            href="/"
            className="flex items-center justify-center gap-2 text-foreground lg:hidden"
            aria-label="Ruang Margin"
          >
            <span className="flex size-9 items-center justify-center rounded-card bg-primary text-primary-foreground">
              <IconBenih width={20} height={20} />
            </span>
            <span className="text-base font-semibold tracking-tight">
              ruang<span className="text-primary">margin</span>
            </span>
          </Link>

          <div className="mt-6 lg:mt-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{judul}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{subjudul}</p>
            <div className="mt-6">{children}</div>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">{footer}</p>
        </div>
      </main>
    </div>
  );
}

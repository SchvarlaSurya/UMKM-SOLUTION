"use client";

import { type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAnimasiDrawer } from "./useAnimasiDrawer";

export type ProfilUsaha = {
  namaUsaha: string;
  kategoriUsaha: string;
  namaPemilik: string;
  peran: string;
  email?: string;
};

export function AppShell({
  profil,
  children,
}: {
  profil: ProfilUsaha;
  children: ReactNode;
}) {
  const { tampil, buka, tutup, refPembungkus, refPanel, refLatar } = useAnimasiDrawer();

  return (
    <div className="flex min-h-full flex-1">
      {/* Sidebar tetap di layar besar */}
      <aside className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar {...profil} />
        </div>
      </aside>

      {/* Drawer di layar kecil. `tampil` bertahan sampai animasi keluar
          selesai, jadi ini bukan penanda "menu sedang terbuka". */}
      {tampil && (
        <div ref={refPembungkus} className="fixed inset-0 z-40 lg:hidden">
          <button
            ref={refLatar}
            type="button"
            aria-label="Tutup menu"
            onClick={tutup}
            style={{ opacity: 0 }}
            className="absolute inset-0 bg-foreground/40"
          />
          <div
            ref={refPanel}
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi"
            tabIndex={-1}
            style={{ transform: "translateX(-100%)" }}
            className="absolute inset-y-0 left-0 h-full focus:outline-none"
          >
            <Sidebar {...profil} onTutup={tutup} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar namaPemilik={profil.namaPemilik} onBukaMenu={buka} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">{children}</div>
        </main>
        <footer className="border-t border-border px-4 py-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2">
            <span>ruangmargin · Setiap porsi, terhitung.</span>
            <span>HPP dihitung ulang setiap harga bahan berubah</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

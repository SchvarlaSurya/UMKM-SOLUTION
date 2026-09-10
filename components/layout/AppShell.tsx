"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export type ProfilUsaha = {
  namaUsaha: string;
  kategoriUsaha: string;
  namaPemilik: string;
  peran: string;
};

export function AppShell({
  profil,
  children,
}: {
  profil: ProfilUsaha;
  children: ReactNode;
}) {
  const [menuTerbuka, setMenuTerbuka] = useState(false);

  return (
    <div className="flex min-h-full flex-1">
      {/* Sidebar tetap di layar besar */}
      <aside className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar {...profil} />
        </div>
      </aside>

      {/* Drawer di layar kecil */}
      {menuTerbuka && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setMenuTerbuka(false)}
            className="absolute inset-0 bg-foreground/40"
          />
          <div className="absolute inset-y-0 left-0 h-full">
            <Sidebar {...profil} onTutup={() => setMenuTerbuka(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar namaPemilik={profil.namaPemilik} onBukaMenu={() => setMenuTerbuka(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">{children}</div>
        </main>
        <footer className="border-t border-border px-4 py-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2">
            <span>ruangmargin · Setiap porsi, terhitung.</span>
            <span>Data demo · belum tersambung ke basis data</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

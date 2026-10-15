"use client";

import { Button } from "@/components/ui/Button";
import "./globals.css";

/**
 * Cadangan terakhir kalau layout akar sendiri yang gagal. Berkas ini
 * menggantikan layout akar, jadi harus membawa <html>, <body>, dan stylesnya
 * sendiri. Galat di dalam halaman ditangani app/(app)/error.tsx.
 */
export default function GalatGlobal({ retry }: { retry: () => void }) {
  return (
    <html lang="id">
      <body className="flex min-h-screen items-center justify-center bg-background px-4">
        <title>Terjadi kesalahan — Ruang Margin</title>
        <div role="alert" className="flex max-w-md flex-col items-center gap-4 text-center">
          <h1 className="text-xl font-semibold text-foreground">Aplikasi gagal dimuat</h1>
          <p className="text-sm text-muted-foreground">
            Coba lagi sebentar lagi. Kalau masih gagal, muat ulang halaman ini.
          </p>
          <Button onClick={() => retry()}>Coba lagi</Button>
        </div>
      </body>
    </html>
  );
}

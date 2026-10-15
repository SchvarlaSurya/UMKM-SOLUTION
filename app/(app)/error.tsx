"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { IconPeringatan } from "@/components/ui/icons";

/**
 * Batas galat untuk semua halaman di grup (app).
 *
 * Layout grup ini berada di luar batasnya, jadi sidebar dan topbar tetap
 * tampil: pemilik usaha bisa langsung pindah halaman. Tanpa berkas ini, satu
 * galat dari Server Component atau Server Action mengganti seluruh tampilan
 * dengan halaman galat bawaan Next berbahasa Inggris, tanpa jalan kembali.
 *
 * Di production `error.message` dari server sudah disamarkan Next, jadi yang
 * ditampilkan hanya `digest`: cukup untuk dicocokkan dengan log server.
 */
export default function GalatHalaman({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="mx-auto mt-6 flex max-w-md flex-col items-center gap-4 rounded-card border border-border bg-card px-6 py-12 text-center"
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-warning-bg text-warning">
        <IconPeringatan />
      </span>
      <div>
        <h1 className="text-base font-semibold text-foreground">Halaman ini gagal dimuat</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Biasanya karena koneksi ke database sedang lambat. Coba lagi, dan kalau masih gagal,
          tunggu beberapa menit.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {/* retry() mengambil ulang data server, bukan sekadar menggambar ulang. */}
        <Button onClick={() => retry()}>Coba lagi</Button>
        <ButtonLink href="/dashboard" varian="secondary">
          Ke dashboard
        </ButtonLink>
      </div>
      {error.digest && (
        <p className="text-xs text-muted-foreground">
          Kode galat: <code className="font-mono">{error.digest}</code>
        </p>
      )}
    </div>
  );
}

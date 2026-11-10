"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AKUN_DEMO } from "@/lib/akunDemo";

/**
 * Kotak akun demo di halaman masuk: juri dan pengunjung yang ingin mencoba
 * aplikasi menekan satu tombol, lalu kolom email dan kata sandi terisi.
 *
 * Nilainya ditampilkan terang-terangan, bukan disembunyikan di balik tombol.
 * Kata sandinya memang publik (lihat lib/akunDemo.ts), dan menampilkannya
 * membuat pengunjung tahu persis akun apa yang akan dipakai sebelum menekan
 * apa pun. Tombolnya hanya mengisi kolom; yang masuk tetap tombol "Masuk",
 * supaya tidak ada login yang terjadi tanpa disadari.
 */
export function AkunDemoJuri({ onPakai }: { onPakai: (email: string, password: string) => void }) {
  const [terisi, setTerisi] = useState(false);

  return (
    <div className="rounded-card border border-info-border bg-info-bg px-4 py-3.5">
      <p className="text-sm font-semibold text-foreground">Akun demo untuk juri</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Ingin langsung mencoba? Akun ini sudah berisi contoh bahan, resep, dan produk.
      </p>

      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted-foreground">Email</dt>
        <dd className="font-mono break-all text-foreground">{AKUN_DEMO.email}</dd>
        <dt className="text-muted-foreground">Kata sandi</dt>
        <dd className="font-mono text-foreground">{AKUN_DEMO.password}</dd>
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <Button
          type="button"
          varian="secondary"
          ukuran="sm"
          onClick={() => {
            onPakai(AKUN_DEMO.email, AKUN_DEMO.password);
            setTerisi(true);
          }}
        >
          Isi otomatis
        </Button>
        <span role="status" className="text-xs text-success">
          {terisi ? "Terisi. Tekan Masuk untuk melanjutkan." : ""}
        </span>
      </div>
    </div>
  );
}

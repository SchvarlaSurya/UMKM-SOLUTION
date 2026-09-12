"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { IconRiwayat } from "@/components/ui/icons";
import { formatRupiah, formatTanggal } from "@/lib/format";
import type { HistoriHargaJual, ProdukDenganHpp } from "@/lib/types";

function pesanGalat(isi: unknown): string {
  if (
    isi &&
    typeof isi === "object" &&
    "error" in isi &&
    typeof isi.error === "string"
  ) {
    return isi.error;
  }
  return "Riwayat harga jual belum dapat dimuat.";
}

export function ModalHistoriHargaJual({
  produk,
  terbuka,
  onTutup,
}: {
  produk: ProdukDenganHpp | null;
  terbuka: boolean;
  onTutup: () => void;
}) {
  const [histori, setHistori] = useState<HistoriHargaJual[]>([]);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [percobaan, setPercobaan] = useState(0);

  useEffect(() => {
    if (!terbuka || !produk) return;

    const controller = new AbortController();

    async function ambilHistori() {
      setMemuat(true);
      setGalat(null);
      try {
        const respons = await fetch(
          `/api/produk/${produk!.id}/histori-harga-jual`,
          { cache: "no-store", signal: controller.signal },
        );
        const isi: unknown = await respons.json().catch(() => null);
        if (!respons.ok) throw new Error(pesanGalat(isi));
        setHistori(Array.isArray(isi) ? (isi as HistoriHargaJual[]) : []);
      } catch (error) {
        if (controller.signal.aborted) return;
        setGalat(error instanceof Error ? error.message : pesanGalat(null));
      } finally {
        if (!controller.signal.aborted) setMemuat(false);
      }
    }

    const timer = window.setTimeout(() => void ambilHistori(), 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [percobaan, produk, terbuka]);

  return (
    <Modal
      terbuka={terbuka}
      onTutup={onTutup}
      judul="Riwayat harga jual"
      subjudul={produk?.nama}
      lebar="lg"
      aksiPrimer={
        <Button varian="secondary" ukuran="sm" onClick={onTutup}>
          Tutup
        </Button>
      }
    >
      {memuat ? (
        <div className="space-y-3" aria-label="Memuat riwayat harga jual">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="grid animate-pulse grid-cols-[7rem_1fr] gap-4 rounded-card border border-border p-3 motion-reduce:animate-none"
            >
              <div className="h-3 rounded bg-muted" />
              <div className="space-y-2">
                <div className="h-3 rounded bg-muted" />
                <div className="h-3 w-2/3 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : galat ? (
        <div className="rounded-card border border-warning-border bg-warning-bg px-4 py-4">
          <p className="text-sm text-foreground">{galat}</p>
          <Button
            varian="link"
            ukuran="sm"
            className="mt-2"
            onClick={() => setPercobaan((nilai) => nilai + 1)}
          >
            Coba lagi
          </Button>
        </div>
      ) : histori.length > 0 ? (
        <ol className="space-y-3">
          {histori.map((item) => {
            const naik = item.hargaBaru > item.hargaLama;
            return (
              <li
                key={item.id}
                className="grid gap-3 rounded-card border border-border px-4 py-3 sm:grid-cols-[9rem_1fr]"
              >
                <time className="text-xs font-medium text-muted-foreground">
                  {formatTanggal(item.tanggal)}
                </time>
                <div>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-sm text-muted-foreground line-through">
                      {formatRupiah(item.hargaLama)}
                    </span>
                    <span aria-hidden="true" className="text-muted-foreground">
                      ke
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        naik ? "text-warning" : "text-success"
                      }`}
                    >
                      {formatRupiah(item.hargaBaru)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Alasan: {item.alasan}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="px-4 py-8 text-center">
          <span className="mx-auto flex size-10 items-center justify-center rounded-card bg-accent text-primary">
            <IconRiwayat width={20} height={20} />
          </span>
          <p className="mt-3 text-sm font-medium text-foreground">
            Belum ada perubahan harga jual
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
            Riwayat akan tercatat saat harga otomatis berubah karena biaya, resep,
            atau target margin.
          </p>
        </div>
      )}
    </Modal>
  );
}

"use client";

import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { IconPanahKanan } from "@/components/ui/icons";
import { formatPersen, formatRupiah } from "@/lib/format";
import type { RincianHpp } from "@/lib/hpp";

export function ModalRincianHpp({
  terbuka,
  onTutup,
  namaProduk,
  hargaJual,
  rincian,
}: {
  terbuka: boolean;
  onTutup: () => void;
  namaProduk: string;
  hargaJual: number;
  rincian: RincianHpp | null;
}) {
  if (!rincian) return null;

  return (
    <Modal
      terbuka={terbuka}
      onTutup={onTutup}
      judul="Rincian HPP"
      subjudul={namaProduk}
      lebar="lg"
      aksiPrimer={
        <ButtonLink href="/produk" varian="primary" ukuran="sm">
          Sesuaikan produk & resep
          <IconPanahKanan width={14} height={14} />
        </ButtonLink>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-success-border bg-success-bg px-4 py-3.5">
        <div>
          <p className="text-xs text-muted-foreground">HPP per porsi</p>
          <p className="mt-1 text-2xl font-semibold text-success">
            {formatRupiah(rincian.hppTerhitung)}
          </p>
        </div>
        <Badge varian={rincian.statusAman ? "success" : "warning"}>
          {rincian.statusAman ? "Aman" : "Margin rendah"} · {formatPersen(rincian.marginPersen)}
        </Badge>
      </div>

      <ul className="mt-4 divide-y divide-border">
        {rincian.baris.map((baris) => (
          <li key={baris.nama} className="flex items-start justify-between gap-4 py-2.5">
            <span>
              <span className="block text-sm text-foreground">{baris.nama}</span>
              <span className="block text-xs text-muted-foreground">{baris.subInfo}</span>
            </span>
            <span className="text-sm font-medium text-foreground whitespace-nowrap">
              {formatRupiah(baris.nilai)}
            </span>
          </li>
        ))}
        <li className="flex items-start justify-between gap-4 py-2.5">
          <span>
            <span className="block text-sm font-medium text-foreground">Sisa per porsi</span>
            <span className="block text-xs text-muted-foreground">
              Harga jual {formatRupiah(hargaJual)} dikurangi seluruh biaya di atas
            </span>
          </span>
          <span
            className={`text-sm font-semibold whitespace-nowrap ${
              rincian.sisaPerPorsi >= 0 ? "text-success" : "text-destructive"
            }`}
          >
            {formatRupiah(rincian.sisaPerPorsi)}
          </span>
        </li>
      </ul>
    </Modal>
  );
}

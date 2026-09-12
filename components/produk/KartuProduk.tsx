import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  IconBahan,
  IconCentang,
  IconHapus,
  IconPensil,
  IconPeringatan,
  IconProduk,
  IconRiwayat,
} from "@/components/ui/icons";
import { formatPersen, formatRupiah } from "@/lib/format";
import type { ProdukDenganHpp } from "@/lib/types";

/** Ikon dekoratif mengikuti kategori produk. */
function IkonKategori({ kategori }: { kategori: string }) {
  const k = kategori.toLowerCase();
  if (k.includes("minum")) return <IconBahan />;
  if (k.includes("pelengkap")) return <IconBahan />;
  return <IconProduk />;
}

export function KartuProduk({
  produk,
  onEdit,
  onLihatHistori,
  onHapus,
}: {
  produk: ProdukDenganHpp;
  onEdit: () => void;
  onLihatHistori: () => void;
  onHapus: () => void;
}) {
  return (
    <Card className="flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-9 items-center justify-center rounded-card bg-accent text-accent-foreground">
          <IkonKategori kategori={produk.kategori} />
        </span>
        {produk.statusAman ? (
          <Badge varian="success" ikon={<IconCentang width={13} height={13} />}>
            Aman
          </Badge>
        ) : (
          <Badge varian="warning" ikon={<IconPeringatan width={13} height={13} />}>
            Margin rendah
          </Badge>
        )}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">{produk.kategori}</p>
      <h3 className="mt-1 text-base font-semibold text-foreground">{produk.nama}</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {produk.resep.length} bahan · Takaran per porsi
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
        <div>
          <p className="text-xs text-muted-foreground">Harga jual</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            {formatRupiah(produk.hargaJual)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">HPP / porsi</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            {formatRupiah(produk.hppTerhitung)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span
          className={`text-sm font-semibold ${
            produk.statusAman ? "text-success" : "text-warning"
          }`}
        >
          Margin {formatPersen(produk.marginPersen)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Button
            varian="ghost"
            ukuran="sm"
            className="px-2"
            aria-label={`Lihat riwayat harga jual ${produk.nama}`}
            onClick={onLihatHistori}
          >
            <IconRiwayat width={15} height={15} />
          </Button>
          <Button varian="link" ukuran="sm" onClick={onEdit}>
            <IconPensil width={14} height={14} />
            Edit resep
          </Button>
          <Button
            varian="ghost"
            ukuran="sm"
            className="px-2 hover:text-destructive"
            aria-label={`Hapus ${produk.nama}`}
            onClick={onHapus}
          >
            <IconHapus width={16} height={16} />
          </Button>
        </span>
      </div>
    </Card>
  );
}

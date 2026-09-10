import Link from "next/link";
import { StatCard } from "@/components/ui/StatCard";
import {
  IconPanahKanan,
  IconPengaturan,
  IconPeringatan,
  IconProduk,
  IconTren,
} from "@/components/ui/icons";
import { formatPersen } from "@/lib/format";
import type { RingkasanDashboard } from "@/lib/data";

export function RingkasanCards({ ringkasan }: { ringkasan: RingkasanDashboard }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total produk"
        nilai={ringkasan.totalProduk}
        satuan="produk"
        subtext="Aktif dalam perhitungan HPP"
        ikon={<IconProduk />}
      />
      <StatCard
        label="Rata-rata margin"
        nilai={formatPersen(ringkasan.rataMargin)}
        subtext="Rata-rata sederhana seluruh produk"
        ikon={<IconTren />}
      />
      <StatCard
        label="Perlu perhatian"
        nilai={ringkasan.perluPerhatian}
        satuan="produk"
        subtext={`Margin di bawah batas ${formatPersen(ringkasan.batasMarginAman, 0)}`}
        nada={ringkasan.perluPerhatian > 0 ? "warning" : "default"}
        ikon={<IconPeringatan />}
      />
      <StatCard
        label="Batas margin aman"
        nilai={formatPersen(ringkasan.batasMarginAman, 0)}
        ikon={<IconPengaturan />}
        aksi={
          <Link
            href="/biaya-operasional"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline underline-offset-4"
          >
            Atur batas minimum
            <IconPanahKanan width={14} height={14} />
          </Link>
        }
      />
    </div>
  );
}

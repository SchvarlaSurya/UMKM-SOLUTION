import { navItems } from "@/components/layout/nav-items";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatCard } from "@/components/ui/StatCard";
import {
  IconCentang,
  IconLogo,
  IconPengaturan,
  IconPeringatan,
  IconProduk,
  IconTren,
} from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { formatPersen, formatRupiah } from "@/lib/format";
import { Eyebrow, JudulBagian } from "./BagianStatis";

/**
 * Tiruan dashboard dengan data demo, dirakit dari komponen yang sama dengan
 * halaman aslinya supaya rupanya ikut berubah kalau dashboard berubah.
 * Seluruh isinya `inert`: terlihat seperti aplikasi, tapi tidak bisa difokus
 * atau diklik.
 */

const BATAS_AMAN = 30;

const PRODUK_DEMO = [
  { nama: "Nasi ayam geprek", hpp: 13_500, jual: 20_000 },
  { nama: "Mie goreng spesial", hpp: 14_200, jual: 18_000 },
  { nama: "Es teh manis", hpp: 1_800, jual: 5_000 },
  { nama: "Ayam bakar madu", hpp: 19_800, jual: 25_000 },
  { nama: "Tahu crispy", hpp: 4_100, jual: 8_000 },
].map((p) => {
  const margin = ((p.jual - p.hpp) / p.jual) * 100;
  return { ...p, margin, aman: margin >= BATAS_AMAN };
});

const perhatian = PRODUK_DEMO.filter((p) => !p.aman);
const rataMargin = PRODUK_DEMO.reduce((jumlah, p) => jumlah + p.margin, 0) / PRODUK_DEMO.length;

function SidebarMini() {
  return (
    <aside className="hidden w-52 shrink-0 flex-col border-r border-border bg-sidebar p-3 lg:flex">
      <div className="flex items-center gap-2 px-2 py-2">
        <span className="flex size-8 items-center justify-center rounded-card bg-primary text-primary-foreground">
          <IconLogo width={18} height={18} />
        </span>
        <span className="text-sm font-semibold tracking-tight text-foreground">Dapur Bu Sari</span>
      </div>
      <ul className="mt-4 flex flex-col gap-1">
        {navItems.map(({ href, label, ikon: Ikon }, i) => (
          <li
            key={href}
            className={cn(
              "flex items-center gap-2.5 rounded-card px-2.5 py-2 text-sm",
              i === 0
                ? "bg-sidebar-accent font-medium text-primary"
                : "text-muted-foreground",
            )}
          >
            <Ikon width={18} height={18} />
            {label}
          </li>
        ))}
      </ul>
    </aside>
  );
}

function TabelMini() {
  return (
    <div className="rounded-card border border-border bg-card">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <p className="text-sm font-semibold text-foreground">Margin per produk</p>
        <span className="text-xs text-muted-foreground">{PRODUK_DEMO.length} produk</span>
      </div>
      <table className="mt-3 w-full text-sm tabular-nums">
        <thead>
          <tr className="border-y border-border text-left text-xs text-muted-foreground">
            <th className="px-4 py-2 font-medium">Produk</th>
            <th className="hidden px-2 py-2 text-right font-medium sm:table-cell">HPP</th>
            <th className="hidden px-2 py-2 text-right font-medium sm:table-cell">Harga jual</th>
            <th className="px-2 py-2 text-right font-medium">Margin</th>
            <th className="px-4 py-2 text-right font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {PRODUK_DEMO.map((p) => (
            <tr key={p.nama} className="border-b border-border last:border-0">
              <td className="px-4 py-2.5 font-medium text-foreground">{p.nama}</td>
              <td className="hidden px-2 py-2.5 text-right text-muted-foreground sm:table-cell">
                {formatRupiah(p.hpp)}
              </td>
              <td className="hidden px-2 py-2.5 text-right text-muted-foreground sm:table-cell">
                {formatRupiah(p.jual)}
              </td>
              <td className="px-2 py-2.5">
                <div className="flex items-center justify-end gap-2">
                  <ProgressBar nilai={p.margin} aman={p.aman} className="hidden md:block" />
                  <span className={p.aman ? "text-foreground" : "text-warning"}>
                    {formatPersen(p.margin)}
                  </span>
                </div>
              </td>
              <td className="px-4 py-2.5 text-right">
                {p.aman ? (
                  <Badge varian="success" ikon={<IconCentang width={12} height={12} />}>
                    Aman
                  </Badge>
                ) : (
                  <Badge varian="warning" ikon={<IconPeringatan width={12} height={12} />}>
                    Tipis
                  </Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LayarDashboard() {
  return (
    <div className="flex min-w-0 bg-background">
      <SidebarMini />
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:p-6">
        <p className="text-xl font-semibold tracking-tight text-foreground">Ringkasan usaha</p>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            label="Total produk"
            nilai={PRODUK_DEMO.length}
            satuan="produk"
            ikon={<IconProduk />}
          />
          <StatCard label="Rata-rata margin" nilai={formatPersen(rataMargin)} ikon={<IconTren />} />
          <StatCard
            label="Perlu perhatian"
            nilai={perhatian.length}
            satuan="produk"
            nada="warning"
            ikon={<IconPeringatan />}
          />
          <StatCard
            label="Batas margin aman"
            nilai={formatPersen(BATAS_AMAN, 0)}
            ikon={<IconPengaturan />}
          />
        </div>

        <Banner varian="warning" judul={`Ada ${perhatian.length} produk yang marginnya mulai bocor.`}>
          {perhatian.map((p) => p.nama).join(" dan ")} berada di bawah batas{" "}
          {formatPersen(BATAS_AMAN, 0)}.
        </Banner>

        <TabelMini />
      </div>
    </div>
  );
}

export function BagianPratinjau() {
  return (
    <section
      id="pratinjau"
      className="scroll-mt-20 overflow-hidden border-t border-border bg-card py-18 lg:py-24"
      aria-labelledby="judul-pratinjau"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
        <div className="mb-10 grid gap-5 lg:grid-cols-2 lg:items-end lg:gap-24">
          <div>
            <Eyebrow>03 / DI DALAM APLIKASI</Eyebrow>
            <JudulBagian id="judul-pratinjau">
              Satu layar untuk tahu
              <br />
              menu mana yang aman.
            </JudulBagian>
          </div>
          <p className="max-w-xl text-lg text-muted-foreground">
            Begitu bahan, biaya, dan resep tercatat, dashboard menghitung margin tiap produk dan
            menandai yang turun di bawah batas amanmu.
          </p>
        </div>

        <figure aria-label="Contoh tampilan dashboard Ruang Margin dengan data demo: lima produk, dua di antaranya bermargin di bawah 30 persen">
          <div className="overflow-hidden rounded-2xl border border-border shadow-[0_24px_60px_rgba(23,99,75,0.10)]">
            {/* Bingkai jendela peramban */}
            <div className="flex items-center gap-3 border-b border-border bg-muted px-4 py-2.5" aria-hidden="true">
              <span className="flex gap-1.5">
                <i className="size-2.5 rounded-full bg-border" />
                <i className="size-2.5 rounded-full bg-border" />
                <i className="size-2.5 rounded-full bg-border" />
              </span>
              <span className="truncate rounded-md bg-card px-3 py-1 text-xs text-muted-foreground">
                ruangmargin / dashboard
              </span>
            </div>
            <div inert aria-hidden="true">
              <LayarDashboard />
            </div>
          </div>
          <figcaption className="mt-4 text-xs text-muted-foreground">
            Contoh tampilan dengan data demo. Isi dashboard mengikuti bahan, biaya, dan produk yang kamu
            catat.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

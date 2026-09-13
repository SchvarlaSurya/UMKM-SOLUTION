import type { ComponentType, SVGProps } from "react";
import {
  IconBahan,
  IconBiaya,
  IconDashboard,
  IconProduk,
  IconTren,
} from "@/components/ui/icons";

export type NavItem = {
  href: string;
  label: string;
  ikon: ComponentType<SVGProps<SVGSVGElement>>;
};

/** Sumber tunggal untuk sidebar dan breadcrumb topbar. */
export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", ikon: IconDashboard },
  { href: "/bahan-baku", label: "Bahan baku", ikon: IconBahan },
  { href: "/biaya-operasional", label: "Biaya operasional", ikon: IconBiaya },
  { href: "/produk", label: "Produk & resep", ikon: IconProduk },
  { href: "/tren-harga", label: "Tren harga bahan", ikon: IconTren },
];

/**
 * Halaman yang punya breadcrumb tapi tidak muncul di daftar menu, karena
 * jalan masuknya lewat tempat lain.
 */
const LABEL_TAMBAHAN: Record<string, string> = {
  "/profil-usaha": "Profil usaha",
};

export function labelDariPath(pathname: string): string {
  const cocok = navItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  if (cocok) return cocok.label;

  const tambahan = Object.entries(LABEL_TAMBAHAN).find(
    ([href]) => pathname === href || pathname.startsWith(`${href}/`),
  );
  return tambahan?.[1] ?? "Dashboard";
}

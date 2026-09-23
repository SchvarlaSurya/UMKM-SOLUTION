import type { Metadata } from "next";
import { BagianFitur } from "@/components/landing/BagianFitur";
import { BagianHero } from "@/components/landing/BagianHero";
import {
  BagianBukti,
  BagianMasalah,
  BagianPenutup,
  FooterLanding,
} from "@/components/landing/BagianStatis";
import { BagianLangkah } from "@/components/landing/BagianLangkah";
import { BagianPratinjau } from "@/components/landing/BagianPratinjau";
import { HeaderLanding } from "@/components/landing/HeaderLanding";

export const metadata: Metadata = {
  title: "Ruang Margin — Tahu biaya, jaga laba",
  description:
    "Hitung HPP, pantau perubahan harga bahan, dan tentukan harga jual sesuai target margin usaha kuliner.",
};

/**
 * Landing page untuk pengunjung tanpa sesi. Pengunjung yang masih punya token
 * sesi sudah dialihkan ke /dashboard oleh proxy.ts sebelum halaman ini
 * dirender, jadi halaman ini tetap statis.
 */
export default function Home() {
  return (
    <div id="atas" data-landing className="flex min-h-screen flex-col bg-background">
      <a
        href="#utama"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-30 focus:rounded-card focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Lewati navigasi
      </a>
      <HeaderLanding />
      <main id="utama" className="flex-1">
        <BagianHero />
        <BagianMasalah />
        <BagianFitur />
        <BagianPratinjau />
        <BagianBukti />
        <BagianLangkah />
        <BagianPenutup />
      </main>
      <FooterLanding />
    </div>
  );
}

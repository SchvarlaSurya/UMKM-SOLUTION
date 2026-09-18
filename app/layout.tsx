import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ModalitasFokus } from "@/components/ui/ModalitasFokus";
import { PenyediaToast } from "@/components/ui/Toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ruang Margin — HPP & Kesehatan Usaha",
  description:
    "Pantau HPP dan margin setiap produk usaha kuliner, tanpa biaya yang terlewat.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      {/* Penyedia toast dipasang di layout akar supaya halaman masuk dan daftar
          ikut terjangkau, bukan hanya halaman di dalam (app). */}
      <body className="min-h-full flex flex-col">
        <ModalitasFokus />
        <PenyediaToast>{children}</PenyediaToast>
      </body>
    </html>
  );
}

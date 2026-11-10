import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { IconCari } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan — Ruang Margin",
};

/**
 * 404 untuk seluruh aplikasi, termasuk alamat yang tidak cocok dengan rute
 * mana pun. Tombolnya ke "/" untuk semua orang: proxy.ts sudah mengalihkan
 * yang punya sesi ke dashboard, dan tamu tetap mendarat di landing page.
 */
export default function HalamanTidakDitemukan() {
  return (
    <main className="flex flex-1 items-center justify-center bg-background px-4 py-16">
      <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <IconCari />
        </span>
        <div>
          <p className="text-sm font-medium text-muted-foreground">404</p>
          <h1 className="mt-1 text-xl font-semibold text-foreground">Halaman tidak ditemukan</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Alamatnya mungkin salah ketik, atau halamannya sudah tidak ada.
          </p>
        </div>
        <ButtonLink href="/">Kembali ke beranda</ButtonLink>
      </div>
    </main>
  );
}

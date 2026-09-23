import { ButtonLink } from "@/components/ui/Button";
import { Merek } from "./Merek";
import { MenuMobile } from "./MenuMobile";

const TAUTAN = [
  { href: "#masalah", label: "Kenali biayanya" },
  { href: "#fitur", label: "Cara kerja" },
  { href: "#pratinjau", label: "Tampilan aplikasi" },
  { href: "#bukti", label: "Contoh hitungan" },
];

/**
 * Navigasi atas landing page. Di layar kecil tautan antarbagian dan tombol
 * masuk pindah ke menu lipat; tombol daftar tetap terlihat.
 */
export function HeaderLanding() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <nav
        className="relative mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-8"
        aria-label="Navigasi utama"
      >
        <Merek />

        <div className="hidden items-center gap-7 lg:flex">
          {TAUTAN.map((t) => (
            <a
              key={t.href}
              href={t.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ButtonLink href="/login" varian="ghost" className="text-foreground max-sm:hidden">
            Masuk
          </ButtonLink>
          <ButtonLink href="/register">Daftar</ButtonLink>
          <MenuMobile tautan={TAUTAN} />
        </div>
      </nav>
    </header>
  );
}

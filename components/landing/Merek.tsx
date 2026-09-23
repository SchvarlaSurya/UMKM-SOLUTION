import Link from "next/link";
import { IconLogo } from "@/components/ui/icons";

/** Logo dan nama Ruang Margin, sama dengan yang dipakai halaman masuk. */
export function Merek({ href = "#atas" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 text-foreground"
      aria-label="Ruang Margin, ke awal halaman"
    >
      <span className="flex size-9 items-center justify-center rounded-card bg-primary text-primary-foreground">
        <IconLogo width={20} height={20} />
      </span>
      <span className="text-base font-semibold tracking-tight">
        ruang<span className="text-primary">margin</span>
      </span>
    </Link>
  );
}

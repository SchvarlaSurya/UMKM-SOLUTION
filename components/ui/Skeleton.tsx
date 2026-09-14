import { cn } from "@/lib/cn";

/**
 * Warna batang mengikuti permukaan tempat ia duduk. `cn` hanya menggabungkan
 * string (tanpa tailwind-merge), jadi warna dan radius dipilih lewat prop,
 * bukan ditimpa lewat className, supaya tidak ada dua class yang bentrok.
 */
const nadaClass = {
  /** Di dalam Card putih. Sama dengan skeleton yang sudah ada di repo. */
  card: "bg-muted",
  /** Langsung di latar halaman, tempat bg-muted hampir tak terlihat. */
  latar: "bg-border",
  /** Di atas permukaan success-bg. */
  sukses: "bg-card/70",
} as const;

const bentukClass = {
  garis: "rounded",
  pil: "rounded-full",
  kotak: "rounded-card",
} as const;

/** Batang placeholder berdenyut untuk loading.tsx. */
export function Skeleton({
  className,
  nada = "card",
  bentuk = "garis",
}: {
  className?: string;
  nada?: keyof typeof nadaClass;
  bentuk?: keyof typeof bentukClass;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse motion-reduce:animate-none",
        nadaClass[nada],
        bentukClass[bentuk],
        className,
      )}
    />
  );
}

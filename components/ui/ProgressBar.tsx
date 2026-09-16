import { cn } from "@/lib/cn";

/** Bar mini untuk kolom margin: hijau bila aman, oranye bila di bawah batas. */
export function ProgressBar({
  nilai,
  maks = 100,
  aman = true,
  label,
  className,
}: {
  nilai: number;
  maks?: number;
  aman?: boolean;
  label?: string;
  className?: string;
}) {
  const persen = Math.max(0, Math.min(100, (nilai / maks) * 100));

  return (
    <div
      className={cn("h-1.5 w-20 overflow-hidden rounded-full bg-border", className)}
      role="progressbar"
      aria-valuenow={Math.round(nilai)}
      aria-valuemin={0}
      aria-valuemax={Math.round(maks)}
      aria-label={label}
    >
      {/* Lebarnya ikut bergerak saat margin berubah, supaya bar tidak melompat
          sementara angkanya di sebelahnya berjalan. Transisi CSS, bukan
          anime.js: tidak perlu jadi komponen klien hanya untuk ini, dan bar
          bisa sebanyak baris tabelnya. */}
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none",
          aman ? "bg-success" : "bg-warning",
        )}
        style={{ width: `${persen}%` }}
      />
    </div>
  );
}

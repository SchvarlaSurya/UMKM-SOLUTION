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
      <div
        className={cn("h-full rounded-full", aman ? "bg-success" : "bg-warning")}
        style={{ width: `${persen}%` }}
      />
    </div>
  );
}

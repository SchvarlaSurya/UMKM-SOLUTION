import type { Ref, ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Table({
  children,
  className,
  ikutiWadah = false,
}: {
  children: ReactNode;
  className?: string;
  /**
   * Lepaskan lebar minimum, biarkan tabelnya menyesuaikan lebar wadahnya.
   *
   * Lebar minimum 42rem itu untuk tabel selebar halaman: di layar sempit
   * tabelnya tetap terbaca dan digeser mendatar, dan pengguna sudah tahu
   * harus menggeser karena tabelnya jelas lebih lebar dari layar.
   *
   * Di dalam modal alasannya hilang. Lebar modalnya tetap dan justru lebih
   * sempit dari 42rem, jadi yang dihasilkan bukan tabel lebar yang perlu
   * dijelajahi, melainkan geseran beberapa puluh piksel demi ekor satu kolom
   * terakhir — cukup jauh untuk mengganggu, terlalu dekat untuk terbaca
   * sebagai "ini memang tabel lebar".
   *
   * Pembungkusnya tetap bisa digeser, jadi isi yang benar-benar tidak muat
   * masih punya jalan keluar.
   */
  ikutiWadah?: boolean;
}) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn(
          "w-full border-collapse text-sm",
          !ikutiWadah && "min-w-[42rem]",
          className,
        )}
      >
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-y border-border bg-muted/60 text-xs font-medium text-muted-foreground">
      {children}
    </thead>
  );
}

export function TBody({
  children,
  ref,
}: {
  children: ReactNode;
  /** Dipakai pemanggil yang perlu menganimasikan isi tabel sebagai satu bagian. */
  ref?: Ref<HTMLTableSectionElement>;
}) {
  return (
    <tbody ref={ref} className="divide-y divide-border">
      {children}
    </tbody>
  );
}

export function TR({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <tr className={cn("transition-colors hover:bg-muted/40", className)}>{children}</tr>;
}

export function TH({
  children,
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & { children: ReactNode }) {
  return (
    <th
      scope="col"
      className={cn("px-4 py-3 text-left font-medium whitespace-nowrap", className)}
      {...props}
    >
      {children}
    </th>
  );
}

export function TD({
  children,
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & { children: ReactNode }) {
  return (
    <td className={cn("px-4 py-3 align-middle text-foreground", className)} {...props}>
      {children}
    </td>
  );
}

export function TableFooterNote({
  kiri,
  kanan,
}: {
  kiri: ReactNode;
  kanan?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-xs text-muted-foreground">
      <span>{kiri}</span>
      {kanan && <span>{kanan}</span>}
    </div>
  );
}

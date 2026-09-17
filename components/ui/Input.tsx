import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  WheelEvent,
} from "react";
import { cn } from "@/lib/cn";
import { IconChevronBawah } from "./icons";

/**
 * Di Chrome/Edge, scroll roda mouse atau touchpad di atas `<input type="number">`
 * yang sedang fokus mengubah nilainya satu `step` per event, dan halaman tidak
 * ikut ter-scroll. Satu gesekan touchpad bisa mengirim ratusan event: target
 * margin 25 pernah tersimpan jadi 14.8 (102 × step 0.1), dan takaran resep
 * dengan `step="any"` naik 1 per event.
 *
 * Melepas fokus membuat peramban berhenti mengubah nilai, dan event scroll
 * tetap menggulir halaman/modal seperti biasa. `preventDefault` tidak dipakai
 * karena listener wheel React bersifat passive.
 */
export function cegahScrollUbahAngka(e: WheelEvent<HTMLInputElement>) {
  if (e.currentTarget === document.activeElement) e.currentTarget.blur();
}

const kontrolDasar =
  "h-10 w-full rounded-card border border-border bg-card px-3 text-sm text-foreground " +
  "placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-1 " +
  "focus-visible:outline-ring disabled:opacity-50";

type FieldProps = {
  label?: string;
  helper?: ReactNode;
  error?: string;
  className?: string;
};

/**
 * Id keterangan di bawah kolom, diturunkan dari id kolomnya sendiri supaya
 * `aria-describedby` bisa dipasang tanpa hook — berkas ini juga ikut terpakai
 * dari komponen server.
 */
function idKeterangan(id: string | undefined, error?: string, helper?: ReactNode) {
  if (!id) return undefined;
  if (error) return `${id}-galat`;
  if (helper) return `${id}-bantuan`;
  return undefined;
}

function Field({
  label,
  helper,
  error,
  htmlFor,
  children,
  className,
}: FieldProps & { htmlFor?: string; children: ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p id={htmlFor ? `${htmlFor}-galat` : undefined} className="text-xs text-destructive">
          {error}
        </p>
      ) : (
        helper && (
          <p
            id={htmlFor ? `${htmlFor}-bantuan` : undefined}
            className="text-xs text-muted-foreground"
          >
            {helper}
          </p>
        )
      )}
    </div>
  );
}

export function Input({
  label,
  helper,
  error,
  className,
  id,
  onWheel,
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} helper={helper} error={error} htmlFor={id} className={className}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={idKeterangan(id, error, helper)}
        className={cn(kontrolDasar, error && "border-destructive")}
        onWheel={(e) => {
          if (props.type === "number") cegahScrollUbahAngka(e);
          onWheel?.(e);
        }}
        {...props}
      />
    </Field>
  );
}

export function Select({
  label,
  helper,
  error,
  className,
  id,
  children,
  ...props
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field label={label} helper={helper} error={error} htmlFor={id} className={className}>
      {/*
        Panah bawaan peramban diganti panah sendiri.

        Bentuk panah `<select>` digambar sistem operasi: di macOS sepasang
        chevron kecil di dalam kotak abu, di Windows segitiga penuh. Itulah satu-
        satunya bagian kontrol ini yang tidak mengikuti sisa antarmuka, dan yang
        membuat dropdown terlihat beda dari kotak pilih bahan.

        Hanya rupanya yang berubah. Elemennya tetap `<select>` asli, jadi di
        ponsel tetap membuka pemilih roda bawaan sistem, dan navigasi papan ketik
        maupun pembaca layar tidak tersentuh sama sekali.
      */}
      <div className="relative">
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={idKeterangan(id, error, helper)}
          className={cn(
            kontrolDasar,
            "appearance-none pr-9",
            error && "border-destructive",
            props.disabled && "cursor-not-allowed",
          )}
          {...props}
        >
          {children}
        </select>
        <IconChevronBawah
          width={16}
          height={16}
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground",
            // Panah ikut meredup bersama kotaknya; `disabled:opacity-50` di
            // kontrolnya tidak menjangkau ikon yang berada di luar <select>.
            props.disabled && "opacity-50",
          )}
        />
      </div>
    </Field>
  );
}

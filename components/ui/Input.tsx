import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

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
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        helper && <p className="text-xs text-muted-foreground">{helper}</p>
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
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} helper={helper} error={error} htmlFor={id} className={className}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        className={cn(kontrolDasar, error && "border-destructive")}
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
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        className={cn(kontrolDasar, "pr-8", error && "border-destructive")}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type DivProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: DivProps) {
  return (
    <section
      className={cn(
        "rounded-card border border-border bg-card shadow-[0_1px_2px_rgba(32,46,40,0.04)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({ children, className }: DivProps) {
  return (
    <header className={cn("flex flex-wrap items-start justify-between gap-3 px-5 pt-5", className)}>
      {children}
    </header>
  );
}

export function CardTitle({ children, className }: DivProps) {
  return (
    <h2 className={cn("text-base font-semibold text-foreground", className)}>{children}</h2>
  );
}

export function CardDescription({ children, className }: DivProps) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>;
}

export function CardContent({ children, className }: DivProps) {
  return <div className={cn("px-5 py-5", className)}>{children}</div>;
}

export function CardFooter({ children, className }: DivProps) {
  return (
    <footer
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 text-sm text-muted-foreground",
        className,
      )}
    >
      {children}
    </footer>
  );
}

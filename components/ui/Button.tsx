import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Varian = "primary" | "secondary" | "ghost" | "link";
type Ukuran = "sm" | "md";

const varianClass: Record<Varian, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover border border-transparent",
  secondary: "bg-card text-foreground border border-border hover:bg-muted",
  ghost: "bg-transparent text-muted-foreground border border-transparent hover:bg-muted hover:text-foreground",
  link: "bg-transparent text-primary border border-transparent px-0 hover:underline underline-offset-4",
};

const ukuranClass: Record<Ukuran, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
};

const dasar =
  "inline-flex items-center justify-center rounded-card font-medium transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " +
  "disabled:pointer-events-none disabled:opacity-50";

type SharedProps = {
  varian?: Varian;
  ukuran?: Ukuran;
  className?: string;
  children: ReactNode;
};

export function Button({
  varian = "primary",
  ukuran = "md",
  className,
  children,
  ...props
}: SharedProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(dasar, varianClass[varian], ukuranClass[ukuran], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  varian = "primary",
  ukuran = "md",
  className,
  children,
}: SharedProps & { href: string }) {
  return (
    <Link
      href={href}
      className={cn(dasar, varianClass[varian], ukuranClass[ukuran], className)}
    >
      {children}
    </Link>
  );
}

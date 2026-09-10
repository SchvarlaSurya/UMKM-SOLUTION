import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { IconBenih } from "@/components/ui/icons";

/** Kerangka halaman masuk & daftar: brand di atas, kartu form di tengah. */
export function KartuAuth({
  judul,
  subjudul,
  children,
  footer,
}: {
  judul: string;
  subjudul: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 text-foreground"
          aria-label="Ruang Margin"
        >
          <span className="flex size-9 items-center justify-center rounded-card bg-primary text-primary-foreground">
            <IconBenih width={20} height={20} />
          </span>
          <span className="text-base font-semibold tracking-tight">
            ruang<span className="text-primary">margin</span>
          </span>
        </Link>

        <Card className="mt-6 px-6 py-6">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{judul}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subjudul}</p>
          <div className="mt-5">{children}</div>
        </Card>

        <p className="mt-4 text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </div>
  );
}

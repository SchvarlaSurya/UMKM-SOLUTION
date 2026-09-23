"use client";

import { useEffect, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { IconMenu, IconTutup } from "@/components/ui/icons";

/**
 * Tautan antarbagian untuk layar kecil, tempat deretan tautan di header
 * disembunyikan. Panelnya turun tepat di bawah header yang menempel.
 */
export function MenuMobile({ tautan }: { tautan: { href: string; label: string }[] }) {
  const [buka, setBuka] = useState(false);
  const refTombol = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!buka) return;
    function tutupDenganEsc(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setBuka(false);
      refTombol.current?.focus();
    }
    document.addEventListener("keydown", tutupDenganEsc);
    return () => document.removeEventListener("keydown", tutupDenganEsc);
  }, [buka]);

  return (
    <div className="lg:hidden">
      <button
        ref={refTombol}
        type="button"
        className="inline-flex size-10 items-center justify-center rounded-card text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        aria-expanded={buka}
        aria-controls="menu-landing"
        aria-label={buka ? "Tutup menu" : "Buka menu"}
        onClick={() => setBuka((b) => !b)}
      >
        {buka ? <IconTutup /> : <IconMenu />}
      </button>

      <div
        id="menu-landing"
        hidden={!buka}
        className="absolute inset-x-0 top-full border-b border-border bg-card px-4 pt-2 pb-4 shadow-[0_12px_24px_rgba(32,46,40,0.08)]"
      >
        <ul className="flex flex-col">
          {tautan.map((t) => (
            <li key={t.href}>
              <a
                href={t.href}
                onClick={() => setBuka(false)}
                className="flex min-h-12 items-center border-b border-border text-base text-foreground"
              >
                {t.label}
              </a>
            </li>
          ))}
        </ul>
        <ButtonLink href="/login" varian="secondary" className="mt-4 h-11 w-full sm:hidden">
          Masuk
        </ButtonLink>
      </div>
    </div>
  );
}

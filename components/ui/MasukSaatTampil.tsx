"use client";

import type { ReactNode } from "react";
import { useMasukGulir } from "./useMasukGulir";

/**
 * Memunculkan isinya sebagai satu kesatuan saat pertama masuk area pandang.
 * Dipakai untuk blok judul tiap bagian di landing page.
 *
 * Komponennya klien, tapi `children` tetap dirender di server dan dikirim
 * sebagai payload — pemakainya tidak perlu ikut jadi komponen klien.
 *
 * Lihat useMasukGulir untuk alasan di balik keadaan awal dan ambang pemicunya.
 */
export function MasukSaatTampil({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useMasukGulir<HTMLDivElement>();

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

"use client";

import { useState } from "react";

/**
 * Nomor yang bertambah setiap kali modal dibuka, untuk dipakai di `key` isinya.
 *
 * `Modal` memakai `<dialog>` dan tetap merender isinya saat tertutup — yang
 * berubah hanya `display`. Jadi form di dalamnya tidak pernah unmount, dan
 * `key` yang tetap sama membuat isian lama ikut terbawa saat modal dibuka
 * lagi. Pada form tambah, `key`-nya justru paling sering konstan karena tidak
 * ada id yang membedakan satu pembukaan dari pembukaan berikutnya.
 *
 * Dipakai begini:
 *
 * ```tsx
 * const sesi = useSesiModal(terbuka);
 * // ...
 * <FormBahan key={`${mode}-${bahan?.id ?? "baru"}-${sesi}`} ... />
 * ```
 *
 * State-nya sengaja disesuaikan saat render, bukan lewat useEffect: nilainya
 * harus sudah benar pada render yang sama dengan saat `terbuka` berubah, jadi
 * form tidak sempat tergambar sekali dengan isian lama sebelum dibuat ulang.
 * Ini pola "menyesuaikan state saat prop berubah" dari dokumentasi React, dan
 * React langsung mengulang render komponen ini tanpa menyentuh DOM.
 */
export function useSesiModal(terbuka: boolean): number {
  const [sesi, setSesi] = useState(0);
  const [terbukaSebelumnya, setTerbukaSebelumnya] = useState(terbuka);

  if (terbuka !== terbukaSebelumnya) {
    setTerbukaSebelumnya(terbuka);
    if (terbuka) setSesi((n) => n + 1);
  }

  return sesi;
}

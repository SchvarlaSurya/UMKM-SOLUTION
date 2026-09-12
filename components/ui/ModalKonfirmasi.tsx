"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Banner } from "./Banner";
import { Button } from "./Button";
import { Modal } from "./Modal";

/**
 * Konfirmasi sebelum tindakan yang tidak enak kalau tidak sengaja terpicu.
 *
 * `nada` menentukan warna tombol utamanya: "bahaya" untuk yang menghapus data,
 * "utama" untuk yang sekadar mengganggu seperti keluar dari akun. Membedakan
 * keduanya penting supaya warna merah tetap berarti "data hilang".
 */
export function ModalKonfirmasi({
  terbuka,
  judul,
  subjudul,
  children,
  labelKonfirmasi,
  labelSedangProses,
  labelBatal = "Batal",
  nada = "utama",
  galat = null,
  memproses = false,
  onTutup,
  onKonfirmasi,
}: {
  terbuka: boolean;
  judul: string;
  subjudul?: string;
  children: ReactNode;
  labelKonfirmasi: string;
  labelSedangProses: string;
  labelBatal?: string;
  nada?: "utama" | "bahaya";
  galat?: string | null;
  memproses?: boolean;
  onTutup: () => void;
  onKonfirmasi: () => void;
}) {
  return (
    <Modal
      terbuka={terbuka}
      onTutup={onTutup}
      judul={judul}
      subjudul={subjudul}
      aksiSekunder={
        <Button varian="secondary" ukuran="sm" type="button" disabled={memproses} onClick={onTutup}>
          {labelBatal}
        </Button>
      }
      aksiPrimer={
        <Button
          varian="primary"
          ukuran="sm"
          type="button"
          disabled={memproses}
          onClick={onKonfirmasi}
          className={cn(
            nada === "bahaya" && "border-transparent bg-destructive hover:bg-destructive/90",
          )}
        >
          {memproses ? labelSedangProses : labelKonfirmasi}
        </Button>
      }
    >
      {children}

      {galat && (
        <Banner varian="warning" className="mt-4">
          {galat}
        </Banner>
      )}
    </Modal>
  );
}

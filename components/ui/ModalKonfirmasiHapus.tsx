"use client";

import type { ReactNode } from "react";
import { ModalKonfirmasi } from "./ModalKonfirmasi";

/**
 * Konfirmasi sebelum menghapus, dipakai bersama halaman bahan baku, biaya
 * operasional, dan produk.
 *
 * Penghapusan tidak bisa dibatalkan, jadi namanya selalu disebut dan tombol
 * utamanya memakai nada bahaya — bukan hijau seperti aksi simpan, supaya tidak
 * tertekan karena kebiasaan.
 */
export function ModalKonfirmasiHapus({
  terbuka,
  judul,
  nama,
  keterangan,
  galat = null,
  menghapus = false,
  onTutup,
  onHapus,
}: {
  terbuka: boolean;
  judul: string;
  /** Nama baris yang akan dihapus, ditampilkan supaya tidak salah sasaran. */
  nama: string;
  /** Penjelasan dampak, misalnya data lain yang ikut terhapus. */
  keterangan?: ReactNode;
  galat?: string | null;
  menghapus?: boolean;
  onTutup: () => void;
  onHapus: () => void;
}) {
  return (
    <ModalKonfirmasi
      terbuka={terbuka}
      judul={judul}
      subjudul="Tindakan ini tidak bisa dibatalkan."
      nada="bahaya"
      labelKonfirmasi="Hapus"
      labelSedangProses="Menghapus…"
      galat={galat}
      memproses={menghapus}
      onTutup={onTutup}
      onKonfirmasi={onHapus}
    >
      <p className="text-sm text-foreground">
        Hapus <span className="font-semibold">{nama}</span>?
      </p>

      {keterangan && <p className="mt-2 text-sm text-muted-foreground">{keterangan}</p>}
    </ModalKonfirmasi>
  );
}

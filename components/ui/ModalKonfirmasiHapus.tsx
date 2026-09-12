"use client";

import type { ReactNode } from "react";
import { Banner } from "./Banner";
import { Button } from "./Button";
import { Modal } from "./Modal";

/**
 * Konfirmasi sebelum menghapus, dipakai bersama halaman bahan baku, biaya
 * operasional, dan produk.
 *
 * Penghapusan tidak bisa dibatalkan, jadi namanya selalu disebut dan tombol
 * utamanya diberi warna bahaya — bukan hijau seperti aksi simpan, supaya tidak
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
    <Modal
      terbuka={terbuka}
      onTutup={onTutup}
      judul={judul}
      subjudul="Tindakan ini tidak bisa dibatalkan."
      aksiSekunder={
        <Button varian="secondary" ukuran="sm" type="button" disabled={menghapus} onClick={onTutup}>
          Batal
        </Button>
      }
      aksiPrimer={
        <Button
          varian="primary"
          ukuran="sm"
          type="button"
          disabled={menghapus}
          onClick={onHapus}
          className="border-transparent bg-destructive hover:bg-destructive/90"
        >
          {menghapus ? "Menghapus…" : "Hapus"}
        </Button>
      }
    >
      <p className="text-sm text-foreground">
        Hapus <span className="font-semibold">{nama}</span>?
      </p>

      {keterangan && <p className="mt-2 text-sm text-muted-foreground">{keterangan}</p>}

      {galat && (
        <Banner varian="warning" className="mt-4">
          {galat}
        </Banner>
      )}
    </Modal>
  );
}

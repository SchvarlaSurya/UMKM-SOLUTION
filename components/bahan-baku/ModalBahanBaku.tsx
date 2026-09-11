"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Banner } from "@/components/ui/Banner";
import type { BahanBaku } from "@/lib/types";

export const SATUAN = ["kg", "liter", "gram", "ml", "butir", "buah"] as const;

export type NilaiFormBahan = {
  nama: string;
  satuan: string;
  hargaPerSatuan: number;
};

const ID_FORM = "form-bahan-baku";

/**
 * Form tambah/edit bahan baku.
 * Mode edit mengunci nama & satuan karena endpoint PUT /api/bahan-baku/[id]
 * hanya menerima hargaPerSatuan.
 */
export function ModalBahanBaku({
  terbuka,
  mode,
  bahan,
  jumlahProdukTerkait,
  menyimpan = false,
  galatServer = null,
  onTutup,
  onSimpan,
}: {
  terbuka: boolean;
  mode: "tambah" | "edit";
  bahan: BahanBaku | null;
  jumlahProdukTerkait: number;
  /** Server Action sedang berjalan. */
  menyimpan?: boolean;
  /** Pesan penolakan dari server, mis. nama bahan bentrok. */
  galatServer?: string | null;
  onTutup: () => void;
  onSimpan: (nilai: NilaiFormBahan) => void;
}) {
  return (
    <Modal
      terbuka={terbuka}
      onTutup={onTutup}
      judul={mode === "edit" ? "Edit bahan baku" : "Tambah bahan baku"}
      subjudul={
        mode === "edit"
          ? "Perbarui harga beli terbaru untuk bahan ini."
          : "Catat bahan beserta harga beli per satuannya."
      }
      aksiSekunder={
        <Button varian="secondary" ukuran="sm" type="button" disabled={menyimpan} onClick={onTutup}>
          Batal
        </Button>
      }
      aksiPrimer={
        <Button varian="primary" ukuran="sm" type="submit" form={ID_FORM} disabled={menyimpan}>
          {menyimpan ? "Menyimpan…" : "Simpan bahan"}
        </Button>
      }
    >
      {/* key memaksa form dibuat ulang tiap ganti bahan, jadi isian tidak tersisa. */}
      <FormBahan
        key={`${mode}-${bahan?.id ?? "baru"}`}
        mode={mode}
        bahan={bahan}
        jumlahProdukTerkait={jumlahProdukTerkait}
        galatServer={galatServer}
        onSimpan={onSimpan}
      />
    </Modal>
  );
}

function FormBahan({
  mode,
  bahan,
  jumlahProdukTerkait,
  galatServer,
  onSimpan,
}: {
  mode: "tambah" | "edit";
  bahan: BahanBaku | null;
  jumlahProdukTerkait: number;
  galatServer: string | null;
  onSimpan: (nilai: NilaiFormBahan) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  // Galat dari server menimpa galat validasi lokal karena datangnya belakangan.
  const pesanGalat = galatServer ?? error;

  function kirim(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const nama = String(data.get("nama") ?? "").trim();
    const satuan = String(data.get("satuan") ?? SATUAN[0]);
    const harga = Number(data.get("harga"));

    if (nama === "") {
      setError("Nama bahan wajib diisi.");
      return;
    }
    if (!Number.isFinite(harga) || harga <= 0) {
      setError("Harga per satuan harus lebih dari 0.");
      return;
    }

    setError(null);
    onSimpan({ nama, satuan, hargaPerSatuan: harga });
  }

  return (
    <form id={ID_FORM} onSubmit={kirim} className="flex flex-col gap-4">
      <Input
        id="nama-bahan"
        name="nama"
        label="Nama bahan"
        defaultValue={bahan?.nama ?? ""}
        readOnly={mode === "edit"}
        placeholder="Contoh: Ayam fillet"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          id="satuan-bahan"
          name="satuan"
          label="Satuan"
          defaultValue={bahan?.satuan ?? SATUAN[0]}
          disabled={mode === "edit"}
        >
          {SATUAN.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>

        <Input
          id="harga-bahan"
          name="harga"
          label="Harga per satuan (Rp)"
          type="number"
          min={0}
          step={100}
          inputMode="numeric"
          defaultValue={bahan ? String(bahan.hargaPerSatuan) : ""}
          placeholder="0"
          error={pesanGalat ?? undefined}
        />
      </div>

      {/* Satuan terkunci saat edit, jadi nilainya tetap ikut terkirim. */}
      {mode === "edit" && <input type="hidden" name="satuan" value={bahan?.satuan ?? ""} />}

      {mode === "edit" && jumlahProdukTerkait > 0 && (
        <Banner varian="info">
          {jumlahProdukTerkait} produk menggunakan bahan ini. HPP-nya ikut terhitung ulang
          setelah harga disimpan.
        </Banner>
      )}
    </form>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { IconTambah, IconTutup } from "@/components/ui/icons";
import type { BahanBaku, Produk } from "@/lib/types";

export const KATEGORI = [
  "Makanan utama",
  "Lauk & camilan",
  "Pelengkap",
  "Minuman",
  "Umum",
] as const;

export type BarisResep = { bahanBakuId: number; jumlahDipakai: number };

export type NilaiFormProduk = {
  nama: string;
  kategori: string;
  hargaJual: number;
  resep: BarisResep[];
};

const ID_FORM = "form-produk";

export function ModalProduk({
  terbuka,
  mode,
  produk,
  bahan,
  menyimpan = false,
  galatServer = null,
  onTutup,
  onSimpan,
}: {
  terbuka: boolean;
  mode: "tambah" | "edit";
  produk: Produk | null;
  bahan: BahanBaku[];
  /** Server Action sedang berjalan. */
  menyimpan?: boolean;
  /** Pesan penolakan dari server. */
  galatServer?: string | null;
  onTutup: () => void;
  onSimpan: (nilai: NilaiFormProduk) => void;
}) {
  return (
    <Modal
      terbuka={terbuka}
      onTutup={onTutup}
      judul={mode === "edit" ? "Edit produk & resep" : "Tambah produk & resep"}
      subjudul="Takaran per porsi menentukan HPP produk ini."
      lebar="lg"
      aksiSekunder={
        <Button varian="secondary" ukuran="sm" type="button" disabled={menyimpan} onClick={onTutup}>
          Batal
        </Button>
      }
      aksiPrimer={
        <Button varian="primary" ukuran="sm" type="submit" form={ID_FORM} disabled={menyimpan}>
          {menyimpan ? "Menyimpan…" : "Simpan produk"}
        </Button>
      }
    >
      <FormProduk
        key={`${mode}-${produk?.id ?? "baru"}`}
        produk={produk}
        bahan={bahan}
        galatServer={galatServer}
        onSimpan={onSimpan}
      />
    </Modal>
  );
}

type BarisForm = { key: number; bahanBakuId: number; jumlah: string };

function FormProduk({
  produk,
  bahan,
  galatServer,
  onSimpan,
}: {
  produk: Produk | null;
  bahan: BahanBaku[];
  galatServer: string | null;
  onSimpan: (nilai: NilaiFormProduk) => void;
}) {
  const [baris, setBaris] = useState<BarisForm[]>(() =>
    produk && produk.resep.length > 0
      ? produk.resep.map((r, i) => ({
          key: i,
          bahanBakuId: r.bahanBakuId,
          jumlah: String(r.jumlahDipakai),
        }))
      : [{ key: 0, bahanBakuId: bahan[0]?.id ?? 0, jumlah: "" }],
  );
  const [error, setError] = useState<string | null>(null);

  function tambahBaris() {
    setBaris((sebelumnya) => [
      ...sebelumnya,
      {
        key: Math.max(-1, ...sebelumnya.map((b) => b.key)) + 1,
        bahanBakuId: bahan[0]?.id ?? 0,
        jumlah: "",
      },
    ]);
  }

  function hapusBaris(key: number) {
    setBaris((sebelumnya) => sebelumnya.filter((b) => b.key !== key));
  }

  function ubahBaris(key: number, ubahan: Partial<BarisForm>) {
    setBaris((sebelumnya) =>
      sebelumnya.map((b) => (b.key === key ? { ...b, ...ubahan } : b)),
    );
  }

  function kirim(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const nama = String(data.get("nama") ?? "").trim();
    const kategori = String(data.get("kategori") ?? KATEGORI[0]);
    const hargaJual = Number(data.get("hargaJual"));

    if (nama === "") {
      setError("Nama produk wajib diisi.");
      return;
    }
    if (!Number.isFinite(hargaJual) || hargaJual <= 0) {
      setError("Harga jual harus lebih dari 0.");
      return;
    }

    const resep: BarisResep[] = baris
      .map((b) => ({ bahanBakuId: b.bahanBakuId, jumlahDipakai: Number(b.jumlah) }))
      .filter((r) => r.bahanBakuId > 0 && Number.isFinite(r.jumlahDipakai));

    if (resep.length === 0) {
      setError("Produk harus punya minimal 1 bahan baku di resep.");
      return;
    }
    if (resep.some((r) => r.jumlahDipakai <= 0)) {
      setError("Setiap bahan wajib punya takaran lebih dari 0.");
      return;
    }
    const unik = new Set(resep.map((r) => r.bahanBakuId));
    if (unik.size !== resep.length) {
      setError("Ada bahan yang dipilih lebih dari sekali.");
      return;
    }

    setError(null);
    onSimpan({ nama, kategori, hargaJual, resep });
  }

  return (
    <form id={ID_FORM} onSubmit={kirim} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="nama-produk"
          name="nama"
          label="Nama produk"
          defaultValue={produk?.nama ?? ""}
          placeholder="Contoh: Nasi Ayam Geprek"
          className="sm:col-span-2"
        />
        <Select
          id="kategori-produk"
          name="kategori"
          label="Kategori"
          defaultValue={produk?.kategori ?? KATEGORI[0]}
        >
          {KATEGORI.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </Select>
        <Input
          id="harga-jual"
          name="hargaJual"
          label="Harga jual (Rp)"
          type="number"
          min={0}
          step={500}
          inputMode="numeric"
          defaultValue={produk ? String(produk.hargaJual) : ""}
          placeholder="0"
        />
      </div>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold whitespace-nowrap text-foreground">
              Komposisi per porsi
            </h3>
            <Badge varian="count">{baris.length}</Badge>
          </div>
          <Button
            varian="secondary"
            ukuran="sm"
            type="button"
            onClick={tambahBaris}
            className="whitespace-nowrap"
          >
            <IconTambah width={14} height={14} />
            Tambah bahan
          </Button>
        </div>

        <ul className="mt-3 flex flex-col gap-2">
          {baris.map((b) => {
            const satuan = bahan.find((x) => x.id === b.bahanBakuId)?.satuan ?? "";
            return (
              <li key={b.key} className="flex items-end gap-2">
                <label className="flex-1">
                  <span className="sr-only">Bahan baku</span>
                  <select
                    value={b.bahanBakuId}
                    onChange={(e) => ubahBaris(b.key, { bahanBakuId: Number(e.target.value) })}
                    className="h-10 w-full rounded-card border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                  >
                    {bahan.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.nama}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="w-32">
                  <span className="sr-only">Jumlah dipakai</span>
                  <span className="flex h-10 items-center rounded-card border border-border bg-card pr-3 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-ring">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      inputMode="decimal"
                      value={b.jumlah}
                      placeholder="0"
                      onChange={(e) => ubahBaris(b.key, { jumlah: e.target.value })}
                      className="h-full w-full rounded-card bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                    <span className="text-xs whitespace-nowrap text-muted-foreground">
                      {satuan}
                    </span>
                  </span>
                </label>

                <Button
                  varian="ghost"
                  ukuran="sm"
                  type="button"
                  className="h-10 px-2"
                  aria-label="Hapus bahan"
                  disabled={baris.length === 1}
                  onClick={() => hapusBaris(b.key)}
                >
                  <IconTutup width={16} height={16} />
                </Button>
              </li>
            );
          })}
        </ul>

        {/* Galat server menimpa galat lokal karena datangnya belakangan. */}
        {(galatServer ?? error) && (
          <p className="mt-3 text-xs text-destructive">{galatServer ?? error}</p>
        )}
      </section>
    </form>
  );
}

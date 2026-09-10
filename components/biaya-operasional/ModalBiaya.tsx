"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { BiayaOperasional, JenisBiaya } from "@/lib/types";

export type NilaiFormBiaya = {
  nama: string;
  jenis: JenisBiaya;
  nilai: number;
};

const ID_FORM = "form-biaya-operasional";

export function ModalBiaya({
  terbuka,
  mode,
  biaya,
  estimasiPorsi,
  onTutup,
  onSimpan,
}: {
  terbuka: boolean;
  mode: "tambah" | "edit";
  biaya: BiayaOperasional | null;
  estimasiPorsi: number;
  onTutup: () => void;
  onSimpan: (nilai: NilaiFormBiaya) => void;
}) {
  return (
    <Modal
      terbuka={terbuka}
      onTutup={onTutup}
      judul={mode === "edit" ? "Edit biaya operasional" : "Tambah biaya operasional"}
      subjudul="Biaya tetap dibagi rata ke setiap porsi, biaya persentase dipotong dari harga jual."
      aksiSekunder={
        <Button varian="secondary" ukuran="sm" type="button" onClick={onTutup}>
          Batal
        </Button>
      }
      aksiPrimer={
        <Button varian="primary" ukuran="sm" type="submit" form={ID_FORM}>
          Simpan biaya
        </Button>
      }
    >
      <FormBiaya
        key={`${mode}-${biaya?.id ?? "baru"}`}
        biaya={biaya}
        estimasiPorsi={estimasiPorsi}
        onSimpan={onSimpan}
      />
    </Modal>
  );
}

function FormBiaya({
  biaya,
  estimasiPorsi,
  onSimpan,
}: {
  biaya: BiayaOperasional | null;
  estimasiPorsi: number;
  onSimpan: (nilai: NilaiFormBiaya) => void;
}) {
  const [jenis, setJenis] = useState<JenisBiaya>(biaya?.jenis ?? "tetap");
  const [error, setError] = useState<string | null>(null);

  function kirim(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const nama = String(data.get("nama") ?? "").trim();
    const nilai = Number(data.get("nilai"));

    if (nama === "") {
      setError("Nama biaya wajib diisi.");
      return;
    }
    if (!Number.isFinite(nilai) || nilai <= 0) {
      setError("Nilai harus lebih dari 0.");
      return;
    }
    if (jenis === "persentase" && nilai > 100) {
      setError("Persentase tidak boleh lebih dari 100.");
      return;
    }

    setError(null);
    onSimpan({ nama, jenis, nilai });
  }

  return (
    <form id={ID_FORM} onSubmit={kirim} className="flex flex-col gap-4">
      <Input
        id="nama-biaya"
        name="nama"
        label="Nama biaya"
        defaultValue={biaya?.nama ?? ""}
        placeholder="Contoh: Gas LPG"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          id="jenis-biaya"
          name="jenis"
          label="Jenis biaya"
          value={jenis}
          onChange={(e) => setJenis(e.target.value as JenisBiaya)}
        >
          <option value="tetap">Tetap (per bulan)</option>
          <option value="persentase">Persentase (dari harga jual)</option>
        </Select>

        <Input
          id="nilai-biaya"
          name="nilai"
          label={jenis === "tetap" ? "Nilai per bulan (Rp)" : "Besar potongan (%)"}
          type="number"
          min={0}
          step={jenis === "tetap" ? 1000 : 0.5}
          inputMode="decimal"
          defaultValue={biaya ? String(biaya.nilai) : ""}
          placeholder="0"
          error={error ?? undefined}
          helper={
            jenis === "tetap"
              ? `Dibagi rata ke ${estimasiPorsi.toLocaleString("id-ID")} porsi per bulan.`
              : "Dipotong dari harga jual setiap produk."
          }
        />
      </div>
    </form>
  );
}

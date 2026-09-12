"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { InputAngka } from "@/components/ui/InputAngka";
import { Modal } from "@/components/ui/Modal";
import { IconKalkulator, IconTambah, IconTutup } from "@/components/ui/icons";
import { formatRupiah } from "@/lib/format";
import { konversiKeSatuanDasar, pilihanSatuanUntuk } from "@/lib/satuan";
import type { BahanBaku, ModePenentuanHarga, Produk } from "@/lib/types";

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
  modePenentuanHarga: ModePenentuanHarga;
  targetMarginPersen: number | null;
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

type BarisForm = {
  key: number;
  bahanBakuId: number;
  jumlah: string;
  satuanDipilih: string;
};

type ModeTakaran = "per-porsi" | "sekali-produksi";

type HasilSimulasi = {
  hppTerhitung: number;
  persenKomisi: number;
  hargaJual: number;
  targetMarginPersen: number;
};

type StatusSimulasi = {
  kunci: string;
  status: "memuat" | "sukses" | "galat";
  hasil?: HasilSimulasi;
  galat?: string;
};

type HasilResep =
  | { ok: true; data: BarisResep[] }
  | { ok: false; error: string };

function formatJumlah(nilai: number): string {
  return nilai.toLocaleString("id-ID", { maximumFractionDigits: 8 });
}

function susunResep({
  baris,
  bahan,
  modeTakaran,
  jumlahPorsi,
}: {
  baris: BarisForm[];
  bahan: BahanBaku[];
  modeTakaran: ModeTakaran;
  jumlahPorsi: string;
}): HasilResep {
  const jumlahPorsiAngka = Number(jumlahPorsi);
  const jumlahPorsiValid =
    jumlahPorsi.trim() !== "" &&
    Number.isFinite(jumlahPorsiAngka) &&
    jumlahPorsiAngka > 0;

  if (modeTakaran === "sekali-produksi" && !jumlahPorsiValid) {
    return { ok: false, error: "Isi jumlah porsi dulu dengan angka lebih dari 0." };
  }

  const resep = baris.map((item) => {
    const satuanDasar =
      bahan.find((bahanBaku) => bahanBaku.id === item.bahanBakuId)?.satuan ?? "";
    const jumlahDalamSatuanDasar = konversiKeSatuanDasar(
      Number(item.jumlah),
      item.satuanDipilih,
      satuanDasar,
    );
    return {
      bahanBakuId: item.bahanBakuId,
      jumlahDipakai:
        modeTakaran === "sekali-produksi"
          ? jumlahDalamSatuanDasar / jumlahPorsiAngka
          : jumlahDalamSatuanDasar,
    };
  });

  if (resep.length === 0 || resep.some((item) => item.bahanBakuId <= 0)) {
    return { ok: false, error: "Produk harus punya minimal 1 bahan baku di resep." };
  }
  if (
    resep.some(
      (item) => !Number.isFinite(item.jumlahDipakai) || item.jumlahDipakai <= 0,
    )
  ) {
    return { ok: false, error: "Setiap bahan wajib punya takaran lebih dari 0." };
  }
  if (new Set(resep.map((item) => item.bahanBakuId)).size !== resep.length) {
    return { ok: false, error: "Ada bahan yang dipilih lebih dari sekali." };
  }

  return { ok: true, data: resep };
}

function pesanGalatSimulasi(isi: unknown): string {
  if (
    isi &&
    typeof isi === "object" &&
    "error" in isi &&
    typeof isi.error === "string"
  ) {
    return isi.error;
  }
  return "Harga jual belum dapat dihitung. Coba lagi.";
}

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
      ? produk.resep.map((r, i) => {
          const satuanDasar = bahan.find((item) => item.id === r.bahanBakuId)?.satuan ?? "";
          return {
            key: i,
            bahanBakuId: r.bahanBakuId,
            jumlah: String(r.jumlahDipakai),
            satuanDipilih: pilihanSatuanUntuk(satuanDasar)[0].nilai,
          };
        })
      : [
          {
            key: 0,
            bahanBakuId: bahan[0]?.id ?? 0,
            jumlah: "",
            satuanDipilih: pilihanSatuanUntuk(bahan[0]?.satuan ?? "")[0].nilai,
          },
        ],
  );
  const [modeTakaran, setModeTakaran] =
    useState<ModeTakaran>("per-porsi");
  const [jumlahPorsi, setJumlahPorsi] = useState("");
  const [modeHarga, setModeHarga] = useState<ModePenentuanHarga>(
    produk?.modePenentuanHarga ?? "manual",
  );
  const [hargaManual, setHargaManual] = useState(
    produk ? String(produk.hargaJual) : "",
  );
  const [hargaSistem, setHargaSistem] = useState(
    produk?.modePenentuanHarga === "targetMargin"
      ? String(produk.hargaJual)
      : "",
  );
  const [targetMargin, setTargetMargin] = useState(
    produk?.targetMarginPersen !== null && produk?.targetMarginPersen !== undefined
      ? String(produk.targetMarginPersen)
      : "20",
  );
  const [simulasi, setSimulasi] = useState<StatusSimulasi | null>(null);
  const [error, setError] = useState<string | null>(null);

  const jumlahPorsiAngka = Number(jumlahPorsi);
  const jumlahPorsiValid =
    jumlahPorsi.trim() !== "" &&
    Number.isFinite(jumlahPorsiAngka) &&
    jumlahPorsiAngka > 0;

  const hasilResep = useMemo(
    () => susunResep({ baris, bahan, modeTakaran, jumlahPorsi }),
    [baris, bahan, modeTakaran, jumlahPorsi],
  );
  const targetMarginAngka = Number(targetMargin);
  const targetMarginValid =
    targetMargin.trim() !== "" &&
    Number.isFinite(targetMarginAngka) &&
    targetMarginAngka >= 0 &&
    targetMarginAngka <= 80;
  const kunciSimulasi =
    modeHarga === "targetMargin" && targetMarginValid && hasilResep.ok
      ? JSON.stringify({ resep: hasilResep.data, targetMarginPersen: targetMarginAngka })
      : null;
  const simulasiAktif =
    kunciSimulasi !== null && simulasi?.kunci === kunciSimulasi ? simulasi : null;

  useEffect(() => {
    if (!kunciSimulasi || !hasilResep.ok) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSimulasi({ kunci: kunciSimulasi, status: "memuat" });
      try {
        const respons = await fetch("/api/produk/simulasi-harga", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resep: hasilResep.data,
            targetMarginPersen: targetMarginAngka,
          }),
          cache: "no-store",
          signal: controller.signal,
        });
        const isi: unknown = await respons.json().catch(() => null);
        if (!respons.ok) throw new Error(pesanGalatSimulasi(isi));

        const hasil = isi as HasilSimulasi;
        setHargaSistem(String(hasil.hargaJual));
        setSimulasi({
          kunci: kunciSimulasi,
          status: "sukses",
          hasil,
        });
      } catch (galat) {
        if (controller.signal.aborted) return;
        setSimulasi({
          kunci: kunciSimulasi,
          status: "galat",
          galat:
            galat instanceof Error
              ? galat.message
              : "Harga jual belum dapat dihitung. Coba lagi.",
        });
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [hasilResep, kunciSimulasi, targetMarginAngka]);

  function tambahBaris() {
    setBaris((sebelumnya) => [
      ...sebelumnya,
      {
        key: Math.max(-1, ...sebelumnya.map((b) => b.key)) + 1,
        bahanBakuId: bahan[0]?.id ?? 0,
        jumlah: "",
        satuanDipilih: pilihanSatuanUntuk(bahan[0]?.satuan ?? "")[0].nilai,
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
    const hargaJual = Number(modeHarga === "manual" ? hargaManual : hargaSistem);

    if (nama === "") {
      setError("Nama produk wajib diisi.");
      return;
    }
    if (modeHarga === "manual" && (!Number.isFinite(hargaJual) || hargaJual <= 0)) {
      setError("Harga jual harus lebih dari 0.");
      return;
    }
    if (modeHarga === "targetMargin" && !targetMarginValid) {
      setError("Target margin harus antara 0 sampai 80 persen.");
      return;
    }
    if (!hasilResep.ok) {
      setError(hasilResep.error);
      return;
    }
    if (
      modeHarga === "targetMargin" &&
      (!simulasiAktif || simulasiAktif.status !== "sukses")
    ) {
      setError(
        simulasiAktif?.status === "galat"
          ? simulasiAktif.galat ?? "Harga jual belum dapat dihitung."
          : "Tunggu sampai harga jual selesai dihitung.",
      );
      return;
    }

    setError(null);
    onSimpan({
      nama,
      kategori,
      hargaJual,
      modePenentuanHarga: modeHarga,
      targetMarginPersen: modeHarga === "targetMargin" ? targetMarginAngka : null,
      resep: hasilResep.data,
    });
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
      </div>

      <section className="rounded-card border border-border bg-muted/30 p-3">
        <h3 className="text-sm font-semibold text-foreground">Penentuan harga jual</h3>
        <div
          role="group"
          aria-label="Mode penentuan harga jual"
          className="mt-3 grid gap-2 sm:grid-cols-2"
        >
          {(
            [
              {
                nilai: "manual",
                label: "Tentukan harga sendiri",
                deskripsi: "Harga tetap mengikuti angka yang Anda masukkan.",
              },
              {
                nilai: "targetMargin",
                label: "Hitung dari target margin",
                deskripsi: "Sistem menyesuaikan harga saat biaya berubah.",
              },
            ] as const
          ).map((pilihan) => (
            <button
              key={pilihan.nilai}
              type="button"
              aria-pressed={modeHarga === pilihan.nilai}
              onClick={() => {
                setModeHarga(pilihan.nilai);
                setError(null);
              }}
              className={`rounded-card border px-3 py-2.5 text-left transition-colors active:translate-y-px ${
                modeHarga === pilihan.nilai
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/40"
              }`}
            >
              <span className="block text-sm font-medium">{pilihan.label}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                {pilihan.deskripsi}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {modeHarga === "manual" ? (
            <InputAngka
              id="harga-jual"
              name="hargaJual"
              label="Harga jual"
              awalan="Rp"
              nilai={hargaManual}
              onNilaiUbah={setHargaManual}
              helper="Masukkan harga yang dibayar pelanggan per porsi."
            />
          ) : (
            <Input
              id="target-margin"
              label="Target margin (%)"
              type="number"
              min={0}
              max={80}
              step="0.1"
              inputMode="decimal"
              value={targetMargin}
              onChange={(e) => setTargetMargin(e.target.value)}
              placeholder="20"
              helper="Boleh diisi dari 0 sampai 80 persen."
              error={
                targetMargin !== "" && !targetMarginValid
                  ? "Target margin harus antara 0 sampai 80 persen."
                  : undefined
              }
            />
          )}

          {modeHarga === "targetMargin" && (
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="harga-jual" className="text-sm font-medium text-foreground">
                  Harga jual
                </label>
                <Badge varian="count" ikon={<IconKalkulator width={13} height={13} />}>
                  Dihitung sistem
                </Badge>
              </div>
              {/* Nilai polos dikirim lewat kolom tersembunyi; yang terlihat
                  diformat supaya sebangun dengan mode harga manual. */}
              <input type="hidden" name="hargaJual" value={hargaSistem} />
              <input
                id="harga-jual"
                type="text"
                inputMode="numeric"
                readOnly
                value={
                  simulasiAktif?.status === "sukses" && hargaSistem !== ""
                    ? `Rp ${Number(hargaSistem).toLocaleString("id-ID")}`
                    : ""
                }
                placeholder={
                  simulasiAktif?.status === "memuat" ? "Menghitung..." : "Menunggu resep"
                }
                aria-busy={simulasiAktif?.status === "memuat"}
                aria-describedby="status-harga-sistem"
                className="h-10 w-full rounded-card border border-primary/35 bg-accent px-3 text-sm font-semibold text-accent-foreground placeholder:font-normal placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
              />
              <div id="status-harga-sistem" aria-live="polite" className="text-xs">
                {!targetMarginValid ? (
                  <p className="text-muted-foreground">Isi target margin yang valid.</p>
                ) : !hasilResep.ok ? (
                  <p className="text-muted-foreground">
                    Lengkapi resep untuk melihat harga yang disarankan.
                  </p>
                ) : simulasiAktif?.status === "galat" ? (
                  <p className="font-medium text-destructive">{simulasiAktif.galat}</p>
                ) : simulasiAktif?.status === "sukses" && simulasiAktif.hasil ? (
                  <p className="text-muted-foreground">
                    HPP {formatRupiah(simulasiAktif.hasil.hppTerhitung)}, komisi{" "}
                    {simulasiAktif.hasil.persenKomisi.toLocaleString("id-ID", {
                      maximumFractionDigits: 1,
                    })}
                    %.
                  </p>
                ) : (
                  <p className="text-muted-foreground">Menghitung harga terbaru...</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold whitespace-nowrap text-foreground">
              {modeTakaran === "per-porsi"
                ? "Komposisi per porsi"
                : "Komposisi sekali produksi"}
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

        <div className="mt-3 rounded-card border border-border bg-muted/30 p-3">
          <p className="mb-2 text-xs font-medium text-foreground">
            Mode input takaran
          </p>
          <div
            role="group"
            aria-label="Mode input takaran resep"
            className="inline-flex rounded-card border border-border bg-card p-1"
          >
            {(
              [
                ["per-porsi", "Takaran per porsi"],
                ["sekali-produksi", "Sekali produksi"],
              ] as const
            ).map(([nilai, label]) => (
              <button
                key={nilai}
                type="button"
                aria-pressed={modeTakaran === nilai}
                onClick={() => {
                  setModeTakaran(nilai);
                  setError(null);
                }}
                className={`rounded-card px-3 py-1.5 text-xs font-medium transition-colors ${
                  modeTakaran === nilai
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {modeTakaran === "sekali-produksi" && (
            <Input
              id="jumlah-porsi-produksi"
              label="Jumlah porsi yang dihasilkan"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={jumlahPorsi}
              onChange={(e) => setJumlahPorsi(e.target.value)}
              placeholder="Contoh: 50"
              helper="Satu angka ini berlaku untuk seluruh bahan dalam resep."
              error={
                jumlahPorsi !== "" && !jumlahPorsiValid
                  ? "Jumlah porsi harus lebih dari 0."
                  : undefined
              }
              className="mt-3 max-w-xs"
            />
          )}
        </div>

        <ul className="mt-3 flex flex-col gap-2">
          {baris.map((b) => {
            const bahanTerpilih = bahan.find((x) => x.id === b.bahanBakuId);
            const pilihanSatuan = pilihanSatuanUntuk(bahanTerpilih?.satuan ?? "");
            const jumlahInput = Number(b.jumlah);
            const jumlahDalamSatuanDasar = konversiKeSatuanDasar(
              jumlahInput,
              b.satuanDipilih,
              bahanTerpilih?.satuan ?? "",
            );
            const hasilPerPorsi =
              modeTakaran === "sekali-produksi" &&
              b.jumlah.trim() !== "" &&
              Number.isFinite(jumlahDalamSatuanDasar) &&
              jumlahDalamSatuanDasar > 0 &&
              jumlahPorsiValid
                ? jumlahDalamSatuanDasar / jumlahPorsiAngka
                : null;
            return (
              <li key={b.key} className="flex flex-wrap items-end gap-2">
                <label className="min-w-48 flex-1">
                  <span className="sr-only">Bahan baku</span>
                  <select
                    value={b.bahanBakuId}
                    onChange={(e) => {
                      const bahanBakuId = Number(e.target.value);
                      const satuanDasar = bahan.find((item) => item.id === bahanBakuId)?.satuan ?? "";
                      ubahBaris(b.key, {
                        bahanBakuId,
                        satuanDipilih: pilihanSatuanUntuk(satuanDasar)[0].nilai,
                      });
                    }}
                    className="h-10 w-full rounded-card border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                  >
                    {bahan.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.nama}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex w-48 items-end gap-1.5">
                  <label className="min-w-0 flex-1">
                    <span className="sr-only">
                      {modeTakaran === "per-porsi"
                        ? "Jumlah dipakai per porsi"
                        : "Jumlah dipakai sekali produksi"}
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      inputMode="decimal"
                      value={b.jumlah}
                      placeholder="0"
                      onChange={(e) => ubahBaris(b.key, { jumlah: e.target.value })}
                      className="h-10 w-full rounded-card border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                    />
                  </label>

                  <label className="w-20 shrink-0">
                    <span className="sr-only">Satuan jumlah</span>
                    <select
                      value={b.satuanDipilih}
                      onChange={(e) => ubahBaris(b.key, { satuanDipilih: e.target.value })}
                      aria-label={`Satuan untuk ${bahanTerpilih?.nama ?? "bahan"}`}
                      className="h-10 w-full rounded-card border border-border bg-card px-2 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                    >
                      {pilihanSatuan.map((satuan) => (
                        <option key={satuan.nilai} value={satuan.nilai}>
                          {satuan.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {modeTakaran === "sekali-produksi" && (
                  <div className="w-40 shrink-0 pb-0.5 text-xs">
                    <span className="block text-muted-foreground">
                      Hasil per porsi
                    </span>
                    <output
                      aria-live="polite"
                      className={
                        b.jumlah.trim() !== "" && !jumlahPorsiValid
                          ? "font-medium text-destructive"
                          : "font-medium text-foreground"
                      }
                    >
                      {b.jumlah.trim() === ""
                        ? "Masukkan jumlah bahan"
                        : !jumlahPorsiValid
                          ? "Isi jumlah porsi dulu"
                          : hasilPerPorsi === null
                            ? "Jumlah harus lebih dari 0"
                            : `${formatJumlah(hasilPerPorsi)} ${bahanTerpilih?.satuan.trim() ?? ""}`}
                    </output>
                  </div>
                )}

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

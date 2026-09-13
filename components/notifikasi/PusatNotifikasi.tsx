"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { IconCentang, IconLonceng, IconProduk } from "@/components/ui/icons";
import {
  useNotifikasi,
  type NotifikasiDenganProduk,
} from "@/components/notifikasi/NotifikasiProvider";
import { formatTanggal } from "@/lib/format";

type Ringkasan = {
  jumlahProduk: number | null;
  pemicu: string | null;
};

function pesanGalat(isi: unknown, fallback: string): string {
  if (
    isi &&
    typeof isi === "object" &&
    "error" in isi &&
    typeof isi.error === "string"
  ) {
    return isi.error;
  }
  return fallback;
}

function bacaRingkasan(pesan: string): Ringkasan {
  const cocok = pesan.match(
    /^(\d+) produk mengalami perubahan harga jual karena (.+?)[.]?$/i,
  );
  if (!cocok) return { jumlahProduk: null, pemicu: null };

  return {
    jumlahProduk: Number(cocok[1]),
    pemicu: cocok[2],
  };
}

export function PusatNotifikasi() {
  const wadahRef = useRef<HTMLDivElement>(null);
  const {
    belumDibaca,
    modalAwal,
    galatSinkronisasi,
    segarkan,
    hapusBelumDibaca,
    kosongkanBelumDibaca,
    konfirmasiModalAwal,
  } = useNotifikasi();
  const [daftar, setDaftar] = useState<NotifikasiDenganProduk[] | null>(null);
  const [dropdownTerbuka, setDropdownTerbuka] = useState(false);
  const [memuatDaftar, setMemuatDaftar] = useState(false);
  const [menandai, setMenandai] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const ambilSemua = useCallback(async () => {
    setMemuatDaftar(true);
    setGalat(null);
    try {
      const respons = await fetch("/api/notifikasi", { cache: "no-store" });
      const isi: unknown = await respons.json().catch(() => null);
      if (!respons.ok) {
        throw new Error(pesanGalat(isi, "Gagal memuat daftar notifikasi."));
      }
      setDaftar(Array.isArray(isi) ? (isi as NotifikasiDenganProduk[]) : []);
    } catch (error) {
      setGalat(error instanceof Error ? error.message : "Gagal memuat daftar notifikasi.");
    } finally {
      setMemuatDaftar(false);
    }
  }, []);

  useEffect(() => {
    if (!dropdownTerbuka) return;

    function tutupSaatKlikDiLuar(event: MouseEvent) {
      if (!wadahRef.current?.contains(event.target as Node)) {
        setDropdownTerbuka(false);
      }
    }

    function tutupSaatEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setDropdownTerbuka(false);
    }

    document.addEventListener("mousedown", tutupSaatKlikDiLuar);
    document.addEventListener("keydown", tutupSaatEscape);
    return () => {
      document.removeEventListener("mousedown", tutupSaatKlikDiLuar);
      document.removeEventListener("keydown", tutupSaatEscape);
    };
  }, [dropdownTerbuka]);

  async function tandaiSatu(id: number, tutupModal = false) {
    setMenandai(true);
    setGalat(null);
    try {
      const respons = await fetch(`/api/notifikasi/${id}`, {
        method: "PATCH",
        cache: "no-store",
      });
      const isi: unknown = await respons.json().catch(() => null);
      if (!respons.ok) {
        throw new Error(pesanGalat(isi, "Gagal menandai notifikasi."));
      }

      hapusBelumDibaca(id);
      setDaftar((saatIni) =>
        saatIni?.map((item) =>
          item.id === id ? { ...item, sudahDibaca: true } : item,
        ) ?? null,
      );
      if (tutupModal) konfirmasiModalAwal();
    } catch (error) {
      setGalat(error instanceof Error ? error.message : "Gagal menandai notifikasi.");
    } finally {
      setMenandai(false);
    }
  }

  async function tandaiSemua() {
    setMenandai(true);
    setGalat(null);
    try {
      const respons = await fetch("/api/notifikasi", {
        method: "PATCH",
        cache: "no-store",
      });
      const isi: unknown = await respons.json().catch(() => null);
      if (!respons.ok) {
        throw new Error(pesanGalat(isi, "Gagal menandai semua notifikasi."));
      }

      kosongkanBelumDibaca();
      setDaftar((saatIni) =>
        saatIni?.map((item) => ({ ...item, sudahDibaca: true })) ?? null,
      );
      konfirmasiModalAwal();
    } catch (error) {
      setGalat(error instanceof Error ? error.message : "Gagal menandai semua notifikasi.");
    } finally {
      setMenandai(false);
    }
  }

  function bukaDropdown() {
    const akanTerbuka = !dropdownTerbuka;
    setDropdownTerbuka(akanTerbuka);
    if (akanTerbuka) void ambilSemua();
  }

  const ringkasan = modalAwal
    ? bacaRingkasan(modalAwal.pesan)
    : null;
  const galatAktif = galat ?? galatSinkronisasi;

  return (
    <>
      <div ref={wadahRef} className="relative">
        <Button
          varian="ghost"
          ukuran="sm"
          onClick={bukaDropdown}
          aria-label={
            belumDibaca.length > 0
              ? `Notifikasi, ${belumDibaca.length} belum dibaca`
              : "Notifikasi"
          }
          aria-expanded={dropdownTerbuka}
          className="relative px-2"
        >
          <IconLonceng width={18} height={18} />
          {belumDibaca.length > 0 && (
            <span className="absolute -top-1 -right-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[0.625rem] font-semibold leading-none text-white">
              {belumDibaca.length > 99 ? "99+" : belumDibaca.length}
            </span>
          )}
        </Button>

        {dropdownTerbuka && (
          <section
            aria-label="Daftar notifikasi"
            className="absolute top-11 right-0 z-30 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-card border border-border bg-card shadow-[0_14px_36px_rgba(32,46,40,0.14)]"
          >
            <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Notifikasi</h2>
                <p className="text-xs text-muted-foreground">
                  {belumDibaca.length} belum dibaca
                </p>
              </div>
              {belumDibaca.length > 0 && (
                <Button
                  varian="link"
                  ukuran="sm"
                  disabled={menandai}
                  onClick={() => void tandaiSemua()}
                >
                  Tandai semua dibaca
                </Button>
              )}
            </header>

            <div className="max-h-96 overflow-y-auto">
              {memuatDaftar ? (
                <div className="space-y-3 p-4" aria-label="Memuat notifikasi">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="animate-pulse space-y-2 motion-reduce:animate-none">
                      <div className="h-3 w-2/3 rounded bg-muted" />
                      <div className="h-3 w-full rounded bg-muted" />
                    </div>
                  ))}
                </div>
              ) : galatAktif ? (
                <div className="p-4 text-sm">
                  <p className="text-destructive">{galatAktif}</p>
                  <Button
                    varian="link"
                    ukuran="sm"
                    className="mt-2"
                    onClick={() => void Promise.all([ambilSemua(), segarkan()])}
                  >
                    Coba lagi
                  </Button>
                </div>
              ) : daftar && daftar.length > 0 ? (
                <ul>
                  {daftar.map((item) => (
                    <li
                      key={item.id}
                      className={`border-b border-border px-4 py-3 last:border-b-0 ${
                        item.sudahDibaca ? "bg-card" : "bg-accent/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-card bg-accent text-primary">
                          <IconProduk width={16} height={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">{item.judul}</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {item.pesan}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[0.6875rem] text-muted-foreground">
                              {formatTanggal(item.tanggal)}
                            </span>
                            {!item.sudahDibaca && (
                              <button
                                type="button"
                                disabled={menandai}
                                onClick={() => void tandaiSatu(item.id)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50"
                              >
                                <IconCentang width={13} height={13} />
                                Tandai dibaca
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-5 py-8 text-center">
                  <span className="mx-auto flex size-9 items-center justify-center rounded-card bg-accent text-primary">
                    <IconLonceng width={18} height={18} />
                  </span>
                  <p className="mt-3 text-sm font-medium text-foreground">
                    Belum ada notifikasi
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Perubahan harga otomatis akan muncul di sini.
                  </p>
                </div>
              )}
            </div>

            <footer className="border-t border-border px-4 py-3 text-right">
              <Link
                href="/produk"
                onClick={() => setDropdownTerbuka(false)}
                className="text-xs font-medium text-primary hover:underline underline-offset-4"
              >
                Buka halaman produk
              </Link>
            </footer>
          </section>
        )}
      </div>

      {modalAwal && (
        <Modal
          terbuka
          onTutup={konfirmasiModalAwal}
          judul={modalAwal.judul}
          subjudul="Harga jual disesuaikan agar target margin tetap terjaga."
          aksiSekunder={
            <Link
              href="/produk"
              onClick={konfirmasiModalAwal}
              className="text-sm font-medium text-primary hover:underline underline-offset-4"
            >
              Lihat produk
            </Link>
          }
          aksiPrimer={
            <Button
              varian="primary"
              ukuran="sm"
              disabled={menandai}
              onClick={() => void tandaiSatu(modalAwal.id, true)}
            >
              {menandai ? "Menyimpan..." : "Mengerti"}
            </Button>
          }
        >
          <div className="space-y-4">
            {ringkasan?.jumlahProduk !== null && ringkasan?.pemicu ? (
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-card border border-info-border bg-info-bg px-4 py-3">
                <span className="text-2xl font-semibold text-info">
                  {ringkasan.jumlahProduk}
                </span>
                <span className="self-center text-sm font-medium text-foreground">
                  produk disesuaikan
                </span>
                <span className="col-start-2 text-xs text-muted-foreground">
                  Pemicu: {ringkasan.pemicu}
                </span>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-foreground">
                {modalAwal.pesan}
              </p>
            )}

            {modalAwal.produkTerdampak &&
              modalAwal.produkTerdampak.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Produk terdampak
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {modalAwal.produkTerdampak.map((produk, index) => (
                      <li
                        key={produk.id ?? `${produk.nama}-${index}`}
                        className="rounded-card border border-border px-3 py-2 text-sm text-foreground"
                      >
                        {produk.nama}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {galatAktif && <p className="text-sm text-destructive">{galatAktif}</p>}
          </div>
        </Modal>
      )}
    </>
  );
}

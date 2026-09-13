"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Notifikasi } from "@/lib/types";

export type ProdukTerdampak = { id?: number; nama: string };
export type NotifikasiDenganProduk = Notifikasi & {
  produkTerdampak?: ProdukTerdampak[];
};

type NilaiNotifikasi = {
  belumDibaca: NotifikasiDenganProduk[];
  modalAwal: NotifikasiDenganProduk | null;
  galatSinkronisasi: string | null;
  segarkan: () => Promise<void>;
  hapusBelumDibaca: (id: number) => void;
  kosongkanBelumDibaca: () => void;
  konfirmasiModalAwal: () => void;
};

const INTERVAL_SEGARKAN_MS = 60_000;
const NotifikasiContext = createContext<NilaiNotifikasi | null>(null);

function pesanGalat(isi: unknown): string {
  if (
    isi &&
    typeof isi === "object" &&
    "error" in isi &&
    typeof isi.error === "string"
  ) {
    return isi.error;
  }
  return "Gagal memuat notifikasi.";
}

export function NotifikasiProvider({ children }: { children: ReactNode }) {
  const [belumDibaca, setBelumDibaca] = useState<NotifikasiDenganProduk[]>([]);
  const [modalAwal, setModalAwal] = useState<NotifikasiDenganProduk | null>(null);
  const [galatSinkronisasi, setGalatSinkronisasi] = useState<string | null>(null);
  const permintaanAktif = useRef<Promise<void> | null>(null);

  const ambilBelumDibaca = useCallback((tampilkanModal: boolean) => {
    if (permintaanAktif.current) return permintaanAktif.current;

    const permintaan = (async () => {
      try {
        const respons = await fetch("/api/notifikasi?belumDibaca=true", {
          cache: "no-store",
        });
        const isi: unknown = await respons.json().catch(() => null);
        if (!respons.ok) throw new Error(pesanGalat(isi));

        const notifikasi = Array.isArray(isi)
          ? (isi as NotifikasiDenganProduk[])
          : [];
        setBelumDibaca(notifikasi);
        setGalatSinkronisasi(null);
        if (tampilkanModal && notifikasi.length > 0) {
          setModalAwal((saatIni) => saatIni ?? notifikasi[0]);
        }
      } catch (error) {
        setGalatSinkronisasi(
          error instanceof Error ? error.message : "Gagal memuat notifikasi.",
        );
      }
    })();

    permintaanAktif.current = permintaan;
    void permintaan.finally(() => {
      if (permintaanAktif.current === permintaan) {
        permintaanAktif.current = null;
      }
    });
    return permintaan;
  }, []);

  const segarkan = useCallback(
    () => ambilBelumDibaca(false),
    [ambilBelumDibaca],
  );

  useEffect(() => {
    const timerAwal = window.setTimeout(() => {
      void ambilBelumDibaca(true);
    }, 0);
    const interval = window.setInterval(() => {
      void segarkan();
    }, INTERVAL_SEGARKAN_MS);

    function tanganiPemicuEksplisit() {
      void segarkan();
    }

    window.addEventListener("notifikasi:segarkan", tanganiPemicuEksplisit);
    return () => {
      window.clearTimeout(timerAwal);
      window.clearInterval(interval);
      window.removeEventListener("notifikasi:segarkan", tanganiPemicuEksplisit);
    };
  }, [ambilBelumDibaca, segarkan]);

  const hapusBelumDibaca = useCallback((id: number) => {
    setBelumDibaca((saatIni) => saatIni.filter((item) => item.id !== id));
  }, []);

  const kosongkanBelumDibaca = useCallback(() => {
    setBelumDibaca([]);
  }, []);

  const konfirmasiModalAwal = useCallback(() => {
    setModalAwal(null);
  }, []);

  const nilai = useMemo(
    () => ({
      belumDibaca,
      modalAwal,
      galatSinkronisasi,
      segarkan,
      hapusBelumDibaca,
      kosongkanBelumDibaca,
      konfirmasiModalAwal,
    }),
    [
      belumDibaca,
      galatSinkronisasi,
      hapusBelumDibaca,
      konfirmasiModalAwal,
      kosongkanBelumDibaca,
      modalAwal,
      segarkan,
    ],
  );

  return (
    <NotifikasiContext.Provider value={nilai}>
      {children}
    </NotifikasiContext.Provider>
  );
}

export function useNotifikasi() {
  const nilai = useContext(NotifikasiContext);
  if (!nilai) {
    throw new Error("useNotifikasi harus dipakai di dalam NotifikasiProvider");
  }
  return nilai;
}

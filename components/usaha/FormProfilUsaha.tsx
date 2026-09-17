"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { simpanProfilUsaha } from "@/lib/actions/usaha";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PilihOpsi } from "@/components/ui/PilihOpsi";
import { JENIS_USAHA_KULINER } from "@/lib/jenisUsaha";

export function FormProfilUsaha({
  namaUsahaAwal,
  jenisUsahaAwal,
  namaPemilik,
  email,
}: {
  namaUsahaAwal: string;
  jenisUsahaAwal: string;
  namaPemilik: string;
  email: string;
}) {
  const router = useRouter();
  const [menyimpan, mulaiSimpan] = useTransition();
  const [namaUsaha, setNamaUsaha] = useState(namaUsahaAwal);
  const [jenisUsaha, setJenisUsaha] = useState(jenisUsahaAwal);
  const [galat, setGalat] = useState<string | null>(null);
  const [tersimpan, setTersimpan] = useState(false);

  const berubah = namaUsaha !== namaUsahaAwal || jenisUsaha !== jenisUsahaAwal;

  function kirim(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGalat(null);
    setTersimpan(false);

    if (namaUsaha.trim() === "") {
      setGalat("Nama usaha wajib diisi.");
      return;
    }

    mulaiSimpan(async () => {
      const hasil = await simpanProfilUsaha({ namaUsaha, jenisUsaha });

      if (!hasil.ok) {
        setGalat(hasil.error);
        return;
      }

      setTersimpan(true);
      // Sidebar membaca nama usaha dari server, jadi perlu dirender ulang.
      router.refresh();
    });
  }

  return (
    <form onSubmit={kirim}>
      <Card>
        <CardHeader className="flex-col items-stretch">
          <div>
            <CardTitle>Identitas usaha</CardTitle>
            <CardDescription className="mt-1">
              Nama ini yang tampil di sidebar dan menandai seluruh data usahamu.
            </CardDescription>
          </div>
        </CardHeader>

        <div className="grid gap-5 px-5 py-5 sm:grid-cols-2">
          <Input
            id="nama-usaha"
            label="Nama usaha"
            value={namaUsaha}
            onChange={(e) => setNamaUsaha(e.target.value)}
            placeholder="Contoh: Dapur Bu Sari"
            autoComplete="organization"
            error={galat ?? undefined}
          />

          <PilihOpsi
            id="jenis-usaha"
            label="Jenis usaha"
            opsi={JENIS_USAHA_KULINER.map((jenis) => ({ nilai: jenis, label: jenis }))}
            nilai={jenisUsaha}
            onPilih={setJenisUsaha}
            helper="Dipakai sebagai keterangan di bawah nama usaha."
          />
        </div>

        {tersimpan && !berubah && (
          <div className="px-5 pb-1">
            <Banner varian="info">Profil usaha tersimpan.</Banner>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
          <p className="text-xs text-muted-foreground">
            {berubah
              ? "Perubahan baru berlaku setelah disimpan."
              : "Pemilik akun ini: " + namaPemilik + " · " + email}
          </p>
          <Button varian="primary" ukuran="sm" type="submit" disabled={!berubah || menyimpan}>
            {menyimpan ? "Menyimpan…" : "Simpan profil"}
          </Button>
        </div>
      </Card>
    </form>
  );
}

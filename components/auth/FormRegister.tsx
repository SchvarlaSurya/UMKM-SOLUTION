"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { JENIS_USAHA_KULINER } from "@/lib/jenisUsaha";

const PANJANG_SANDI_MINIMUM = 8;

/** Pesan yang menunjuk satu kolom tertentu. */
type GalatKolom = {
  nama?: string;
  namaUsaha?: string;
  email?: string;
  password?: string;
  konfirmasi?: string;
};

export function FormRegister() {
  const router = useRouter();
  // Dipisah dari pesan tingkat formulir karena tempat tampilnya berbeda: yang
  // menunjuk kolom tampil inline, yang menyangkut seluruh formulir tampil
  // sebagai toast melayang supaya tidak memanjangkan formulirnya. Sebelumnya
  // semuanya memakai satu state dan selalu dirender di kolom terakhir, jadi
  // "Nama usaha wajib diisi" muncul di bawah "Ulangi kata sandi" — menunjuk
  // kolom yang sama sekali tidak bermasalah.
  const [galatKolom, setGalatKolom] = useState<GalatKolom>({});
  const [memproses, setMemproses] = useState(false);
  const tampilkanToast = useToast();
  const refFormulir = useRef<HTMLFormElement>(null);

  // Fokus dipindahkan ke kolom bermasalah yang pertama. Formulir ini punya
  // enam kolom; tanpa itu pengguna keyboard harus menelusurinya sendiri.
  useEffect(() => {
    if (Object.keys(galatKolom).length === 0) return;
    refFormulir.current
      ?.querySelector<HTMLInputElement>('[aria-invalid="true"]')
      ?.focus();
  }, [galatKolom]);

  async function kirim(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const nama = String(data.get("nama") ?? "").trim();
    const namaUsaha = String(data.get("namaUsaha") ?? "").trim();
    const jenisUsaha = String(data.get("jenisUsaha") ?? "");
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const konfirmasi = String(data.get("konfirmasi") ?? "");

    // Semua masalah dikumpulkan sekaligus, bukan satu per satu: mengisi ulang
    // formulir enam kolom satu kesalahan per percobaan melelahkan.
    const kolom: GalatKolom = {};
    if (nama === "") kolom.nama = "Nama pemilik usaha wajib diisi.";
    if (namaUsaha === "") kolom.namaUsaha = "Nama usaha wajib diisi.";
    if (email === "") kolom.email = "Email wajib diisi.";

    if (password === "") {
      kolom.password = "Kata sandi wajib diisi.";
    } else if (password.length < PANJANG_SANDI_MINIMUM) {
      kolom.password = `Kata sandi minimal ${PANJANG_SANDI_MINIMUM} karakter.`;
    } else if (password !== konfirmasi) {
      kolom.konfirmasi = "Konfirmasi kata sandi belum sama.";
    }

    if (Object.keys(kolom).length > 0) {
      setGalatKolom(kolom);
      return;
    }

    setGalatKolom({});
    setMemproses(true);

    try {
      const respons = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, email, password, namaUsaha, jenisUsaha }),
      });

      if (!respons.ok) {
        const isi = await respons.json().catch(() => null);
        setMemproses(false);
        tampilkanToast({
          varian: "galat",
          pesan: isi?.error ?? "Gagal membuat akun. Coba lagi sebentar lagi.",
        });
        return;
      }

      router.push("/login?terdaftar=1");
    } catch {
      setMemproses(false);
      tampilkanToast({
        varian: "galat",
        pesan: "Tidak bisa menghubungi server. Periksa koneksimu.",
      });
    }
  }

  return (
    <form ref={refFormulir} onSubmit={kirim} className="flex flex-col gap-4" noValidate>
      <Input
        id="nama"
        name="nama"
        label="Nama pemilik usaha"
        autoComplete="name"
        placeholder="Contoh: Bu Sari"
        error={galatKolom.nama}
      />

      <Input
        id="nama-usaha"
        name="namaUsaha"
        label="Nama usaha"
        autoComplete="organization"
        placeholder="Contoh: Dapur Bu Sari"
        helper="Nama ini yang tampil di aplikasi sebagai identitas usahamu."
        error={galatKolom.namaUsaha}
      />

      <Select id="jenis-usaha" name="jenisUsaha" label="Jenis usaha" defaultValue={JENIS_USAHA_KULINER[0]}>
        {JENIS_USAHA_KULINER.map((jenis) => (
          <option key={jenis} value={jenis}>
            {jenis}
          </option>
        ))}
      </Select>

      <Input
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        placeholder="nama@usaha.com"
        error={galatKolom.email}
      />

      <Input
        id="password"
        name="password"
        type="password"
        label="Kata sandi"
        autoComplete="new-password"
        placeholder="••••••••"
        helper={`Minimal ${PANJANG_SANDI_MINIMUM} karakter.`}
        error={galatKolom.password}
      />

      <Input
        id="konfirmasi"
        name="konfirmasi"
        type="password"
        label="Ulangi kata sandi"
        autoComplete="new-password"
        placeholder="••••••••"
        error={galatKolom.konfirmasi}
      />

      <Button type="submit" varian="primary" disabled={memproses} className="mt-1 w-full">
        {memproses ? "Memproses…" : "Buat akun"}
      </Button>
    </form>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

/** Pesan yang menunjuk satu kolom tertentu. */
type GalatKolom = {
  email?: string;
  password?: string;
};

export function FormLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const baruTerdaftar = searchParams.get("terdaftar") === "1";

  // Dua jenis pesan, dipisah karena tempat tampilnya berbeda: yang menyangkut
  // satu kolom tampil di bawah kolomnya, yang menyangkut seluruh formulir
  // tampil sebagai toast melayang supaya tidak memanjangkan formulirnya.
  // Sebelumnya keduanya memakai satu state dan selalu dirender di kolom
  // terakhir, jadi "Email dan kata sandi wajib diisi" muncul seolah hanya
  // kata sandinya yang bermasalah.
  const [galatKolom, setGalatKolom] = useState<GalatKolom>({});
  const [memproses, setMemproses] = useState(false);
  const tampilkanToast = useToast();
  const refFormulir = useRef<HTMLFormElement>(null);

  // Fokus dipindahkan ke kolom bermasalah yang pertama. Tanpa ini pengguna
  // keyboard harus menelusuri sendiri formulirnya untuk menemukan yang salah.
  useEffect(() => {
    if (Object.keys(galatKolom).length === 0) return;
    refFormulir.current
      ?.querySelector<HTMLInputElement>('[aria-invalid="true"]')
      ?.focus();
  }, [galatKolom]);

  async function kirim(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");

    const kolom: GalatKolom = {};
    if (email === "") kolom.email = "Email wajib diisi.";
    if (password === "") kolom.password = "Kata sandi wajib diisi.";

    if (kolom.email || kolom.password) {
      setGalatKolom(kolom);
      return;
    }

    setGalatKolom({});
    setMemproses(true);

    try {
      const hasil = await signIn("credentials", { email, password, redirect: false });

      if (hasil?.ok) {
        router.push(callbackUrl);
        router.refresh();
        return;
      }

      // Sengaja tidak menyebut mana yang salah: menyebutkannya membocorkan email
      // mana yang terdaftar kepada siapa pun yang mencoba menebak.
      tampilkanToast({
        varian: "galat",
        pesan:
          hasil?.error === "CredentialsSignin"
            ? "Email atau kata sandi salah."
            : "Gagal masuk. Coba lagi sebentar lagi.",
      });
    } catch {
      tampilkanToast({
        varian: "galat",
        pesan: "Tidak bisa menghubungi server. Periksa koneksimu.",
      });
    } finally {
      setMemproses(false);
    }
  }

  return (
    <form ref={refFormulir} onSubmit={kirim} className="flex flex-col gap-4" noValidate>
      {/* Tetap inline, bukan toast: ini bukan tanggapan atas tindakan di
          halaman ini, melainkan keterangan yang sudah ada sejak halaman
          digambar — jadi tidak ada yang bergeser karenanya. */}
      {baruTerdaftar && (
        <Banner varian="info">Akun berhasil dibuat. Masuk dengan email dan kata sandimu.</Banner>
      )}

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
        autoComplete="current-password"
        placeholder="••••••••"
        error={galatKolom.password}
      />

      <Button type="submit" varian="primary" disabled={memproses} className="mt-1 w-full">
        {memproses ? "Memproses…" : "Masuk"}
      </Button>
    </form>
  );
}

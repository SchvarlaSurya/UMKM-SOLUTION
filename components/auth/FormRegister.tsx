"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const PANJANG_SANDI_MINIMUM = 8;

export function FormRegister() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);

  async function kirim(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const nama = String(data.get("nama") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const konfirmasi = String(data.get("konfirmasi") ?? "");

    if (nama === "" || email === "" || password === "") {
      setError("Nama, email, dan kata sandi wajib diisi.");
      return;
    }
    if (password.length < PANJANG_SANDI_MINIMUM) {
      setError(`Kata sandi minimal ${PANJANG_SANDI_MINIMUM} karakter.`);
      return;
    }
    if (password !== konfirmasi) {
      setError("Konfirmasi kata sandi belum sama.");
      return;
    }

    setError(null);
    setMemproses(true);

    try {
      const respons = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, email, password }),
      });

      if (!respons.ok) {
        const isi = await respons.json().catch(() => null);
        setMemproses(false);
        setError(isi?.error ?? "Gagal membuat akun. Coba lagi sebentar lagi.");
        return;
      }

      router.push("/login?terdaftar=1");
    } catch {
      setMemproses(false);
      setError("Tidak bisa menghubungi server. Periksa koneksimu.");
    }
  }

  return (
    <form onSubmit={kirim} className="flex flex-col gap-4">
      <Input
        id="nama"
        name="nama"
        label="Nama pemilik usaha"
        autoComplete="name"
        placeholder="Contoh: Bu Sari"
      />

      <Input
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        placeholder="nama@usaha.com"
      />

      <Input
        id="password"
        name="password"
        type="password"
        label="Kata sandi"
        autoComplete="new-password"
        placeholder="••••••••"
        helper={`Minimal ${PANJANG_SANDI_MINIMUM} karakter.`}
      />

      <Input
        id="konfirmasi"
        name="konfirmasi"
        type="password"
        label="Ulangi kata sandi"
        autoComplete="new-password"
        placeholder="••••••••"
        error={error ?? undefined}
      />

      <Button type="submit" varian="primary" disabled={memproses} className="mt-1 w-full">
        {memproses ? "Memproses…" : "Buat akun"}
      </Button>
    </form>
  );
}

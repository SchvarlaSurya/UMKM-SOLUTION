"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function FormLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const baruTerdaftar = searchParams.get("terdaftar") === "1";

  const [error, setError] = useState<string | null>(null);
  const [memproses, setMemproses] = useState(false);

  async function kirim(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");

    if (email === "" || password === "") {
      setError("Email dan kata sandi wajib diisi.");
      return;
    }

    setError(null);
    setMemproses(true);

    const hasil = await signIn("credentials", { email, password, redirect: false });

    if (hasil?.ok) {
      router.push(callbackUrl);
      router.refresh();
      return;
    }

    setMemproses(false);
    setError(
      hasil?.error === "CredentialsSignin"
        ? "Email atau kata sandi salah."
        : "Gagal masuk. Coba lagi sebentar lagi.",
    );
  }

  return (
    <form onSubmit={kirim} className="flex flex-col gap-4">
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
      />

      <Input
        id="password"
        name="password"
        type="password"
        label="Kata sandi"
        autoComplete="current-password"
        placeholder="••••••••"
        error={error ?? undefined}
      />

      <Button type="submit" varian="primary" disabled={memproses} className="mt-1 w-full">
        {memproses ? "Memproses…" : "Masuk"}
      </Button>
    </form>
  );
}

import Link from "next/link";
import { Suspense } from "react";
import { FormLogin } from "@/components/auth/FormLogin";
import { KartuAuth } from "@/components/auth/KartuAuth";

export const metadata = {
  title: "Masuk — Ruang Margin",
};

export default function LoginPage() {
  return (
    <KartuAuth
      judul="Masuk ke ruang usahamu"
      subjudul="Pantau HPP dan margin setiap produk dari satu tempat."
      footer={
        <>
          Belum punya akun?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline underline-offset-4">
            Daftar sekarang
          </Link>
        </>
      }
    >
      {/* useSearchParams butuh batas Suspense karena halaman ini dirender statis. */}
      <Suspense fallback={<p className="text-sm text-muted-foreground">Menyiapkan form…</p>}>
        <FormLogin />
      </Suspense>
    </KartuAuth>
  );
}

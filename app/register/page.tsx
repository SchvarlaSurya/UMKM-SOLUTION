import Link from "next/link";
import { FormRegister } from "@/components/auth/FormRegister";
import { KartuAuth } from "@/components/auth/KartuAuth";

export const metadata = {
  title: "Daftar — Ruang Margin",
};

export default function RegisterPage() {
  return (
    <KartuAuth
      varian="daftar"
      judul="Buat akun usaha"
      subjudul="Satu akun untuk mencatat bahan, biaya, dan margin produkmu."
      footer={
        <>
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline underline-offset-4">
            Masuk di sini
          </Link>
        </>
      }
    >
      <FormRegister />
    </KartuAuth>
  );
}

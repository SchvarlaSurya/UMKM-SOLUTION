import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { FormProfilUsaha } from "@/components/usaha/FormProfilUsaha";
import { PageHeader } from "@/components/ui/PageHeader";
import { authOptions } from "@/lib/authOptions";
import { JENIS_USAHA_KULINER } from "@/lib/jenisUsaha";
import { prisma } from "@/lib/prisma";

export default async function ProfilUsahaPage() {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);
  if (!Number.isSafeInteger(userId) || userId <= 0) redirect("/login");

  const usaha = await prisma.usaha.findUnique({
    where: { userId },
    select: { namaUsaha: true, jenisUsaha: true },
  });

  return (
    <>
      <PageHeader
        judul="Profil usaha"
        subjudul="Ganti nama usaha kalau salah ketik, atau lengkapi kalau belum pernah diisi."
      />

      <FormProfilUsaha
        // Akun yang mendaftar sebelum profil usaha ada belum punya barisnya.
        namaUsahaAwal={usaha?.namaUsaha ?? ""}
        jenisUsahaAwal={usaha?.jenisUsaha ?? JENIS_USAHA_KULINER[0]}
        namaPemilik={session?.user?.name ?? "Pemilik"}
        email={session?.user?.email ?? ""}
      />
    </>
  );
}

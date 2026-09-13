import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { AppShell } from "@/components/layout/AppShell";
import { NotifikasiProvider } from "@/components/notifikasi/NotifikasiProvider";
import { prisma } from "@/lib/prisma";

/**
 * Semua halaman di bawah grup ini membaca database per permintaan, jadi tidak
 * boleh diprarender saat build.
 */
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await getServerSession(authOptions);
  const namaPemilik = session?.user?.name ?? "Pemilik";
  const userId = Number(session?.user?.id);

  // Akun yang mendaftar sebelum profil usaha ada belum punya barisnya, jadi
  // sidebar jatuh kembali ke nama pemilik daripada tampil kosong.
  const usaha =
    Number.isSafeInteger(userId) && userId > 0
      ? await prisma.usaha.findUnique({
          where: { userId },
          select: { namaUsaha: true, jenisUsaha: true },
        })
      : null;

  return (
    <NotifikasiProvider>
      <AppShell
        profil={{
          namaUsaha: usaha?.namaUsaha ?? namaPemilik,
          kategoriUsaha: usaha?.jenisUsaha ?? "Usaha kuliner",
          namaPemilik,
          peran: "Pemilik usaha",
          email: session?.user?.email ?? undefined,
        }}
      >
        {children}
      </AppShell>
    </NotifikasiProvider>
  );
}

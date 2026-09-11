import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { AppShell } from "@/components/layout/AppShell";

/**
 * Semua halaman di bawah grup ini membaca database per permintaan, jadi tidak
 * boleh diprarender saat build.
 */
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await getServerSession(authOptions);
  const nama = session?.user?.name ?? "Usahaku";

  return (
    <AppShell
      profil={{
        namaUsaha: nama,
        kategoriUsaha: "Usaha kuliner",
        namaPemilik: nama,
        peran: "Pemilik usaha",
        email: session?.user?.email ?? undefined,
      }}
    >
      {children}
    </AppShell>
  );
}

import { AppShell } from "@/components/layout/AppShell";
import { profilUsahaMock } from "@/lib/mock/data";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return <AppShell profil={profilUsahaMock}>{children}</AppShell>;
}

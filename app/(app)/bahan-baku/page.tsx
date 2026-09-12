import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { HalamanBahanBaku } from "@/components/bahan-baku/HalamanBahanBaku";
import { authOptions } from "@/lib/authOptions";
import { getDataHalamanBahanBaku } from "@/lib/data";

export default async function BahanBakuPage() {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);
  if (!Number.isSafeInteger(userId) || userId <= 0) redirect("/login");

  const { bahan, pemakaian } = await getDataHalamanBahanBaku(userId);

  return <HalamanBahanBaku bahan={bahan} pemakaian={pemakaian} />;
}

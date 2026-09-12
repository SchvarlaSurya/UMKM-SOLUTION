import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { HalamanTren } from "@/components/tren/HalamanTren";
import { authOptions } from "@/lib/authOptions";
import { getDataHalamanTren } from "@/lib/data";

export default async function TrenHargaPage() {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);
  if (!Number.isSafeInteger(userId) || userId <= 0) redirect("/login");

  const { bahan, histori, pemakaian, tren } = await getDataHalamanTren(userId);

  return <HalamanTren bahan={bahan} histori={histori} pemakaian={pemakaian} tren={tren} />;
}

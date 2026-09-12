import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { HalamanBiayaOperasional } from "@/components/biaya-operasional/HalamanBiayaOperasional";
import { authOptions } from "@/lib/authOptions";
import { getDataHalamanBiayaOperasional } from "@/lib/data";

export default async function BiayaOperasionalPage() {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);
  if (!Number.isSafeInteger(userId) || userId <= 0) redirect("/login");

  const { biaya, pengaturan } = await getDataHalamanBiayaOperasional(userId);

  return <HalamanBiayaOperasional biaya={biaya} pengaturan={pengaturan} />;
}

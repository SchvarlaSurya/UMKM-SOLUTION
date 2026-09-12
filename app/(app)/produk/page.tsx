import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { HalamanProduk } from "@/components/produk/HalamanProduk";
import { authOptions } from "@/lib/authOptions";
import { getDataHalamanProduk } from "@/lib/data";

export default async function ProdukPage() {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);
  if (!Number.isSafeInteger(userId) || userId <= 0) redirect("/login");

  const { produk, bahan } = await getDataHalamanProduk(userId);

  return <HalamanProduk produk={produk} bahan={bahan} />;
}

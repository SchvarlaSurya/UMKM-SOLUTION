import { HalamanBiayaOperasional } from "@/components/biaya-operasional/HalamanBiayaOperasional";
import { getBiayaOperasional, getPengaturan } from "@/lib/data";

export default async function BiayaOperasionalPage() {
  const [biaya, pengaturan] = await Promise.all([getBiayaOperasional(), getPengaturan()]);

  return <HalamanBiayaOperasional biaya={biaya} pengaturan={pengaturan} />;
}

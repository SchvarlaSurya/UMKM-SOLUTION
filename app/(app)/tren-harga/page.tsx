import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { IconTren } from "@/components/ui/icons";

export default function TrenHargaPage() {
  return (
    <>
      <PageHeader
        label="Pantau perubahan"
        judul="Tren harga bahan"
        subjudul="Lihat perubahan harga sebelum margin ikut berubah."
      />
      <EmptyState
        ikon={<IconTren />}
        judul="Grafik histori harga menyusul"
        deskripsi="Butuh endpoint GET histori harga dari backend; sementara ini halaman memakai data demo saat grafik dan tabel catatan perubahan dibangun."
      />
    </>
  );
}

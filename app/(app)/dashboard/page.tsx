import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { IconDashboard, IconTambah } from "@/components/ui/icons";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        label="Kesehatan usaha"
        judul="Kenali angka. Jaga untung."
        subjudul="Pantau HPP dan margin setiap produk, tanpa biaya yang terlewat."
        aksi={
          <Button varian="primary">
            <IconTambah width={16} height={16} />
            Tambah produk
          </Button>
        }
      />
      <EmptyState
        ikon={<IconDashboard />}
        judul="Isi dashboard menyusul"
        deskripsi="Summary card, alert banner, tabel margin produk, widget pergerakan harga bahan, dan panel catatan margin dibangun di iterasi berikutnya."
      />
    </>
  );
}

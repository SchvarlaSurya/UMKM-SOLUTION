import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { IconBiaya, IconTambah } from "@/components/ui/icons";

export default function BiayaOperasionalPage() {
  return (
    <>
      <PageHeader
        label="Kelola usaha"
        judul="Biaya operasional"
        subjudul="Masukkan biaya yang sering luput dari perhitungan."
        aksi={
          <Button varian="primary">
            <IconTambah width={16} height={16} />
            Tambah biaya
          </Button>
        }
      />
      <EmptyState
        ikon={<IconBiaya />}
        judul="Alokasi biaya tetap menyusul"
        deskripsi="Card alokasi biaya tetap per porsi, tabel daftar biaya, dan form tambah biaya dibangun di iterasi berikutnya."
      />
    </>
  );
}

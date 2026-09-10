import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { IconBahan, IconTambah } from "@/components/ui/icons";

export default function BahanBakuPage() {
  return (
    <>
      <PageHeader
        label="Kelola usaha"
        judul="Bahan baku"
        subjudul="Satu harga diperbarui, semua resep terkait ikut terhitung."
        aksi={
          <Button varian="primary">
            <IconTambah width={16} height={16} />
            Tambah bahan
          </Button>
        }
      />
      <Banner varian="info">
        Perubahan harga akan menghitung ulang HPP seluruh produk terkait.
      </Banner>
      <EmptyState
        ikon={<IconBahan />}
        judul="Tabel bahan baku menyusul"
        deskripsi="Daftar bahan, kolom pemakaian per produk, dan form edit harga dibangun di iterasi berikutnya."
      />
    </>
  );
}

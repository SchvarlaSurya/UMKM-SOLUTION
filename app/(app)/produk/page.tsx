import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { IconProduk, IconTambah } from "@/components/ui/icons";

export default function ProdukPage() {
  return (
    <>
      <PageHeader
        label="Kelola usaha"
        judul="Produk & resep"
        subjudul="Takaran yang tepat membuat HPP lebih akurat."
        aksi={
          <Button varian="primary">
            <IconTambah width={16} height={16} />
            Tambah produk
          </Button>
        }
      />
      <EmptyState
        ikon={<IconProduk />}
        judul="Card grid produk menyusul"
        deskripsi="Kartu produk beserta status margin dan form edit produk & resep dibangun di iterasi berikutnya."
      />
    </>
  );
}

import { Banner } from "@/components/ui/Banner";
import { ButtonLink } from "@/components/ui/Button";
import { IconPanahKanan } from "@/components/ui/icons";
import { formatPersen } from "@/lib/format";

/** Rangkai nama produk: "A, B, dan N lainnya". */
function daftarNama(nama: string[]): string {
  if (nama.length <= 2) return nama.join(" dan ");
  const sisa = nama.length - 2;
  return `${nama[0]}, ${nama[1]}, dan ${sisa} lainnya`;
}

/** Muncul hanya bila ada produk di bawah batas margin aman. */
export function AlertMargin({
  namaProduk,
  batasMargin,
}: {
  namaProduk: string[];
  batasMargin: number;
}) {
  if (namaProduk.length === 0) return null;

  return (
    <Banner
      varian="warning"
      judul={`Ada ${namaProduk.length} produk yang marginnya mulai bocor.`}
      aksi={
        <ButtonLink href="/produk" varian="secondary" ukuran="sm">
          Periksa produk
          <IconPanahKanan width={14} height={14} />
        </ButtonLink>
      }
    >
      {daftarNama(namaProduk)} berada di bawah batas {formatPersen(batasMargin, 0)}.
    </Banner>
  );
}

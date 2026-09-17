import { Banner } from "@/components/ui/Banner";
import { ButtonLink } from "@/components/ui/Button";
import { MasukHalus } from "@/components/ui/MasukHalus";
import { IconPanahKanan } from "@/components/ui/icons";
import type { BahanBasi } from "@/lib/hargaBasi";

/**
 * Peringatan bahwa HPP di halaman ini dihitung dari harga yang sudah lama tidak
 * dicek.
 *
 * Yang ditampilkan hanya bahan paling lama tidak diperbarui; sisanya dihitung
 * jadi satu kalimat dan ditelusuri di halaman bahan baku. Menyebut semuanya di
 * sini membuat peringatannya sepanjang daftar, dan tindakannya tetap sama.
 *
 * Varian info, bukan warning: peringatan margin bocor di atasnya menunjuk
 * kerugian yang sedang berjalan, sedangkan yang ini menunjuk data yang perlu
 * disegarkan. Dua banner warning berjajar membuat keduanya sama-sama diabaikan.
 */
export function AlertHargaBasi({
  basi,
  pemakaian,
}: {
  basi: BahanBasi[];
  pemakaian: Record<number, number>;
}) {
  const [terlama, ...sisa] = basi;
  if (!terlama) return null;

  const dipakai = pemakaian[terlama.id] ?? 0;

  return (
    <MasukHalus>
      <Banner
        varian="info"
        judul={`Harga ${terlama.nama} belum diperbarui ${terlama.umurHari} hari.`}
        aksi={
          <ButtonLink href="/bahan-baku" varian="secondary" ukuran="sm">
            Periksa harga
            <IconPanahKanan width={14} height={14} />
          </ButtonLink>
        }
      >
        {dipakai > 0
          ? `Harga itu masih dipakai menghitung HPP ${dipakai} produk.`
          : "Bahan ini belum dipakai di resep mana pun."}
        {sisa.length > 0 && ` ${sisa.length} bahan lain juga sudah lewat sebulan.`}
      </Banner>
    </MasukHalus>
  );
}

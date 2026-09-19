import type { SVGProps } from "react";

/**
 * Logo "ruangmargin" — konsep Lensa Tren.
 *
 * Lingkaran tebal adalah "ruang" yang melindungi margin; di dalamnya grafik
 * garis menanjak mewakili pemantauan tren harga bahan; dan simpul yang lebih
 * besar di ujung kanan atas mewakili peringatan yang dikirim aplikasi saat
 * margin bocor atau harga sudah lama tidak diperbarui.
 *
 * Bentuk ikonnya digambar pada petak 0–100 lalu dipasang ulang lewat satu
 * transform saat dipakai bersama tulisan. Dengan begitu ikon sendirian dan
 * ikon di dalam kunci logo tidak pernah berbeda proporsi.
 *
 * Koordinat tulisannya diukur dari Inter yang benar-benar dimuat aplikasi ini,
 * pada font-size 80 dengan garis alas y=80:
 *
 *   lebar "ruangmargin" (400 + 700)   490,76
 *   puncak tinggi-x                    35,78
 *   dasar ekor "g"                     97,27
 *
 * getBBox() pada teks SVG tidak bisa dipakai untuk ini: yang dikembalikannya
 * kotak em, bukan kotak tinta, sehingga semua huruf melapor tinggi yang sama.
 * Angka di atas diambil lewat canvas TextMetrics. Mengganti font berarti
 * mengukur ulang.
 */

/** Ikon pada petak 0–100, tanpa pembungkus <svg> sendiri. */
function LensaTren() {
  return (
    <>
      {/* Lensa: ruang yang melindungi margin. */}
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="none"
        strokeWidth="8"
        className="stroke-slate-600"
      />

      {/* Tren harga yang menanjak dari kiri bawah ke kanan atas. */}
      <path
        d="M28 64 42 50 54 58 72 36"
        fill="none"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-orange-500"
      />

      {/*
        Simpul peringatan. Jari-jarinya 7 lawan 4 milik ujung garis, jadi ia
        menonjol tanpa terbaca sebagai bentuk terpisah dari grafiknya.
      */}
      <circle cx="72" cy="36" r="7" className="fill-orange-500" />
    </>
  );
}

export function Logo({
  teks = true,
  ...props
}: SVGProps<SVGSVGElement> & {
  /** Sertakan tulisan "ruangmargin" di sebelah ikon. */
  teks?: boolean;
}) {
  if (!teks) {
    return (
      <svg viewBox="0 0 100 100" role="img" aria-label="ruangmargin logo" {...props}>
        <title>ruangmargin</title>
        <LensaTren />
      </svg>
    );
  }

  return (
    <svg viewBox="0 14 589 89" role="img" aria-label="ruangmargin logo" {...props}>
      <title>ruangmargin</title>

      {/*
        Ikon dikecilkan jadi setinggi 76 dan dipusatkan pada pita tinggi-x
        tulisannya, bukan pada seluruh kotak teks: memusatkannya pada kotak
        penuh ikut menghitung ekor "g" dan membuat ikonnya duduk terlalu tinggi.
      */}
      <g transform="translate(-5.18 14.69) scale(0.864)">
        <LensaTren />
      </g>

      <text x="98" y="80" fontSize="80" fontFamily="inherit" className="fill-slate-800">
        <tspan fontWeight="400">ruang</tspan>
        <tspan fontWeight="700">margin</tspan>
      </text>
    </svg>
  );
}

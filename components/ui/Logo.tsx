/**
 * Logotype "ruangmargin" — konsep Fokus Batas.
 *
 * Murni teks, tanpa ikon terpisah. Dua sentuhan membawa maknanya:
 *
 * - Titik pada "i" diganti tanda seru. Aplikasi ini memang berdiri di atas
 *   peringatan — margin bocor dan harga yang belum diperbarui — jadi tanda itu
 *   ditaruh di satu-satunya tempat yang secara alami sudah berisi titik.
 * - Balok penyorot di bawah "margin". Yang ditakar aplikasi ini adalah margin,
 *   dan penyorot menandai persis kata itu.
 *
 * Digambar sebagai <svg> dengan <text>, bukan HTML biasa: tanda seru harus
 * duduk tepat di posisi titik huruf "i", dan penyorotnya harus mulai persis di
 * huruf "m" dari "margin". Keduanya butuh koordinat, dan koordinat butuh kanvas
 * yang tidak ikut bergeser oleh pembungkus di sekitarnya.
 *
 * Semua angka di bawah diukur dari Inter yang benar-benar dimuat aplikasi ini,
 * pada font-size 80 dengan garis alas di y=80:
 *
 *   lebar seluruh kata      490,76
 *   "margin" mulai di x     218,67
 *   sumbu batang "i"        430,11
 *   puncak tinggi-x         35,78
 *   puncak batang "i"       36,33
 *   dasar ekor "g"          97,27
 *
 * Kalau fontnya diganti, angka-angka itu ikut berubah dan perlu diukur ulang.
 */

/** Warna penyorot. Di luar palet aplikasi, dipatok oleh panduan merek. */
const WARNA_PENYOROT = "#0D9488";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 492 128"
      className={className}
      role="img"
      aria-label="ruangmargin"
      fill="currentColor"
    >
      <title>ruangmargin</title>

      {/*
        Huruf terakhir "margin" ditulis dengan ı tanpa titik (U+0131), bukan i
        biasa: titik bawaannya harus hilang supaya tanda seru di bawah ini tidak
        bertumpuk dengan titik asli. Teksnya tidak pernah dibaca pembaca layar —
        `role="img"` dan `aria-label` yang mengambil alih — jadi ejaan
        internalnya tidak bocor ke pengguna.
      */}
      <text x="0" y="80" fontSize="80" fontFamily="inherit">
        <tspan fontWeight="400">ruang</tspan>
        <tspan fontWeight="700">margın</tspan>
      </text>

      {/*
        Tanda seru pengganti titik "i", duduk di sumbu batangnya (x=430).

        Lebarnya 9 — sedikit di bawah batang "i" yang 11,7 — supaya terbaca
        sebagai tanda baca, bukan sebagai perpanjangan batangnya. Tingginya 17;
        versi yang lebih pendek sudah dicoba dan hasilnya terbaca sebagai dua
        titik bertumpuk, bukan tanda seru.

        Dasarnya berhenti di 32,3, menyisakan 4 ke puncak batang "i" di 36,33 —
        jarak yang sama dengan jarak batang ke titiknya, jadi ketiganya terbaca
        satu kesatuan.
      */}
      <rect x="425.5" y="2.8" width="9" height="17" rx="4.5" />
      <circle cx="430" cy="27.8" r="4.5" />

      {/*
        Penyorot dimulai persis di tepi kiri "m" dan berakhir di tepi kanan "n",
        di bawah ekor "g" supaya tidak memotongnya.
      */}
      <rect
        x="218.67"
        y="104"
        width="272.09"
        height="14"
        rx="4"
        fill={WARNA_PENYOROT}
      />
    </svg>
  );
}

import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content Security Policy tanpa nonce, mengikuti panduan Next
 * (node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md).
 *
 * Semua aset dilayani dari asal yang sama: font dari next/font, tanpa script
 * maupun gambar dari domain luar, jadi 'self' cukup. 'unsafe-inline' masih
 * dibutuhkan untuk script inline Next dan gaya inline Recharts; nonce
 * memaksa setiap halaman dirender dinamis, termasuk landing yang sekarang
 * statis. 'unsafe-eval' hanya di `next dev`, dipakai React untuk merakit
 * ulang stack galat server.
 *
 * `upgrade-insecure-requests` dan HSTS sengaja tidak dipasang di sini:
 * aplikasi masih dijalankan lewat http://localhost. Keduanya masuk checklist
 * deploy, dipasang setelah HTTPS aktif.
 */
const kebijakanKonten = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Tidak boleh dibingkai situs mana pun: mencegah clickjacking, misalnya
  // tombol hapus produk yang ditumpuk di bawah halaman lain.
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // Tidak perlu memberi tahu siapa pun framework dan versinya.
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: kebijakanKonten },
          // Pendahulu frame-ancestors, untuk peramban lama.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

/**
 * Akun demo untuk juri dan pengunjung yang ingin mencoba aplikasi tanpa
 * mendaftar. Satu-satunya tempat nilainya ditulis: halaman masuk membacanya
 * untuk tombol isi-otomatis, dan prisma/seed-demo.ts memakainya untuk membuat
 * akunnya. Dengan begitu keduanya tidak bisa berbeda.
 *
 * Ini kata sandi yang SENGAJA publik. Jangan pernah memakai kata sandi sungguhan
 * di sini, dan jangan menyimpan data usaha sungguhan di akun ini: siapa pun yang
 * membuka halaman masuk bisa memakainya, dan datanya diisi ulang dari nol setiap
 * `npm run seed:demo` dijalankan.
 *
 * Domain `.test` dicadangkan standar (RFC 2606) dan tidak pernah bisa menjadi
 * alamat surel yang menerima pesan, jadi email ini tidak mengarah ke siapa pun.
 */
export const AKUN_DEMO = {
  email: "juri@demo.umkm-solution.test",
  password: "JuriDemo2026!",
  nama: "Juri Demo",
  namaUsaha: "Warung Makan Bu Sari",
  jenisUsaha: "Warung Makan",
} as const;

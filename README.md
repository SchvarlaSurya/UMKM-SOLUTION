# Ruang Margin

Aplikasi web penghitung HPP (harga pokok produksi) dan pemantau margin untuk UMKM kuliner: warung makan, katering, kedai minuman, toko kue, dan penjual camilan.

Pemilik usaha mencatat bahan baku, biaya operasional, dan resep tiap produk. Dari situ aplikasi menghitung modal sebenarnya per porsi dan margin yang tersisa dari harga jual. Setiap kali harga bahan berubah, HPP dan margin semua produk yang memakainya ikut dihitung ulang, dan pemiliknya diberi tahu.

Karya tim **ApajaDeh** untuk Garda Tech National Innovation Competition (GTNIC) 2026, kategori Web Developer, sub-tema *Accelerating Digital Transformation for Business and SMEs*.

**Coba langsung: https://umkm-solution.vercel.app**

![Landing page Ruang Margin](docs/gambar/landing.png)

## Coba tanpa mendaftar

Halaman [masuk](https://umkm-solution.vercel.app/login) punya kotak **Akun demo untuk juri**. Tekan **Isi otomatis**, lalu **Masuk**. Akun ini sudah berisi contoh bahan, resep, dan produk.

| | |
|---|---|
| Email | `juri@demo.umkm-solution.test` |
| Kata sandi | `JuriDemo2026!` |

Akun ini publik dan dipakai bersama, jadi datanya bisa berubah oleh pengunjung lain. Isinya diatur ulang dengan `npm run seed:demo`. Nilainya ditulis di satu tempat, [`lib/akunDemo.ts`](lib/akunDemo.ts).

Landing page juga punya simulasi yang bisa dicoba tanpa akun apa pun: ubah harga ayam, harga jual, dan target untung, lalu lihat modal per porsi dan marginnya berubah.

## Yang bisa dilakukan

- **Dashboard**: ringkasan jumlah produk, rata-rata margin, dan produk yang perlu perhatian, lengkap dengan peringatan margin bocor yang menyebut nama produknya.
- **Rincian HPP** per produk: tiap bahan beserta takarannya, alokasi biaya tetap per porsi, dan potongan biaya persentase.
- **Bahan baku**: setiap perubahan harga tercatat dan langsung menghitung ulang semua produk yang memakainya. Bahan yang 30 hari atau lebih belum diperbarui ditandai.
- **Produk dan resep**: takaran bisa diisi per porsi atau per sekali produksi, dengan konversi satuan. Harga jual diketik manual atau dihitung mundur dari target margin.
- **Biaya operasional**: biaya tetap dan biaya persentase, beserta estimasi porsi per bulan dan batas margin aman.
- **Tren harga bahan**: grafik riwayat harga, dan penanda untuk bahan yang tiga perubahan terakhirnya naik berturut-turut.
- **Notifikasi**: pemilik diberi tahu saat harga jual berubah otomatis, lengkap dengan penyebabnya.

Satu akun mewakili satu usaha, dan datanya terpisah dari akun lain.

![Dashboard](docs/gambar/dashboard.png)

| Rincian HPP | Tren harga bahan |
|---|---|
| ![Rincian HPP](docs/gambar/rincian-hpp.png) | ![Tren harga bahan](docs/gambar/tren-harga.png) |

Penjelasan lengkap fitur, rumus, dan batasannya ada di [docs/tentang-proyek.md](docs/tentang-proyek.md).

## Rumus inti

```
HPP        = biaya bahan per porsi + alokasi biaya tetap per porsi
Margin (%) = (harga jual - HPP - potongan persentase) / harga jual x 100
```

Keduanya ada di [`lib/hpp.ts`](lib/hpp.ts) sebagai fungsi murni tanpa sentuhan basis data, dan punya pengujian sendiri.

## Teknologi

| Bagian | Pilihan |
|---|---|
| Kerangka | Next.js 16 (App Router), React 19 |
| Bahasa dan gaya | TypeScript (strict), Tailwind CSS v4 |
| Basis data | PostgreSQL (Supabase) + Prisma 7 (driver adapter `@prisma/adapter-pg`) |
| Autentikasi | NextAuth v4, sesi JWT, kata sandi di-hash dengan bcrypt |
| Grafik | Recharts |
| Animasi | anime.js v4 |
| Pengujian | test runner bawaan Node (`node:test`) lewat `tsx` |
| CI | GitHub Actions |
| Hosting | Vercel |

## Menjalankan secara lokal

Butuh Node.js 24 (sama dengan CI; Next.js 16 minimal 20.9) dan database PostgreSQL. Tim memakai PostgreSQL di Supabase.

```bash
git clone https://github.com/SchvarlaSurya/UMKM-SOLUTION.git
cd UMKM-SOLUTION
npm ci
```

Buat berkas `.env` di akar proyek. Berkas ini diabaikan Git, jadi jangan pernah di-commit.

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"
NEXTAUTH_SECRET="string-acak-panjang"
NEXTAUTH_URL="http://localhost:3000"
```

| Variabel | Wajib | Kegunaan |
|---|---|---|
| `DATABASE_URL` | ya | Koneksi PostgreSQL, dipakai aplikasi dan Prisma CLI (lewat `prisma.config.ts`). |
| `NEXTAUTH_SECRET` | ya | Kunci penanda tangan token sesi. Buat dengan `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | ya | Alamat aplikasi. Untuk lokal: `http://localhost:3000`. Di production: alamat lengkap dengan `https://`. |
| `DIRECT_URL` | tidak | Ada di `.env` tim, tetapi **saat ini tidak dibaca** kode maupun `prisma.config.ts`. Aman dibiarkan. |
| `PRISMA_POOL_MAX`, `PRISMA_POOL_MIN` | tidak | Ukuran pool koneksi. Bawaannya menyesuaikan mode pooler Supabase; lihat `lib/prisma.ts`. |

> Untuk `prisma migrate deploy`, `DATABASE_URL` sebaiknya mengarah ke koneksi langsung atau *session pooler* Supabase (port 5432), bukan *transaction pooler* (port 6543). Migrasi lewat transaction pooler bisa menggantung atau gagal.

Siapkan klien Prisma dan skema database, lalu jalankan:

```bash
npx prisma generate        # app/generated/prisma diabaikan Git, jadi wajib dibuat sendiri
npx prisma migrate deploy  # terapkan migrasi di prisma/migrations
npm run dev                # http://localhost:3000
```

Halaman `/` adalah landing page untuk tamu. Pengunjung yang masih punya sesi langsung diarahkan ke `/dashboard`.

### Data contoh

| Perintah | Hasilnya |
|---|---|
| `npm run seed:demo` | Membuat atau menyegarkan akun demo juri dan mengisinya dengan data contoh dari nol. Akun lain tidak disentuh. |
| `npm run seed` | Mengisi data contoh ke akun yang sudah ada: akun paling awal, atau akun tertentu dengan `SEED_EMAIL=nama@usaha.com npm run seed`. Tabel `User` tidak pernah disentuh. |

Keduanya menulis ke basis data yang ditunjuk `DATABASE_URL`. Periksa dulu `.env`-mu mengarah ke mana sebelum menjalankannya.

## Perintah

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | server pengembangan |
| `npm run build` | build produksi |
| `npm start` | jalankan hasil build |
| `npm run lint` | ESLint (Next.js Core Web Vitals + TypeScript) |
| `npx next typegen && npx tsc --noEmit` | cek tipe; `typegen` wajib lebih dulu di checkout bersih |
| `npm test` | seluruh pengujian unit |
| `npm run seed`, `npm run seed:demo` | isi data contoh (lihat di atas) |

## Pengujian

```bash
npm test
```

Menjalankan `tsx --test tests/*.test.ts`. Per 9 November 2026 ada **118 test dalam 29 suite di 12 berkas**, semuanya lulus. Angka ini akan bertambah, jadi yang benar selalu keluaran `npm test` itu sendiri.

Pengujian tidak menyentuh database. Yang butuh Prisma memakai tiruan secukupnya. Yang diuji: rumus HPP dan margin, pembulatan harga, konversi satuan, riwayat dan tren harga, perhitungan ulang beserta percobaan ulang transaksi, normalisasi email, pembatas percobaan masuk, dan simulasi di landing page.

Belum punya pengujian otomatis: route handler secara utuh (integrasi dengan database) dan tampilan. Bagian itu diperiksa manual sebelum tiap pull request.

## CI

Setiap pull request dan setiap push ke `main` menjalankan [`.github/workflows/ci.yml`](.github/workflows/ci.yml) di GitHub Actions (Ubuntu, Node 24):

1. `npm ci`
2. `npx prisma generate`
3. `npm run lint`
4. `npx next typegen && npx tsc --noEmit`
5. `npm test`
6. `npm run build`

CI memakai nilai tiruan untuk `DATABASE_URL` dan `NEXTAUTH_SECRET`, dan tidak ada langkah yang terhubung ke database.

`package-lock.json` harus tetap valid untuk Linux. Lock file yang dibuat di Windows pernah kehilangan dependensi opsional wasm32, sehingga `npm ci` di CI gagal. Kalau CI gagal di langkah `npm ci` dengan pesan `Missing: ... from lock file`, periksa lock file-nya dulu.

## Struktur folder

```
app/            halaman App Router
  (app)/        layar yang butuh login: dashboard, bahan-baku, produk, dst.
  api/          route handler (semua memanggil requireAuth, kecuali register dan NextAuth)
  login/, register/
  page.tsx      landing page
components/     komponen per fitur; primitif bersama di components/ui/
lib/            auth, akses data, rumus HPP, analisis tren, rate limiting, tipe bersama
prisma/         skema, migrasi, dan seed
tests/          pengujian unit
docs/           dokumentasi proyek, catatan audit, dan gambar untuk README
proxy.ts        penjaga rute (pengganti middleware.ts di Next.js 16)
```

## Batas yang disengaja

Ini keputusan ruang lingkup, bukan kekurangan yang terlewat:

- Tidak memprediksi harga bahan dan tidak terhubung ke data pasar. Aplikasi hanya tahu apa yang dicatat pemiliknya.
- Tidak mengelola stok. Yang dicatat adalah harga per satuan.
- Tidak mencatat penjualan. Jumlah porsi per bulan adalah perkiraan yang diisi pemilik.
- Satu akun satu usaha.

## Keterbatasan yang diketahui

- **Pembatas percobaan masuk dan daftar** (`lib/batasPercobaan.ts`) menyimpan hitungan di memori proses Node. Di Vercel (serverless), tiap instans punya hitungannya sendiri, jadi batas 5 percobaan per 15 menit tidak berlaku penuh. Penyimpanannya perlu dipindah ke Redis atau tabel PostgreSQL. Rinciannya ada di [docs/checklist-deploy.md](docs/checklist-deploy.md).
- **Akun demo juri bersifat publik.** Jangan menyimpan data usaha sungguhan di sana.

## Tim

Tim **ApajaDeh**, SMK IDN Boarding School Solo:

| Nama | Peran |
|---|---|
| Rahmad Arifin Susilo (ketua) | Frontend dan pengalaman pengguna |
| Schvarla Surya Suharto | Backend |
| Muhammad Hideaki Isdianto | QA |

## Kontribusi

Aturan commit, pull request, dan gaya kode ada di [AGENTS.md](AGENTS.md). Singkatnya: commit berformat Conventional Commit dengan scope (`feat(produk): ...`), satu PR untuk satu perubahan, dan PR yang mengubah tampilan wajib menyertakan screenshot.

# Ruang Margin

Aplikasi web penghitung HPP (harga pokok produksi) dan pemantau margin untuk UMKM kuliner: warung makan, katering, kedai minuman, toko kue, dan penjual camilan.

Pemilik usaha mencatat bahan baku, biaya operasional, dan resep tiap produk. Dari situ aplikasi menghitung modal sebenarnya per porsi dan margin yang tersisa dari harga jual. Setiap kali harga bahan berubah, HPP semua produk yang memakainya ikut dihitung ulang.

> **Status:** aplikasi ini baru dijalankan secara lokal di laptop pengembang. Belum ada deployment ke VPS atau server mana pun. Sebelum deploy, baca [docs/checklist-deploy.md](docs/checklist-deploy.md).

Penjelasan lengkap fitur, rumus, dan batasannya ada di [docs/tentang-proyek.md](docs/tentang-proyek.md).

## Teknologi

| Bagian | Pilihan |
|---|---|
| Kerangka | Next.js 16 (App Router), React 19 |
| Bahasa & gaya | TypeScript (strict), Tailwind CSS v4 |
| Basis data | PostgreSQL + Prisma 7 (driver adapter `@prisma/adapter-pg`) |
| Autentikasi | NextAuth v4, sesi JWT, kata sandi di-hash dengan bcrypt |
| Grafik | Recharts |
| Animasi | anime.js v4 |
| Pengujian | test runner bawaan Node (`node:test`) lewat `tsx` |
| CI | GitHub Actions |

## Menjalankan secara lokal

Butuh Node.js 24 (sama dengan CI; Next.js 16 minimal 20.9) dan database PostgreSQL. Tim saat ini memakai PostgreSQL di Supabase.

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
| `NEXTAUTH_URL` | ya | Alamat aplikasi. Untuk lokal: `http://localhost:3000`. |
| `DIRECT_URL` | tidak | Ada di `.env` tim, tetapi **saat ini tidak dibaca** kode maupun `prisma.config.ts`. Aman dibiarkan. |
| `PRISMA_POOL_MAX`, `PRISMA_POOL_MIN` | tidak | Ukuran pool koneksi. Bawaannya menyesuaikan mode pooler Supabase; lihat `lib/prisma.ts`. |

> Untuk `prisma migrate deploy`, sebaiknya `DATABASE_URL` mengarah ke koneksi langsung atau *session pooler* Supabase (port 5432), bukan *transaction pooler* (port 6543). Migrasi lewat transaction pooler bisa gagal.

Siapkan klien Prisma dan skema database, lalu jalankan:

```bash
npx prisma generate        # app/generated/prisma diabaikan Git, jadi wajib dibuat sendiri
npx prisma migrate deploy  # terapkan migrasi di prisma/migrations
npm run dev                # http://localhost:3000
```

Halaman `/` adalah landing page untuk tamu. Pengunjung yang masih punya sesi langsung diarahkan ke `/dashboard`.

Data contoh (opsional): daftar satu akun lewat `/register`, lalu jalankan `npm run seed`. Seed mengisi akun paling awal, atau akun tertentu dengan `SEED_EMAIL=nama@usaha.com npm run seed`. Tabel `User` tidak pernah disentuh.

## Perintah

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | server pengembangan |
| `npm run build` | build produksi |
| `npm start` | jalankan hasil build |
| `npm run lint` | ESLint (Next.js Core Web Vitals + TypeScript) |
| `npx next typegen && npx tsc --noEmit` | cek tipe; `typegen` wajib lebih dulu di checkout bersih |
| `npm test` | seluruh pengujian unit |
| `npm run seed` | isi data contoh |

## Pengujian

```bash
npm test
```

Menjalankan `tsx --test tests/*.test.ts`. Per 25 September 2026 (commit `27ffa17`) ada **85 test dalam 20 suite di 8 berkas**, semuanya lulus. Angka ini akan bertambah, jadi yang benar selalu keluaran `npm test` itu sendiri.

Pengujian tidak menyentuh database. Yang butuh Prisma memakai tiruan secukupnya.

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
docs/           dokumentasi proyek dan catatan audit
proxy.ts        penjaga rute (pengganti middleware.ts di Next.js 16)
```

## Kontribusi

Aturan commit, pull request, dan gaya kode ada di [AGENTS.md](AGENTS.md). Singkatnya: commit berformat Conventional Commit dengan scope (`feat(produk): ...`), satu PR untuk satu perubahan, dan PR yang mengubah tampilan wajib menyertakan screenshot.

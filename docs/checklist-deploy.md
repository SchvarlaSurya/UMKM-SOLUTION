# Catatan deployment dan checklist production

> **Status per 10 November 2026:** Ruang Margin sudah live di **Vercel** (https://umkm-solution.vercel.app) dengan basis data PostgreSQL di **Supabase**. Dokumen ini dulu ditulis untuk rencana VPS dengan satu proses Node di belakang nginx. Rencana itu tidak jadi dipakai, jadi isinya disesuaikan dengan keadaan sebenarnya.

Dokumen ini mencatat **apa yang sudah benar, apa yang diketahui belum benar, dan apa yang belum diverifikasi**. Tidak ada butir yang dicentang kecuali sudah benar-benar diperiksa.

## 1. Keadaan sekarang

| Bagian | Keadaan |
|---|---|
| Hosting aplikasi | Vercel (serverless: tiap permintaan bisa dilayani instans yang berbeda) |
| Basis data | PostgreSQL di Supabase |
| HTTPS | Aktif (dari Vercel); cookie sesi NextAuth ditandai `Secure` karena `NEXTAUTH_URL` memakai `https://` |
| CI | GitHub Actions: lint, typecheck, test, build di setiap PR dan push ke `main` |
| Akun demo juri | Ada, publik, dan dipakai bersama (lihat bagian 5) |

## 2. Yang diketahui belum benar: pembatas percobaan masuk

`lib/batasPercobaan.ts` menyimpan hitungan **di memori proses Node**. Di serverless, tiap instans punya hitungannya sendiri dan hilang saat instans dimatikan, sehingga batas 5 percobaan per 15 menit **praktis tidak berlaku** di Vercel. Pembatasan ini tidak boleh dianggap sebagai perlindungan yang aktif.

Yang masih bekerja di sana: kata sandi di-hash dengan bcrypt, pesan galat login seragam, waktu respons login diseragamkan (satu query dan satu `bcrypt.compare`, ada atau tidak akunnya), dan setiap query difilter per `userId`.

**Perbaikannya:** ganti penyimpanan di `lib/batasPercobaan.ts` ke **Redis** atau **tabel Postgres**. Antarmuka `periksa` / `catat` / `hapus` bisa dipertahankan, jadi `lib/verifikasiLogin.ts` dan `app/api/register/route.ts` tidak perlu diubah.

- [ ] Penyimpanan pembatas dipindah ke Redis atau Postgres.
- [ ] Setelah dipindah: kirim 6 percobaan login gagal untuk email yang sama dan pastikan percobaan ke-6 ditolak dengan "Terlalu banyak percobaan masuk".

## 3. Yang belum diverifikasi: asal alamat IP

Pembatas memakai kunci **IP + email**. IP dibaca dari `X-Real-IP`, dengan cadangan entri **terakhir** `X-Forwarded-For` (`ipDariHeader()` di `lib/batasPercobaan.ts`).

Kode itu ditulis dengan asumsi ada **reverse proxy sendiri (nginx)** yang menimpa `X-Real-IP`. Di Vercel tidak ada nginx buatan tim, dan belum diperiksa header apa yang sebenarnya dipasang platform serta apakah bisa dipercaya. Selama itu belum diperiksa, jangan menganggap IP yang dibaca sudah benar.

- [ ] Periksa dokumentasi Vercel untuk header IP klien dan apakah nilainya ditimpa platform.
- [ ] Sesuaikan `ipDariHeader()` dengan header yang terbukti dapat dipercaya, lalu perbarui komentarnya.

### Kalau suatu saat pindah ke VPS

Kembali ke rancangan awal: satu proses Node di belakang nginx yang **menimpa** `X-Real-IP`.

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Tanpa baris `X-Real-IP`, pembatas bisa dilewati dengan `X-Real-IP` palsu yang berbeda di tiap percobaan. Tutup juga port Node (3000) dari internet dan buat Node hanya mendengarkan di `127.0.0.1`. Pengaturan pool koneksi di `lib/prisma.ts` juga mengasumsikan satu proses, jadi periksa bagian itu saat pindah.

## 4. Variabel lingkungan production

| Variabel | Nilai production |
|---|---|
| `NEXTAUTH_URL` | `https://umkm-solution.vercel.app` (alamat lengkap dengan `https://`). **Bukan** `http://localhost:3000`. NextAuth memakainya untuk URL callback, dan `lib/api.ts` memakainya sebagai asal aplikasi. |
| `NEXTAUTH_SECRET` | string acak khusus production (`openssl rand -base64 32`). Jangan pakai ulang nilai dari `.env` lokal. |
| `DATABASE_URL` | basis data production. Sesuaikan `PRISMA_POOL_MAX`/`PRISMA_POOL_MIN` dengan mode pooler (lihat komentar di `lib/prisma.ts`). Transaction pooler Supabase (port 6543) cocok untuk serverless. |

Jangan pernah meng-commit berkas `.env`. Nilai ini diisi lewat pengaturan Environment Variables di Vercel.

## 5. Akun demo juri

Halaman masuk menampilkan kotak akun demo dengan tombol isi-otomatis. Nilainya ada di `lib/akunDemo.ts`, dan akunnya dibuat atau disegarkan dengan `npm run seed:demo`.

- Kata sandinya **sengaja publik** dan akunnya dipakai bersama, jadi datanya bisa diubah siapa saja. Jangan menyimpan data usaha sungguhan di sana.
- `npm run seed:demo` menulis ke basis data yang ditunjuk `DATABASE_URL`. Periksa dulu `.env` mengarah ke mana.
- Skrip ini menghapus dan mengisi ulang data **akun demo saja**. Akun lain tidak disentuh.
- [ ] Setelah lomba selesai: hapus `<AkunDemoJuri />` dari `components/auth/FormLogin.tsx` dan hapus akun demo dari basis data.

## 6. Migrasi basis data

- [ ] `npx prisma migrate deploy` dijalankan lewat koneksi langsung atau *session pooler* (port 5432), **bukan** transaction pooler (port 6543). Lewat 6543, `prisma migrate` pernah menggantung tanpa keluaran.
- Catatan: `DIRECT_URL` ada di `.env` tim tetapi **tidak dibaca** `prisma.config.ts`, yang hanya memakai `DATABASE_URL`. Untuk migrasi lewat port 5432, isi `DATABASE_URL` sementara dengan nilai `DIRECT_URL`.

## 7. Sebelum tiap deploy

- [ ] CI hijau untuk commit yang akan di-deploy.
- [ ] `NEXTAUTH_URL` dan `NEXTAUTH_SECRET` di Vercel berisi nilai production.
- [x] HTTPS aktif.

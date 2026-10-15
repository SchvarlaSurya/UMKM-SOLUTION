# Checklist sebelum deploy production

> **Belum relevan sekarang.** Per 15 Oktober 2026, Ruang Margin hanya dijalankan di localhost laptop pengembang. Belum ada VPS, domain, atau server production. Dokumen ini untuk dibaca **sebelum deploy sungguhan nanti**. Butir yang sudah ditangani di kode (header keamanan di `next.config.ts`, batas daftar per IP) disebut di bagiannya masing-masing; selebihnya belum dikerjakan.

Rencana yang diasumsikan kode saat ini: **satu VPS, satu proses Node, di belakang satu reverse proxy nginx.** Asumsi ini dipakai oleh rate limiting (`lib/batasPercobaan.ts`) dan oleh pengaturan pool koneksi (`lib/prisma.ts`). Kalau rencananya berubah, baca bagian 5 dulu.

## 1. Wajib: nginx menimpa `X-Real-IP`

Rate limiting login dan daftar memakai kunci **IP + email**, dan daftar juga dibatasi **20 per jam per IP** berapa pun emailnya. IP-nya dibaca dari header `X-Real-IP`, dengan cadangan entri terakhir `X-Forwarded-For` (lihat `ipDariHeader()` di `lib/batasPercobaan.ts`).

Tanpa reverse proxy, termasuk saat `npm run dev` di localhost, kedua header itu kosong dan semua permintaan berbagi kunci `tanpa-ip`. Akibatnya batas 20 pendaftaran per jam berlaku untuk seluruh server sekaligus. Itu wajar untuk pengembangan, tetapi jadi alasan tambahan butir ini wajib di production.

Header itu hanya bisa dipercaya kalau nginx **menimpanya** dengan alamat asli koneksi:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**Tanpa baris `X-Real-IP`, rate limiting bisa dilewati.** Penyerang cukup mengirim `X-Real-IP` palsu yang berbeda di setiap percobaan, dan setiap nilai mendapat jatah 5 percobaan baru.

Hal yang sama berlaku kalau port Node (3000) bisa diakses langsung dari internet tanpa melewati nginx. Tutup port itu di firewall, dan pastikan Node hanya mendengarkan di `127.0.0.1`.

Cara memeriksa setelah deploy: kirim 6 percobaan login gagal untuk email yang sama dengan `X-Real-IP` palsu yang berbeda-beda. Percobaan ke-6 harus tetap ditolak dengan pesan "Terlalu banyak percobaan masuk".

## 2. Wajib: variabel lingkungan production

| Variabel | Nilai production |
|---|---|
| `NEXTAUTH_URL` | domain production lengkap dengan `https://`, misalnya `https://ruangmargin.example`. **Bukan** `http://localhost:3000`. NextAuth memakainya untuk URL callback, dan `lib/api.ts` memakainya sebagai asal aplikasi. |
| `NEXTAUTH_SECRET` | string acak baru khusus production (`openssl rand -base64 32`). Jangan pakai ulang nilai dari `.env` lokal. |
| `DATABASE_URL` | database production. Sesuaikan `PRISMA_POOL_MAX`/`PRISMA_POOL_MIN` dengan mode pooler yang dipakai (lihat komentar di `lib/prisma.ts`). |

Jangan pernah meng-commit berkas `.env` production.

## 3. Wajib: Next.js bebas advisory keamanan

Per 14 Oktober 2026, `next` 16.3.4 terkena beberapa advisory `npm audit`, di antaranya SSRF di Image Optimization (high) dan cache poisoning SSG/ISR untuk aplikasi self-hosted (moderate). Upgrade-nya sengaja ditunda selama aplikasi hanya berjalan di localhost.

- [ ] Naikkan `next` dan `eslint-config-next` ke versi yang menutup advisory itu (≥ 16.3.8 saat ditulis), lalu uji ulang semua halaman.
- [ ] `npm audit --omit=dev` tidak menyisakan temuan high atau critical di paket runtime. Temuan di CLI `prisma` (`deepmerge-ts`, `mysql2`) tidak ikut berjalan di server; **jangan** jalankan `npm audit fix --force`, karena itu menurunkan Prisma ke 6.

## 4. Wajib: header keamanan untuk HTTPS

`next.config.ts` sudah memasang Content-Security-Policy (termasuk `frame-ancestors 'none'`), `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, dan `Permissions-Policy`, serta mematikan `X-Powered-By`. Dua header sengaja **belum** dipasang karena aplikasi masih berjalan lewat `http://localhost`:

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`. Pasang di nginx atau `next.config.ts` **setelah** HTTPS aktif dan semua subdomain memang HTTPS, karena peramban akan menolak versi HTTP selama dua tahun.
- `upgrade-insecure-requests` di CSP.

Cara memeriksa setelah deploy:

```bash
curl -sI https://ruangmargin.example/ | grep -iE "content-security|x-frame|strict-transport|x-powered"
```

`x-powered-by` tidak boleh muncul. Kalau nginx juga menambahkan header keamanan sendiri, pastikan tidak ada header yang terkirim ganda dengan nilai berbeda.

## 5. Pertimbangkan: rate limiting kalau lebih dari satu proses

Rate limiting saat ini **disimpan di memori proses Node**. Konsekuensinya:

- Hitungan hilang setiap kali server dimulai ulang.
- Kalau aplikasi dijalankan lebih dari satu proses (PM2 cluster, beberapa container, beberapa VPS di belakang load balancer) atau di platform serverless, **setiap proses punya hitungan sendiri**. Batas 5 percobaan per 15 menit dan 20 pendaftaran per jam per IP ikut berlipat sebanyak jumlah proses. Di serverless, batasnya praktis tidak berlaku.

Kalau deployment-nya bukan satu proses, ganti penyimpanan di `lib/batasPercobaan.ts` ke **Redis** atau **tabel Postgres** sebelum go-live. Antarmuka `periksa` / `catat` / `hapus` bisa dipertahankan, jadi `lib/verifikasiLogin.ts` dan `app/api/register/route.ts` tidak perlu diubah.

Asumsi satu proses yang sama juga dipakai pengaturan pool koneksi di `lib/prisma.ts`, jadi periksa juga bagian itu.

## 6. Sebelum dan sesudah deploy

- [ ] `npx prisma migrate deploy` terhadap database production, lewat koneksi langsung atau session pooler (port 5432), bukan transaction pooler (port 6543).
- [ ] CI hijau untuk commit yang akan di-deploy.
- [ ] Butir 1 (nginx `X-Real-IP`) sudah dipasang dan diuji.
- [ ] Butir 2 (`NEXTAUTH_URL`, `NEXTAUTH_SECRET`) sudah diisi nilai production.
- [ ] Butir 3 (upgrade Next.js, `npm audit`) sudah selesai.
- [ ] Butir 4 (HSTS, `upgrade-insecure-requests`) dipasang setelah HTTPS aktif, lalu diperiksa dengan `curl`.
- [ ] Butir 5 sudah diputuskan: tetap satu proses, atau penyimpanan rate limiting sudah dipindah.
- [ ] Port Node tidak terbuka ke publik. Hanya nginx (80/443) yang terbuka.
- [ ] HTTPS aktif. Cookie sesi NextAuth otomatis ditandai `Secure` kalau `NEXTAUTH_URL` memakai `https://`.

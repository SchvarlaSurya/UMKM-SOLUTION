# Checklist sebelum deploy production

> **Belum relevan sekarang.** Per 25 September 2026, Ruang Margin hanya dijalankan di localhost laptop pengembang. Belum ada VPS, domain, atau server production. Dokumen ini untuk dibaca **sebelum deploy sungguhan nanti**. Tidak ada satu pun butir di bawah yang sudah dikerjakan.

Rencana yang diasumsikan kode saat ini: **satu VPS, satu proses Node, di belakang satu reverse proxy nginx.** Asumsi ini dipakai oleh rate limiting (`lib/batasPercobaan.ts`) dan oleh pengaturan pool koneksi (`lib/prisma.ts`). Kalau rencananya berubah, baca bagian 3 dulu.

## 1. Wajib: nginx menimpa `X-Real-IP`

Rate limiting login dan daftar memakai kunci **IP + email**. IP-nya dibaca dari header `X-Real-IP`, dengan cadangan entri terakhir `X-Forwarded-For` (lihat `ipDariHeader()` di `lib/batasPercobaan.ts`).

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

## 3. Pertimbangkan: rate limiting kalau lebih dari satu proses

Rate limiting saat ini **disimpan di memori proses Node**. Konsekuensinya:

- Hitungan hilang setiap kali server dimulai ulang.
- Kalau aplikasi dijalankan lebih dari satu proses (PM2 cluster, beberapa container, beberapa VPS di belakang load balancer) atau di platform serverless, **setiap proses punya hitungan sendiri**. Batas 5 percobaan per 15 menit ikut berlipat sebanyak jumlah proses. Di serverless, batasnya praktis tidak berlaku.

Kalau deployment-nya bukan satu proses, ganti penyimpanan di `lib/batasPercobaan.ts` ke **Redis** atau **tabel Postgres** sebelum go-live. Antarmuka `periksa` / `catat` / `hapus` bisa dipertahankan, jadi `lib/verifikasiLogin.ts` dan `app/api/register/route.ts` tidak perlu diubah.

Asumsi satu proses yang sama juga dipakai pengaturan pool koneksi di `lib/prisma.ts`, jadi periksa juga bagian itu.

## 4. Sebelum dan sesudah deploy

- [ ] `npx prisma migrate deploy` terhadap database production, lewat koneksi langsung atau session pooler (port 5432), bukan transaction pooler (port 6543).
- [ ] CI hijau untuk commit yang akan di-deploy.
- [ ] Butir 1 (nginx `X-Real-IP`) sudah dipasang dan diuji.
- [ ] Butir 2 (`NEXTAUTH_URL`, `NEXTAUTH_SECRET`) sudah diisi nilai production.
- [ ] Butir 3 sudah diputuskan: tetap satu proses, atau penyimpanan rate limiting sudah dipindah.
- [ ] Port Node tidak terbuka ke publik. Hanya nginx (80/443) yang terbuka.
- [ ] HTTPS aktif. Cookie sesi NextAuth otomatis ditandai `Secure` kalau `NEXTAUTH_URL` memakai `https://`.

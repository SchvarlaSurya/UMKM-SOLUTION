# Audit performa rekalkulasi HPP

Tanggal audit: 12 September 2026

## Ringkasan keputusan

- N+1 pada pembacaan HPP massal dan penulisan snapshot sudah dihilangkan tanpa mengubah rumus HPP, margin, maupun aturan pembaruan harga jual.
- Untuk satu perubahan biaya operasional dengan 10 produk harga manual, jumlah query aplikasi turun dari **16 menjadi 7**. Median waktu jalur database pada lingkungan pengukuran turun dari **6,52 detik menjadi 2,07 detik**.
- Target akhir telah dikonfirmasi berupa VPS dengan `next start`, sementara development masih memakai `next dev`. `after()` tersedia di kedua mode, tetapi belum direkomendasikan karena bukan job queue durable dan keamanan shutdown baru dapat dipastikan saat rancangan deployment VPS dibuat.
- Optimistic UI juga belum direkomendasikan sekarang. State pending yang sudah ada cukup untuk menjaga UI jujur selama operasi atomik selesai; menampilkan angka HPP baru sebelum server mengonfirmasi justru berisiko membingungkan pengguna.

## Tugas 1 — audit dan perbaikan N+1

### Temuan

`recalculateProduk()` sudah mengambil daftar produk, `Pengaturan`, dan seluruh `BiayaOperasional` sekali per pemanggilan. Jadi dugaan bahwa dua tabel konteks tersebut masih dibaca ulang per produk tidak berlaku pada revisi yang diaudit.

Masalah yang masih ada:

1. `HppSnapshot` dibuat dengan satu `create()` untuk setiap produk. Jumlah write bertambah linear terhadap jumlah produk.
2. `HistoriHargaJual` dibuat satu per satu untuk setiap harga otomatis yang berubah.
3. `calculateAllHpp()` mengambil ID produk lalu memanggil `calculateHpp()` secara serial. Akibatnya data produk/resep/bahan, `Pengaturan`, dan `BiayaOperasional` dibaca ulang untuk setiap produk.

Perbaikan di `lib/hppCalculator.ts`:

- snapshot seluruh produk ditulis dengan satu `hppSnapshot.createMany()`;
- histori harga otomatis ditulis dengan satu `historiHargaJual.createMany()`;
- update `Produk.hargaJual` tetap satu per produk karena setiap produk mempunyai nilai baru yang berbeda; Prisma `updateMany()` tidak dapat menulis nilai berbeda per baris tanpa raw SQL;
- `calculateAllHpp()` sekarang mengambil semua produk beserta resep/bahannya dan konteks biaya masing-masing satu kali, lalu menghitung seluruh hasil di memori;
- pembacaan produk dan konteks pada `calculateHpp()` tunggal dijalankan bersamaan;
- notifikasi tetap satu `create()` karena desain saat ini memang membuat satu notifikasi ringkasan per pemicu, bukan satu notifikasi per produk.

### Pengukuran

Skenario terkontrol:

- PostgreSQL yang dikonfigurasi oleh `DATABASE_URL` proyek;
- satu user sementara, satu bahan, satu biaya tetap, dan 10 produk mode harga manual;
- satu update nilai biaya operasional diikuti `recalculateAllByBiayaOperasional()`;
- event query Prisma dicatat hanya selama update + rekalkulasi;
- seluruh data pengukuran dibuat dalam transaksi dan di-rollback;
- `BEGIN`/`ROLLBACK` tidak masuk hitungan karena pencatatan dimulai setelah transaksi aktif dan dihentikan sebelum rollback. Overhead batas transaksi sama pada kedua versi.

| Versi | Komposisi query | Jumlah | Sampel waktu | Median |
| --- | --- | ---: | --- | ---: |
| Sebelum | 1 update biaya + 5 SELECT konteks/relasi + 10 INSERT snapshot | 16 | 5,61 s; 6,52 s; 6,92 s | 6,52 s |
| Sesudah | 1 update biaya + 5 SELECT konteks/relasi + 1 bulk INSERT snapshot | 7 | 2,02 s; 2,07 s; 2,13 s | 2,07 s |

Hasilnya adalah pengurangan **9 query (56,25%)** dan sekitar **68% waktu jalur database** pada lingkungan ini. Angka waktu bukan target SLA karena dipengaruhi jarak dan kondisi PostgreSQL, tetapi perbandingan memakai data serta koneksi yang sama.

Server Action edit melakukan satu `findFirst()` sebelum transaksi untuk memastikan biaya milik user. Query preflight yang sama pada kedua versi itu tidak dimasukkan ke jendela benchmark. Jadi, jika menghitung seluruh Prisma model query pada `perbaruiBiaya()`, totalnya adalah **17 sebelum dan 8 sesudah** (di luar query internal autentikasi serta statement kontrol `BEGIN`/`COMMIT`).

Untuk `calculateAllHpp()` dengan 10 produk, pola lama memerlukan 51 query aplikasi (1 daftar ID + 5 query per produk). Pola baru konstan 5 query aplikasi (produk, resep, bahan terkait, pengaturan, dan biaya operasional).

Catatan skenario mode `targetMargin`: setiap harga jual yang benar-benar berubah masih membutuhkan satu `Produk.update()`. Setelah perubahan ini, semua histori perubahan harga hanya menambah satu bulk INSERT dan satu notifikasi ringkasan. Jumlah query karena update nilai berbeda tersebut memang tetap linear dan bukan pembacaan N+1 yang dapat dipindahkan ke luar loop dengan API Prisma standar.

## Tugas 2 — kelayakan `after()`

### Target dan dukungan runtime

Target akhir dikonfirmasi berupa **VPS yang menjalankan hasil build dengan `next start`**. Selama development aplikasi tetap memakai **`next dev`**. Detail process manager, container, reverse proxy, dan shutdown VPS sengaja belum ditelusuri karena belum diperlukan pada tahap fitur.

Menurut dokumentasi Next.js 16.3.4 yang terpasang di proyek:

- `after()` stabil dan dapat dipakai dari Server Functions serta Route Handlers;
- Node.js server didukung;
- self-hosted `next start` mendukung `after()` secara penuh;
- ketika `next start` menerima `SIGINT` atau `SIGTERM` dan diberi waktu shutdown, server menunggu request yang sedang berjalan dan callback `after()` yang masih pending. Next.js menyarankan drain period 10–30 detik.

Implementasi runtime versi yang terpasang juga menyediakan internal `waitUntil` pada Node server. Jalur cleanup `next dev` maupun `next start` memanggil penutupan server yang menunggu promise tersebut. Dengan demikian, untuk pemakaian normal—request selesai dan proses tetap hidup—callback dimulai setelah response ditutup pada kedua mode.

### Perbedaan `next dev` dan `next start`

Tidak ada perbedaan API atau urutan dasar yang signifikan: keduanya menjadwalkan callback setelah response, dan error callback hanya dicatat di server setelah response sudah dikirim.

Perbedaan operasional yang perlu diperhatikan:

| Aspek | `next dev` lokal | Build + `next start` di VPS |
| --- | --- | --- |
| Tujuan runtime | Development, kompilasi on-demand dan hot reload | Runtime produksi yang stabil |
| Pengujian callback normal | Representatif untuk memastikan callback terpanggil | Representatif untuk perilaku produksi aktual |
| Pengukuran performa | Tidak representatif karena kompilasi/HMR | Harus menjadi acuan performa sebelum deployment |
| Shutdown normal | `Ctrl+C`/SIGINT menjalankan cleanup; callback pending ditunggu oleh runtime saat ini | SIGINT/SIGTERM ditunggu jika process manager memberi drain period yang cukup |
| Shutdown paksa | Callback dapat hilang | Callback dapat hilang |

Hot reload atau restart development membuat lifecycle `next dev` lebih aktif daripada produksi, sehingga mode ini cocok untuk uji fungsi tetapi bukan bukti reliabilitas background job. Di VPS, perilaku shutdown akhirnya bergantung pada process manager/container yang belum dipilih: apakah ia mengirim SIGTERM dan memberi waktu 10–30 detik sebelum kill paksa.

### Risiko konkret untuk aplikasi ini

1. `after()` bukan antrean durable. Pada crash, OOM, listrik mati, atau forced kill, callback dapat berhenti di kedua mode dan tidak otomatis dicoba ulang.
2. Mutasi biaya saat ini atomik bersama rekalkulasi. Memindahkannya ke `after()` berarti transaksi request selesai lebih dulu lalu callback membuka transaksi baru. Ada jendela ketika biaya sudah baru tetapi snapshot HPP, harga otomatis, histori, dan notifikasi masih lama.
3. Jika callback gagal, response sukses sudah telanjur diterima dan client tidak memperoleh error tersebut. Data turunan dapat tetap stale tanpa mekanisme status dan retry.
4. Next.js tetap menjalankan `after()` ketika response gagal atau terjadi error. Callback mutasi harus didaftarkan hanya setelah transaksi utama berhasil agar kegagalan request tidak memicu rekalkulasi yang tidak semestinya.
5. Beberapa edit cepat dapat menghasilkan callback bersamaan atau selesai tidak berurutan. Tanpa versioning, locking, atau coalescing, pemicu lama dapat menimpa hasil pemicu yang lebih baru.
6. Callback tetap dibatasi lifecycle proses dan durasi runtime. Dukungan `after()` pada `next start` tidak mengubahnya menjadi job queue.

### Status yang perlu ditampilkan bila kelak memakai background job

Implementasi yang aman memerlukan status rekalkulasi durable, bukan state browser saja:

- saat mutasi biaya disimpan, buat job/status `pending` dalam transaksi yang sama;
- worker/callback mengubah status menjadi `running`, lalu `completed` atau `failed`, beserta versi pemicu dan pesan kegagalan;
- dashboard, halaman produk, dan rincian HPP menampilkan badge **“Sedang menghitung ulang”**;
- selama pending/running, tandai angka HPP dan margin sebagai **belum final** serta tampilkan waktu data terakhir dihitung;
- client melakukan polling ringan atau refresh saat status selesai;
- kegagalan harus terlihat dan menyediakan retry; pemicu berurutan harus memakai aturan newest-wins atau digabungkan.

Model job/status tersebut kemungkinan memerlukan perubahan schema dan migrasi, sehingga sengaja tidak dibuat dalam pekerjaan ini.

### Rekomendasi

**TUNDA `after()` dan cukup andalkan perbaikan N+1 sekarang.** Secara API, implementasinya sederhana dan perilaku normalnya konsisten antara `next dev` dan `next start`. Namun risikonya berarti untuk kalkulasi bisnis: transaksi menjadi tidak atomik, kegagalan terjadi setelah response sukses, dan belum ada status/retry durable.

Revisit saat deployment VPS benar-benar direncanakan. Pada saat itu baru verifikasi process manager mengirim SIGTERM, menyediakan drain 10–30 detik, dan tidak melakukan forced kill lebih cepat. Jika latensi produksi tetap mengganggu, desain job/status/retry terlebih dahulu; `after()` boleh menjadi pemicu eksekusi, tetapi tidak boleh menjadi satu-satunya jaminan penyelesaian rekalkulasi.

## Tugas 3 — kelayakan optimistic UI

Sesudah optimasi, median jalur database sekitar 2,07 detik untuk perubahan yang menghitung ulang 10 produk. Delay masih terlihat sebagai state “Menyimpan…”, tetapi sudah masuk kategori wajar untuk mutasi atomik yang memperbarui data turunan dan tidak lagi terasa seperti UI macet 6–7 detik.

Halaman bahan baku, biaya operasional, dan produk saat ini memakai `useTransition`, menonaktifkan aksi selama request, menampilkan status pending, lalu `router.refresh()` setelah server mengonfirmasi. Perilaku ini menjaga daftar dan angka turunan tetap sesuai kondisi database.

**Rekomendasi: jangan tambahkan optimistic UI sekarang.** Manfaat persepsi waktunya tidak sebanding dengan kebutuhan rollback, rekonsiliasi Server Component, penanganan validasi server, penyegaran notifikasi, dan risiko menampilkan HPP/margin yang belum final.

Jika pengukuran pada deployment nyata kelak kembali melewati batas yang mengganggu, urutan halaman yang paling diuntungkan adalah:

1. **Bahan baku**, khususnya edit harga, karena satu perubahan dapat memicu banyak produk terkait.
2. **Biaya operasional**, karena semua produk terdampak; optimistik hanya boleh diterapkan pada baris biaya, sedangkan HPP/margin harus tetap diberi status belum final.
3. **Produk**, prioritas terakhir karena validasi resep dan mode target margin membuat rollback serta rekonsiliasi lebih rumit, sementara mutasinya umumnya hanya menyentuh satu produk.

Sebelum sampai ke optimistic UI penuh, peningkatan yang lebih aman adalah status pending yang lebih spesifik seperti “Menyimpan dan menghitung 10 produk…”, tanpa mengaku bahwa data baru sudah final.

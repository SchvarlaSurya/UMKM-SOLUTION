# ruangmargin — Tentang Proyek Ini

Dokumen ini menjelaskan aplikasi apa yang sedang dibangun, masalah apa yang diselesaikannya, dan fitur apa saja yang sudah ada. Ditujukan untuk siapa pun yang baru bergabung atau perlu menjelaskan proyek ini ke orang lain.

---

## 1. Sekilas

**ruangmargin** adalah aplikasi web penghitung HPP (Harga Pokok Produksi) dan pemantau margin untuk UMKM kuliner — warung makan, katering, kedai minuman, toko kue, penjual camilan.

Pemilik usaha mencatat bahan bakunya, biaya operasionalnya, dan resep tiap produknya. Dari situ aplikasi menghitung berapa modal sebenarnya per porsi dan berapa margin yang tersisa dari harga jual. Setiap kali harga bahan diperbarui, seluruh HPP yang terkait ikut dihitung ulang.

Satu akun mewakili satu usaha. Semua data terikat ke akun pemiliknya dan tidak terlihat oleh akun lain.

**Status per 25 September 2026:** aplikasi baru dijalankan di localhost laptop pengembang. Belum ada deployment ke VPS atau server mana pun. Hal-hal yang wajib dikerjakan sebelum deploy dicatat di [checklist-deploy.md](checklist-deploy.md).

---

## 2. Masalah yang diselesaikan

### 2.1 Margin tergerus tanpa disadari

Ini masalah intinya. Pemilik UMKM menetapkan harga jual sekali, lalu harga bahan naik pelan-pelan selama berbulan-bulan. Karena tidak ada yang menghitung ulang, margin menipis tanpa pernah terlihat — dan baru ketahuan saat akhir bulan uangnya tidak sesuai harapan.

**Jawaban aplikasi:** HPP dihitung ulang otomatis setiap kali harga bahan berubah. Dashboard menampilkan margin tiap produk beserta statusnya, dan memberi peringatan begitu ada produk yang jatuh di bawah batas aman.

### 2.2 HPP dihitung setengah-setengah

Banyak pemilik usaha hanya menghitung biaya bahan, lalu lupa bahwa gas, listrik, sewa, dan komisi aplikasi pesan-antar juga memakan untung setiap porsi. Angka HPP yang keluar jadi terlalu optimistis.

**Jawaban aplikasi:** biaya operasional ikut masuk ke dalam rumus. Biaya tetap bulanan dibagi rata ke perkiraan jumlah porsi per bulan, dan biaya persentase dipotong langsung dari harga jual.

### 2.3 Tidak tahu harga mana yang sudah kedaluwarsa

Perhitungan hanya seakurat angka terakhir yang dimasukkan. Kalau harga cabai di aplikasi masih angka dua bulan lalu, dashboard tetap menampilkan margin dengan penuh percaya diri padahal sudah tidak benar.

**Jawaban aplikasi:** bahan yang harganya belum diperbarui 30 hari atau lebih ditandai. Dashboard memberi peringatan ringkas, halaman Bahan baku memberi lencana per bahan beserta tombol saring untuk menelusurinya.

Batasnya: aplikasi **tidak tahu** harga pasar, hanya tahu kapan pemiliknya terakhir memeriksa. Karena itu kalimatnya selalu "belum diperbarui", bukan "sudah tidak akurat".

### 2.4 Tidak tahu bahan mana yang paling berbahaya

Kalau harga naik, mana yang paling memukul? Tanpa hitungan, jawabannya cuma tebakan.

**Jawaban aplikasi:** halaman Tren harga bahan menunjukkan riwayat perubahan tiap bahan dan menandai bahan yang tiga perubahan terakhirnya naik berturut-turut. Ada juga simulasi kenaikan harga untuk melihat dampaknya sebelum benar-benar terjadi.

### 2.5 Menentukan harga jual masih menebak

Pertanyaan "berapa harusnya saya jual ini?" biasanya dijawab dengan meniru harga tetangga.

**Jawaban aplikasi:** produk bisa diberi target margin, lalu harga jualnya dihitung mundur dari target itu — bukan diketik manual.

---

## 3. Konsep inti: rumus HPP dan margin

Seluruh aplikasi berputar di sekitar dua rumus ini. Keduanya ada di `lib/hpp.ts` sebagai fungsi murni tanpa sentuhan database, dan itu satu-satunya tempat rumusnya ditulis.

### HPP per porsi

```
HPP = biaya bahan per porsi + alokasi biaya tetap per porsi
```

- **Biaya bahan per porsi** — jumlah dari `takaran × harga per satuan` untuk setiap bahan di resep.
- **Alokasi biaya tetap per porsi** — total biaya operasional berjenis "tetap" per bulan, dibagi perkiraan jumlah porsi per bulan.

### Margin

```
Margin % = (harga jual − HPP − potongan persentase) ÷ harga jual × 100
```

- **Potongan persentase** — `harga jual × (total biaya persentase ÷ 100)`. Ini untuk komisi aplikasi pesan-antar dan sejenisnya, yang besarnya ikut harga jual, bukan tetap.
- Sebuah produk berstatus **aman** kalau marginnya sama dengan atau di atas batas margin aman yang diatur pemiliknya.

### Dua jenis biaya operasional

| Jenis | Cara masuk hitungan | Contoh |
|---|---|---|
| Tetap | dibagi rata ke tiap porsi | sewa, listrik, gas, gaji |
| Persentase | dipotong dari harga jual | komisi GoFood/GrabFood |

### Angka yang bisa diatur pemilik

| Pengaturan | Bawaan | Pengaruhnya |
|---|---|---|
| Estimasi porsi per bulan | 1.200 | pembagi alokasi biaya tetap |
| Batas margin aman | 10% | ambang status "Aman" vs "Margin rendah" |

---

## 4. Fitur per halaman

### Landing page (`/`)

Halaman pertama untuk pengunjung yang belum masuk. Pengunjung yang masih punya sesi langsung dialihkan ke `/dashboard` oleh `proxy.ts`, jadi halaman ini tetap statis.

- **Hero dan penjelasan masalah** — contoh satu menu (nasi ayam) yang marginnya turun dari 40% ke 32,5% karena harga ayam naik, beserta rincian HPP-nya.
- **Simulasi margin interaktif** — pengunjung bisa mengubah harga ayam, harga jual, dan target margin, lalu melihat HPP, margin, harga jual yang memenuhi target (dibulatkan ke kelipatan Rp500), dan titik impas. Semuanya dihitung di browser dan tidak disimpan. Rumusnya ada di `lib/simulasiLanding.ts` dan punya pengujian sendiri. Hasil dari ketikan dihitung ulang setelah jeda 150 ms, dan kolom yang tidak sah ditandai.
- **Pratinjau dashboard** — tiruan layar dashboard dengan data demo, dirakit dari komponen dashboard yang asli, sehingga rupanya ikut berubah kalau dashboard berubah.
- **Contoh hitungan 100 porsi**, **tiga langkah mulai**, dan ajakan untuk daftar atau masuk.
- Header menempel di atas. Di layar kecil, tautan antarbagian pindah ke menu lipat. Judul dan kartu tiap bagian muncul saat masuk layar, dan semua animasi menghormati `prefers-reduced-motion`.

### Dashboard (`/dashboard`)

Ringkasan kesehatan usaha dalam satu layar.

- **Kartu ringkasan** — total produk, rata-rata margin, jumlah produk yang perlu perhatian, dan batas margin aman yang sedang berlaku. Angkanya dianimasikan saat berubah, jadi perubahan sejak kunjungan terakhir terlihat, bukan cuma tergambar.
- **Peringatan margin bocor** — muncul kalau ada produk di bawah batas aman, menyebut nama produknya.
- **Peringatan harga basi** — muncul kalau ada bahan yang belum diperbarui sebulan lebih, menyebut yang paling lama beserta jumlah produk yang HPP-nya bergantung padanya.
- **Tabel margin produk** — HPP per porsi, harga jual, margin, dan status tiap produk. Bisa disaring per status dan dicari per nama. Tiap baris punya jalan masuk ke rincian HPP.
- **Rincian HPP** — uraian pembentuk HPP satu produk: tiap bahan beserta takaran dan biayanya, alokasi biaya tetap, potongan biaya persentase, lalu sisa per porsi.
- **Grafik pergerakan harga bahan** — riwayat harga satu bahan pilihan.
- **Panel catatan margin** — pengingat bahwa biaya kecil ikut memotong tiap porsi, beserta angka biaya tetap per porsi yang sedang berlaku.

Akun yang belum punya data apa pun melihat urutan langkah pertama, bukan tabel dan grafik kosong.

### Bahan baku (`/bahan-baku`)

Daftar bahan beserta harga per satuannya.

- Tambah, ubah, dan hapus bahan. Nama bahan unik per akun.
- Tiap baris menampilkan kapan terakhir diperbarui dan dipakai di berapa produk.
- Bahan yang belum dicek 30 hari atau lebih diberi lencana `Belum dicek N hari`, dengan tombol saring `N perlu dicek` untuk menampilkan hanya yang itu.
- Setiap perubahan harga tercatat di riwayat dan langsung menghitung ulang HPP semua produk yang memakai bahan tersebut.
- Satuan terkunci saat mengubah bahan, karena takaran resep yang sudah tersimpan tidak ikut dikonversi.
- Bahan yang masih dipakai resep tidak bisa dihapus sebelum dilepas dari resepnya.

### Produk & resep (`/produk`)

Daftar produk beserta resep dan marginnya.

- Kartu per produk: HPP per porsi, harga jual, margin, status, dan jalan masuk ke riwayat harga jual.
- Bisa disaring per status dan dicari per nama maupun kategori.
- **Penyusun resep** — memilih bahan lewat kotak yang bisa diketik untuk menyaring, sehingga tetap terpakai saat bahannya sudah puluhan. Bahan yang sudah dipakai baris lain otomatis hilang dari pilihan berikutnya.
- **Dua cara memasukkan takaran:**
  - *Takaran per porsi* — langsung mengisi berapa banyak bahan untuk satu porsi.
  - *Sekali produksi* — mengisi takaran untuk satu kali masak beserta jumlah porsi yang dihasilkan; aplikasi yang membaginya. Resepnya tetap disimpan per porsi, mode ini hanya soal cara mengetiknya.
- **Konversi satuan** — takaran boleh diisi dalam satuan lain yang segolongan: kg ↔ gram, liter ↔ ml. Satuan hitung seperti butir atau pack tidak punya konversi.
- **Dua cara menentukan harga jual:**
  - *Manual* — harga diketik sendiri.
  - *Target margin* — harga dihitung mundur dari margin yang diinginkan (0–80%).

### Biaya operasional (`/biaya-operasional`)

Daftar biaya di luar bahan baku, beserta pengaturan yang memengaruhi seluruh perhitungan.

- Tambah, ubah, hapus biaya, masing-masing berjenis tetap atau persentase.
- Mengatur estimasi porsi per bulan dan batas margin aman.
- Perubahan di halaman ini menggeser HPP **seluruh** produk sekaligus, karena biaya operasional dibagi rata.

### Tren harga bahan (`/tren-harga`)

Riwayat perubahan harga per bahan.

- Grafik pergerakan harga, dengan titik pertama adalah harga sebelum perubahan pertama supaya satu perubahan tetap tergambar sebagai garis naik atau turun.
- Ringkasan harga terkini, perubahan sejak awal riwayat, dan jumlah produk terkait.
- **Penanda tren naik** — bahan yang **tiga perubahan terakhirnya naik berturut-turut** ditandai. Kurang dari tiga catatan dianggap datanya belum cukup, dan harga yang sama dihitung sebagai bukan kenaikan.
- Tabel seluruh catatan perubahan beserta tanggal dan selisihnya.

### Profil usaha (`/profil-usaha`)

Mengubah nama dan jenis usaha. Nama ini yang tampil di sidebar dan menandai seluruh data usaha.

### Masuk dan daftar (`/login`, `/register`)

Autentikasi email dan kata sandi. Kata sandi disimpan ter-hash. Pendaftaran membuat akun dan profil usaha sekaligus dalam satu transaksi — kalau salah satunya gagal, tidak ada yang tersimpan. Baris pengaturannya sendiri dibuat belakangan dengan nilai bawaan, saat pertama kali dibutuhkan.

Email tidak peka huruf besar-kecil: `Budi@Mail.com` dan `budi@mail.com` adalah akun yang sama, baik saat daftar maupun masuk. Percobaan masuk dan daftar dibatasi. Rinciannya ada di bagian 6.

---

## 5. Fitur lintas halaman

### Perhitungan ulang otomatis

Mengubah harga bahan, biaya operasional, atau pengaturan tidak hanya menyimpan angka — seluruh HPP dan margin yang terpengaruh ikut dihitung ulang. Produk yang memakai mode target margin juga ikut menyesuaikan harga jualnya, dan perubahan itu tercatat di riwayat harga jual beserta alasannya.

### Notifikasi

Saat harga jual sebuah produk berubah otomatis akibat perhitungan ulang, pemiliknya diberi tahu lewat pusat notifikasi di topbar. Notifikasi yang belum dibaca disegarkan berkala dan bisa ditandai terbaca.

Notifikasi yang sudah dibaca bisa dihapus sekaligus. Notifikasi terbaca yang berumur lebih dari 30 hari juga dipangkas otomatis, setiap kali ada notifikasi baru untuk pemilik yang sama (`lib/notifikasi.ts`). Yang belum dibaca tidak pernah ikut terhapus. Jejak perubahan sebenarnya tetap tersimpan di riwayat harga.

### Riwayat yang tersimpan

- **Riwayat harga bahan** (`HistoriHarga`) — tiap perubahan harga bahan.
- **Riwayat harga jual** (`HistoriHargaJual`) — tiap perubahan harga jual produk, beserta alasannya.
- **Snapshot HPP** (`HppSnapshot`) — hasil perhitungan massal, untuk jejak audit.

### Antarmuka

- **Responsif** — tabel di layar besar berganti jadi daftar kartu di layar kecil; modal berubah jadi lembar yang muncul dari bawah layar dengan tombol aksi yang menempel.
- **Gerak yang menjelaskan** — animasi dipakai untuk menerangkan perubahan yang baru terjadi: laci menu, penanda halaman aktif, angka ringkasan yang bergerak ke nilai barunya, daftar yang berganti isi saat filter diubah, dan lapisan melayang yang muncul dari tepi pemicunya. Semuanya menghormati `prefers-reduced-motion` lewat satu pintu di `lib/gerak.ts`.
- **Satu bentuk dropdown** — seluruh pemilih di aplikasi memakai daftar turun buatan sendiri dengan rupa yang sama, bukan `<select>` bawaan yang panel opsinya digambar sistem operasi.
- **Umpan balik** — pesan berhasil dan gagal muncul sebagai toast melayang yang tidak menggeser tata letak form.

---

## 6. Keamanan autentikasi

### Pemeriksaan sesi

`proxy.ts` hanya melakukan pemeriksaan awal: pengunjung tanpa token sesi dialihkan dari halaman aplikasi ke `/login`, dan pengunjung yang punya sesi dialihkan dari `/`, `/login`, dan `/register` ke `/dashboard`. Otorisasi yang sebenarnya dilakukan setiap route handler di `app/api/` lewat `requireAuth()` (`lib/auth.ts`), dan setiap query difilter per `userId`. Satu-satunya pengecualian adalah pendaftaran dan route NextAuth itu sendiri.

### Email tidak peka huruf, tanpa wildcard

Email dinormalisasi (`trim` lalu huruf kecil) oleh satu fungsi yang sama untuk daftar dan masuk: `normalisasiEmail()` di `lib/email.ts`. Pencarian akun memakai satu query SQL dengan parameter:

```sql
WHERE lower(email) = $1  -- perbandingan persis, bukan pola
```

Sengaja **bukan** `{ equals, mode: 'insensitive' }` milik Prisma. Prisma menerjemahkan bentuk itu ke `ILIKE`, sehingga `%` dan `_` di email menjadi wildcard, dan email `%` cocok dengan akun mana pun. Versi awal perbaikan huruf besar (PR #97) sempat memakainya, lalu diperbaiki di PR #100.

`lower(email)` tetap menjangkau akun lama yang mendaftar sebelum email dinormalisasi (sebelum 10 September 2026) dan mungkin tersimpan dengan huruf besar. Kolom ini belum punya index; untuk jumlah akun sekarang tidak jadi masalah.

### Waktu respons login yang seragam

Login selalu menjalankan tepat satu query dan satu `bcrypt.compare`, ada atau tidak akunnya. Kalau email tidak terdaftar, kata sandi dibandingkan dengan hash dummy ber-cost 10 (sama dengan pendaftaran). Tanpa ini, email yang tidak terdaftar dijawab puluhan milidetik lebih cepat, dan selisih waktu itu bisa dipakai untuk menebak email mana yang terdaftar. Logikanya ada di `lib/verifikasiLogin.ts`.

Pesan galatnya juga seragam ("Email atau kata sandi salah."), tidak menyebut mana yang salah.

Satu kebocoran disengaja tetap ada: form daftar menjawab "Email sudah terdaftar". Rate limiting di bawah hanya memperlambat penebakan lewat jalur itu.

### Rate limiting login dan daftar

| | Login | Daftar |
|---|---|---|
| Batas | 5 kali **gagal** per 15 menit | 5 **percobaan** per 15 menit, berhasil atau gagal |
| Kunci | IP + email (email dinormalisasi) | IP + email |
| Saat dibatasi | "Terlalu banyak percobaan masuk. Coba lagi dalam N menit." | HTTP 429 dengan `Retry-After` |
| Reset | login berhasil, atau jendela 15 menit habis | jendela 15 menit habis |

Selama dibatasi, database dan bcrypt tidak disentuh sama sekali.

**Disimpan di memori proses Node, bukan di database** (`lib/batasPercobaan.ts`). Alasannya, target deployment yang direncanakan adalah satu VPS dengan satu proses Node, sama dengan asumsi pool koneksi di `lib/prisma.ts`. Dengan begitu tidak perlu migrasi, dan tidak ada query tambahan di setiap percobaan login.

Konsekuensinya:

- Hitungan hilang setiap kali server dimulai ulang.
- **Harus diganti ke Redis atau tabel Postgres kalau nanti pindah ke banyak instance, PM2 cluster, atau serverless.** Kalau tidak diganti, setiap proses punya jatah sendiri dan batasnya ikut berlipat.
- IP dibaca dari `X-Real-IP`, dengan cadangan entri terakhir `X-Forwarded-For`. Itu hanya bisa dipercaya di belakang reverse proxy yang menimpa header tersebut. Tanpa proxy, pembatas bisa dilewati dengan memalsukan header. Lihat [checklist-deploy.md](checklist-deploy.md).
- Kunci IP+email tidak membatasi satu email yang diserang dari banyak IP, atau banyak email berbeda yang dicoba dari satu IP.

---

## 7. Model data

| Model | Isi |
|---|---|
| `User` | akun pemilik |
| `Usaha` | nama dan jenis usaha, satu per akun |
| `Pengaturan` | estimasi porsi per bulan, batas margin aman |
| `BahanBaku` | nama, satuan, harga per satuan, waktu terakhir diperbarui |
| `HistoriHarga` | catatan perubahan harga bahan |
| `BiayaOperasional` | nama, jenis (tetap/persentase), nilai |
| `Produk` | nama, kategori, harga jual, mode penentuan harga, mode takaran |
| `Resep` | penghubung produk dan bahan beserta takaran per porsi |
| `HppSnapshot` | hasil perhitungan HPP massal |
| `HistoriHargaJual` | catatan perubahan harga jual beserta alasannya |
| `Notifikasi` | pemberitahuan untuk pemilik |

Basis datanya PostgreSQL, diakses lewat Prisma.

---

## 8. Teknologi

| Bagian | Pilihan |
|---|---|
| Kerangka | Next.js 16 (App Router) |
| Antarmuka | React 19, TypeScript ketat, Tailwind CSS v4 |
| Basis data | PostgreSQL + Prisma 7 |
| Autentikasi | NextAuth, kata sandi di-hash dengan bcrypt |
| Grafik | Recharts |
| Animasi | anime.js v4 |
| Pengujian | test runner bawaan Node (`node:test`) lewat `tsx` |
| CI | GitHub Actions: lint, typecheck, test, dan build di setiap PR dan push ke `main` |

Struktur berkas:

- `app/` — halaman App Router. `app/(app)/` untuk layar yang butuh login, `app/api/` untuk endpoint.
- `components/` — komponen dikelompokkan per fitur; primitif bersama di `components/ui/`.
- `lib/` — autentikasi, rate limiting, akses data, rumus HPP, analisis tren, konversi satuan, tipe bersama.
- `prisma/` — skema dan migrasi.
- `tests/` — pengujian unit.
- `.github/workflows/ci.yml` — CI.

---

## 9. Batas yang disengaja

Hal-hal berikut **bukan** kekurangan yang belum sempat dikerjakan, melainkan keputusan:

- **Tidak ada prediksi harga.** Aplikasi tidak menebak harga bahan di masa depan dan tidak terhubung ke data pasar mana pun. Ia hanya tahu apa yang dicatat pemiliknya.
- **Tidak ada manajemen stok.** Yang dicatat adalah harga per satuan, bukan berapa banyak yang tersisa di gudang.
- **Tidak ada pencatatan penjualan.** Jumlah porsi per bulan adalah perkiraan yang diisi pemiliknya, bukan hasil hitungan transaksi.
- **Satu akun satu usaha.** Tidak ada banyak cabang atau banyak pengguna dalam satu usaha.

---

## 10. Menjalankan proyek

Langkah lengkapnya, termasuk isi `.env`, ada di [README](../README.md#menjalankan-secara-lokal). Ringkasnya:

```bash
npm ci                                 # pasang dependensi
npx prisma generate                    # buat klien Prisma (app/generated/prisma diabaikan Git)
npx prisma migrate deploy              # terapkan migrasi
npm run dev                            # jalankan di http://localhost:3000
npm run build                          # build produksi
npm start                              # jalankan hasil build
npm run lint                           # ESLint
npx next typegen && npx tsc --noEmit   # cek tipe
npm test                               # pengujian unit
npm run seed                           # isi basis data dengan data contoh
```

Butuh `DATABASE_URL`, `NEXTAUTH_SECRET`, dan `NEXTAUTH_URL` di berkas `.env` yang tidak ikut Git.

---

## 11. Status pengujian

Per 25 September 2026 (commit `27ffa17`), `npm test` menjalankan **85 test dalam 20 suite di 8 berkas**, semuanya lulus. Test runner-nya bawaan Node (`node:test`) lewat `tsx`, dan pengujiannya tidak menyentuh database.

| Berkas | Yang diuji |
|---|---|
| `hpp.test.ts`, `pembulatan-harga.test.ts` | rumus HPP, margin, harga dari target margin, pembulatan harga jual |
| `harga-jual.test.ts` | simulasi kenaikan harga bahan |
| `histori.test.ts` | pencatatan riwayat harga dan analisis tren |
| `takaran.test.ts` | konversi satuan dan takaran resep |
| `simulasi-landing.test.ts` | rumus simulasi di landing page |
| `email.test.ts` | normalisasi email dan pencarian akun tanpa wildcard |
| `batas-percobaan.test.ts` | rate limiting, pembacaan IP, verifikasi login, dan pesan galat login |

Belum punya pengujian otomatis: penentuan harga basi (`lib/hargaBasi.ts`), route handler API secara utuh (integrasi dengan database), dan tampilan. Bagian-bagian itu masih diperiksa manual: lint dan build, lalu memeriksa layar yang terpengaruh beserta hasil perhitungannya.

Setiap pull request dan push ke `main` menjalankan lint, typecheck, test, dan build di GitHub Actions (`.github/workflows/ci.yml`).

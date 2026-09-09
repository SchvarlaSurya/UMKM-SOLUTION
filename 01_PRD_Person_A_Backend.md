# PRD — Person A: Backend, Database & Kalkulasi HPP

**Wajib baca dulu:** `00_KONTRAK_BERSAMA.md` — kamu adalah pemilik skema database dan logic HPP di sana. Perubahan yang kamu buat di file itu berdampak ke Person B dan C.

## Peranmu dalam Tim
Kamu adalah fondasi. Person B dan C tidak bisa mulai kerja penuh sampai schema dan fungsi dasar kamu siap. Prioritaskan kecepatan di hari 1-2 tanpa mengorbankan kebenaran logic — kalau rumus HPP kamu salah, seluruh dashboard yang dibangun Person B akan menampilkan angka salah, dan itu baru ketahuan pas demo.

## Tanggung Jawab

### 1. Setup Project & Database
- Inisialisasi Next.js + TypeScript + Prisma
- Buat `prisma/schema.prisma` sesuai kontrak bersama, migrate ke MySQL
- Setup NextAuth untuk login/register (single role, owner)

### 2. API Routes / Server Actions — CRUD Dasar
- `app/api/bahan-baku/*` — create, update, delete bahan baku. Setiap update harga WAJIB menulis baris baru ke `HistoriHarga` sebelum update nilai `hargaPerSatuan`
- `app/api/biaya-operasional/*` — CRUD biaya operasional
- `app/api/produk/*` — CRUD produk + resep (relasi many-to-many ke bahan baku)

### 3. Logic Kalkulasi HPP (bagian paling kritis)
Implementasikan di `lib/hppCalculator.ts`:
- `calculateHpp(produkId)`:
  1. Jumlahkan `jumlahDipakai × hargaPerSatuan` untuk semua bahan di resep produk itu
  2. Tambahkan alokasi biaya operasional tipe `tetap` (dibagi rata sesuai estimasi unit terjual)
  3. Hitung margin: `(hargaJual - hppTerhitung - (hargaJual × totalPersenKomisi)) / hargaJual × 100`
  4. Simpan hasil ke `HppSnapshot`
  5. Return `HppResult` sesuai tipe di kontrak bersama
- `recalculateAllAffectedByBahan(bahanBakuId)`: dipanggil setiap kali harga bahan baku diupdate — cari semua produk yang pakai bahan itu via tabel `resep`, panggil `calculateHpp` untuk masing-masing

**Uji logic ini dengan minimal 3 skenario manual sebelum kasih tahu Person B kalau ini "siap dipakai":**
- Produk dengan 1 bahan, tanpa biaya operasional
- Produk dengan banyak bahan + biaya tetap
- Produk dengan komisi ojol (pastikan dihitung dari harga jual, bukan HPP)

## Yang BUKAN Tanggung Jawabmu
- Tampilan/UI apapun (itu Person B)
- Grafik tren harga (itu Person C, tapi kamu sediakan datanya lewat query yang mereka minta)

## Definisi "Selesai" untuk Serah Terima ke Person B & C
- Schema sudah di-push ke branch utama
- `calculateHpp()` dan `recalculateAllAffectedByBahan()` sudah bisa dipanggil dan hasilnya benar untuk 3 skenario di atas
- Kabari tim begitu ini siap — jangan tunggu "sempurna", cukup benar dan bisa dipakai

## Timeline
Hari 1-2: schema + auth + CRUD dasar siap dipakai tim lain
Hari 2-3: logic HPP lengkap + teruji
Hari 3-6: bantu integrasi, perbaiki bug logic yang ditemukan Person B/C saat testing

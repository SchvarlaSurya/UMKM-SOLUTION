# Audit revalidasi setelah mutasi

Tanggal pengukuran: 12 September 2026. Pengukuran dilakukan di `next dev`
dengan akun benchmark yang mula-mula memiliki 10 produk. Angka adalah waktu
dari tombol simpan ditekan sampai data baru terlihat di halaman. Tiap angka
median dari tiga submit pada rute yang sudah dikompilasi (warm).

## Temuan utama

`revalidatePath()` pada Server Function Next.js 16 bersifat sinkron. Karena itu,
beberapa pemanggilan tidak dapat dan tidak perlu dibungkus `Promise.all()`.
Hanya halaman yang sedang dilihat yang dirender ulang segera; halaman lain
ditandai invalid untuk kunjungan berikutnya.

Duplikasi yang nyata ada di client: setelah Server Action sudah menjalankan
`revalidatePath()` dan mengirim hasil render baru, client masih memanggil
`router.refresh()`. Ini memicu GET/render kedua. Refresh client tersebut dihapus
dari alur Server Action bahan baku, biaya operasional, tambah produk dari
Dashboard, dan hapus produk. `router.refresh()` pada tambah/edit produk di
halaman Produk & Resep dipertahankan karena alur itu memakai Route Handler
`fetch`, bukan Server Action; tanpa refresh tersebut data baru tidak akan
masuk ke Server Component.

## Target invalidasi setelah audit

| Mutasi | Halaman yang diinvalidasi | Alasan |
| --- | --- | --- |
| Tambah bahan baku | Bahan Baku, Dashboard, Produk & Resep | Daftar/pilihan bahan berubah; bahan baru belum punya histori tren. |
| Edit harga bahan | Bahan Baku, Dashboard, Produk & Resep, Tren Harga | Harga, HPP, margin, dan histori berubah. |
| Hapus bahan tanpa histori | Bahan Baku, Dashboard, Produk & Resep | Daftar/pilihan bahan berubah, tetapi tren tidak. |
| Hapus bahan dengan histori | Bahan Baku, Dashboard, Produk & Resep, Tren Harga | Data histori ikut terhapus. |
| Tambah/hapus biaya | Biaya Operasional, Dashboard, Produk & Resep | HPP atau margin semua produk dapat berubah. |
| Edit jenis/nilai biaya | Biaya Operasional, Dashboard, Produk & Resep | HPP atau margin dapat berubah. |
| Edit nama biaya saja | Biaya Operasional | Nama biaya tidak dipakai dalam HPP/margin. Rekalkulasi yang sudah ada tetap dipertahankan agar perubahan ini hanya menyentuh invalidasi. |
| Tambah/hapus produk | Produk & Resep, Dashboard, Bahan Baku | Daftar produk dan jumlah pemakai bahan berubah. |
| Edit produk, bahan resep berubah | Produk & Resep, Dashboard, Bahan Baku | Relasi pemakaian bahan berubah. |
| Edit produk, bahan resep tetap | Produk & Resep, Dashboard | Nama, kategori, harga, atau takaran tidak mengubah jumlah produk pemakai bahan. |

## Hasil pengukuran

| Skenario submit | Sebelum | Sesudah | Perubahan |
| --- | ---: | ---: | ---: |
| Dashboard — tambah produk | 6,38 dtk | 5,09 dtk | sekitar 20% lebih cepat |
| Biaya Operasional — edit nama saja | 6,55 dtk | 6,07 dtk | sekitar 7% lebih cepat |
| Produk & Resep — edit nama produk | 6,69 dtk | 6,28 dtk | sekitar 6%; dalam variasi normal |

Rentang sampel sesudah perubahan adalah 5,05–5,67 detik (Dashboard),
5,83–6,10 detik (Biaya Operasional), dan 6,14–8,11 detik (Produk & Resep).
Log server memastikan GET kedua hilang dari alur Server Action Dashboard dan
Biaya Operasional. Jalur Produk & Resep tetap berupa satu PUT lalu satu GET
yang diperlukan, sehingga perubahannya tidak signifikan.

Kesimpulannya, invalidasi yang terlalu luas dan refresh ganda memang ada dan
sudah dirapikan, tetapi bukan penyebab tunggal delay 3–4 detik. Pada lingkungan
benchmark ini, waktu yang tersisa terutama berada di akses database/rekalkulasi
dan render Server Component. Optimasi lanjutan untuk jalur Produk & Resep harus
mengaudit Route Handler serta loader halaman secara terpisah, bukan menambah
atau menghapus `revalidatePath()`.

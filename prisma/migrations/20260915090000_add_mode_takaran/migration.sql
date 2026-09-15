-- Resep tetap disimpan dalam takaran per porsi. Dua kolom ini merekam cara
-- pemiliknya memasukkan angka, supaya form edit bisa dibuka kembali dengan
-- angka yang sama persis seperti yang diketik.
ALTER TABLE "Produk" ADD COLUMN "modeTakaran" TEXT NOT NULL DEFAULT 'per-porsi';
ALTER TABLE "Produk" ADD COLUMN "jumlahPorsiProduksi" DOUBLE PRECISION;

-- Postgres tidak membuat index untuk kolom foreign key. Ketiga kolom ini
-- dipakai menyaring di jalur yang sering dilewati: grafik tren harga bahan,
-- rekalkulasi produk setelah harga bahan berubah, dan hapus produk.

-- CreateIndex
CREATE INDEX "HistoriHarga_bahanBakuId_tanggal_idx" ON "HistoriHarga"("bahanBakuId", "tanggal");

-- CreateIndex
CREATE INDEX "Resep_bahanBakuId_idx" ON "Resep"("bahanBakuId");

-- CreateIndex
CREATE INDEX "HppSnapshot_produkId_idx" ON "HppSnapshot"("produkId");

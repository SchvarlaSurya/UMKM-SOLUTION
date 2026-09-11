-- Tabel data usaha dikosongkan sebelum migrasi ini dijalankan, sehingga kolom
-- kepemilikan dapat langsung ditambahkan sebagai wajib tanpa backfill data lama.
ALTER TABLE "BahanBaku" ADD COLUMN "userId" INTEGER NOT NULL;
ALTER TABLE "BiayaOperasional" ADD COLUMN "userId" INTEGER NOT NULL;
ALTER TABLE "Pengaturan" ADD COLUMN "userId" INTEGER NOT NULL;
ALTER TABLE "Produk" ADD COLUMN "userId" INTEGER NOT NULL;

CREATE UNIQUE INDEX "BahanBaku_userId_nama_key" ON "BahanBaku"("userId", "nama");
CREATE INDEX "BiayaOperasional_userId_idx" ON "BiayaOperasional"("userId");
CREATE UNIQUE INDEX "Pengaturan_userId_key" ON "Pengaturan"("userId");
CREATE INDEX "Produk_userId_idx" ON "Produk"("userId");

ALTER TABLE "BahanBaku" ADD CONSTRAINT "BahanBaku_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BiayaOperasional" ADD CONSTRAINT "BiayaOperasional_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Pengaturan" ADD CONSTRAINT "Pengaturan_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Produk" ADD CONSTRAINT "Produk_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Tambahkan kolom sebagai nullable terlebih dahulu agar data lama bisa di-backfill.
ALTER TABLE "BahanBaku" ADD COLUMN "userId" INTEGER;
ALTER TABLE "BiayaOperasional" ADD COLUMN "userId" INTEGER;
ALTER TABLE "Pengaturan" ADD COLUMN "userId" INTEGER;
ALTER TABLE "Produk" ADD COLUMN "userId" INTEGER;

-- Data sebelum fitur multi-akun adalah satu data usaha bersama. Kaitkan data
-- tersebut ke akun paling awal; akun lain mulai dengan ruang data yang kosong.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "User") AND (
        EXISTS (SELECT 1 FROM "BahanBaku") OR
        EXISTS (SELECT 1 FROM "BiayaOperasional") OR
        EXISTS (SELECT 1 FROM "Pengaturan") OR
        EXISTS (SELECT 1 FROM "Produk")
    ) THEN
        RAISE EXCEPTION 'Tidak bisa memigrasikan data usaha lama karena belum ada User';
    END IF;
END $$;

UPDATE "BahanBaku"
SET "userId" = (SELECT "id" FROM "User" ORDER BY "id" ASC LIMIT 1)
WHERE "userId" IS NULL;

UPDATE "BiayaOperasional"
SET "userId" = (SELECT "id" FROM "User" ORDER BY "id" ASC LIMIT 1)
WHERE "userId" IS NULL;

UPDATE "Pengaturan"
SET "userId" = (SELECT "id" FROM "User" ORDER BY "id" ASC LIMIT 1)
WHERE "userId" IS NULL;

UPDATE "Produk"
SET "userId" = (SELECT "id" FROM "User" ORDER BY "id" ASC LIMIT 1)
WHERE "userId" IS NULL;

ALTER TABLE "BahanBaku" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "BiayaOperasional" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Pengaturan" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Produk" ALTER COLUMN "userId" SET NOT NULL;

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

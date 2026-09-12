-- Produk lama tetap memakai harga manual. Target margin hanya diisi ketika
-- mode penentuan harga diubah secara eksplisit oleh pemilik produk.
ALTER TABLE "Produk"
ADD COLUMN "modePenentuanHarga" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN "targetMarginPersen" DOUBLE PRECISION;

CREATE TABLE "HistoriHargaJual" (
    "id" SERIAL NOT NULL,
    "produkId" INTEGER NOT NULL,
    "hargaLama" DOUBLE PRECISION NOT NULL,
    "hargaBaru" DOUBLE PRECISION NOT NULL,
    "alasan" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoriHargaJual_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notifikasi" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "judul" TEXT NOT NULL,
    "pesan" TEXT NOT NULL,
    "sudahDibaca" BOOLEAN NOT NULL DEFAULT false,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notifikasi_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HistoriHargaJual_produkId_idx"
ON "HistoriHargaJual"("produkId");

CREATE INDEX "Notifikasi_userId_sudahDibaca_idx"
ON "Notifikasi"("userId", "sudahDibaca");

ALTER TABLE "HistoriHargaJual"
ADD CONSTRAINT "HistoriHargaJual_produkId_fkey"
FOREIGN KEY ("produkId") REFERENCES "Produk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Notifikasi"
ADD CONSTRAINT "Notifikasi_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

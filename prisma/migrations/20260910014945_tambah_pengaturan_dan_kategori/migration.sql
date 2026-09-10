-- AlterTable
ALTER TABLE "Produk" ADD COLUMN     "kategori" TEXT NOT NULL DEFAULT 'Umum';

-- CreateTable
CREATE TABLE "Pengaturan" (
    "id" SERIAL NOT NULL,
    "estimasiPorsiPerBulan" INTEGER NOT NULL DEFAULT 1200,
    "batasMarginAman" DOUBLE PRECISION NOT NULL DEFAULT 10,

    CONSTRAINT "Pengaturan_pkey" PRIMARY KEY ("id")
);

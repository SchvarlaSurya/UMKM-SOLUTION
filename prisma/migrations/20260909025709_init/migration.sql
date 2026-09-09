-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BahanBaku" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "satuan" TEXT NOT NULL,
    "hargaPerSatuan" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BahanBaku_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoriHarga" (
    "id" SERIAL NOT NULL,
    "bahanBakuId" INTEGER NOT NULL,
    "hargaLama" DOUBLE PRECISION NOT NULL,
    "hargaBaru" DOUBLE PRECISION NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoriHarga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiayaOperasional" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "jenis" TEXT NOT NULL,
    "nilai" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BiayaOperasional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produk" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "hargaJual" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Produk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resep" (
    "produkId" INTEGER NOT NULL,
    "bahanBakuId" INTEGER NOT NULL,
    "jumlahDipakai" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Resep_pkey" PRIMARY KEY ("produkId","bahanBakuId")
);

-- CreateTable
CREATE TABLE "HppSnapshot" (
    "id" SERIAL NOT NULL,
    "produkId" INTEGER NOT NULL,
    "hppTerhitung" DOUBLE PRECISION NOT NULL,
    "marginPersen" DOUBLE PRECISION NOT NULL,
    "dihitungPada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HppSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "HistoriHarga" ADD CONSTRAINT "HistoriHarga_bahanBakuId_fkey" FOREIGN KEY ("bahanBakuId") REFERENCES "BahanBaku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resep" ADD CONSTRAINT "Resep_produkId_fkey" FOREIGN KEY ("produkId") REFERENCES "Produk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resep" ADD CONSTRAINT "Resep_bahanBakuId_fkey" FOREIGN KEY ("bahanBakuId") REFERENCES "BahanBaku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HppSnapshot" ADD CONSTRAINT "HppSnapshot_produkId_fkey" FOREIGN KEY ("produkId") REFERENCES "Produk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

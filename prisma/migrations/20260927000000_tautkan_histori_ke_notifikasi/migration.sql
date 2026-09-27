-- AlterTable
ALTER TABLE "HistoriHargaJual" ADD COLUMN     "notifikasiId" INTEGER;

-- CreateIndex
CREATE INDEX "HistoriHargaJual_notifikasiId_idx" ON "HistoriHargaJual"("notifikasiId");

-- AddForeignKey
ALTER TABLE "HistoriHargaJual" ADD CONSTRAINT "HistoriHargaJual_notifikasiId_fkey" FOREIGN KEY ("notifikasiId") REFERENCES "Notifikasi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "Usaha" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "namaUsaha" TEXT NOT NULL,
    "jenisUsaha" TEXT NOT NULL,

    CONSTRAINT "Usaha_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usaha_userId_key" ON "Usaha"("userId");

-- AddForeignKey
ALTER TABLE "Usaha" ADD CONSTRAINT "Usaha_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

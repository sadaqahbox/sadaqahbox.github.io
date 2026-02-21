-- CreateTable
CREATE TABLE "Box" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "count" INTEGER NOT NULL DEFAULT 0,
    "totalValue" REAL NOT NULL DEFAULT 0,
    "currency" TEXT,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Box_createdAt_idx" ON "Box"("createdAt");

-- CreateTable
CREATE TABLE "Sadaqah" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boxId" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "location" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    CONSTRAINT "Sadaqah_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "Box"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Sadaqah_boxId_idx" ON "Sadaqah"("boxId");
CREATE INDEX "Sadaqah_createdAt_idx" ON "Sadaqah"("createdAt");

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boxId" TEXT NOT NULL,
    "emptiedAt" DATETIME NOT NULL,
    "sadaqahsCollected" INTEGER NOT NULL,
    "totalValue" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    CONSTRAINT "Collection_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "Box"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Collection_boxId_idx" ON "Collection"("boxId");
CREATE INDEX "Collection_emptiedAt_idx" ON "Collection"("emptiedAt");

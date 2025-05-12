/*
  Warnings:

  - You are about to drop the column `address` on the `Item` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT,
    "condition" TEXT DEFAULT 'Good',
    "pickupTime" TEXT,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "Item_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("createdAt", "description", "id", "image", "latitude", "longitude", "name", "ownerId", "pickupTime", "status", "updatedAt") SELECT "createdAt", "description", "id", "image", "latitude", "longitude", "name", "ownerId", "pickupTime", "status", "updatedAt" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

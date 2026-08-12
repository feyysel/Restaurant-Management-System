-- AlterTable: replace User.email with User.phone (unique, NOT NULL)
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "restaurantId" TEXT,
    CONSTRAINT "User_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_User" ("id", "name", "phone", "passwordHash", "role", "isActive", "createdAt", "restaurantId")
SELECT "id", "name",
    CASE "email"
        WHEN 'admin@rms.dev' THEN '09171234567'
        WHEN 'manager@goldenfork.com' THEN '09171234568'
        WHEN 'waiter1@goldenfork.com' THEN '09171234569'
        WHEN 'waiter2@goldenfork.com' THEN '09171234570'
        WHEN 'kitchen1@goldenfork.com' THEN '09171234571'
        WHEN 'kitchen2@goldenfork.com' THEN '09171234572'
        ELSE '0917' || substr(replace("email", '.', ''), 1, 8)
    END,
    "passwordHash", "role", "isActive", "createdAt", "restaurantId"
FROM "User";

DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_bookings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "roomId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "bookings_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_bookings" ("createdAt", "endTime", "id", "roomId", "startTime", "status", "title", "updatedAt", "userId") SELECT "createdAt", "endTime", "id", "roomId", "startTime", "status", "title", "updatedAt", "userId" FROM "bookings";
DROP TABLE "bookings";
ALTER TABLE "new_bookings" RENAME TO "bookings";
CREATE TABLE "new_rooms" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_rooms" ("capacity", "createdAt", "description", "id", "location", "name", "updatedAt") SELECT "capacity", "createdAt", "description", "id", "location", "name", "updatedAt" FROM "rooms";
DROP TABLE "rooms";
ALTER TABLE "new_rooms" RENAME TO "rooms";
CREATE TABLE "new_theme_settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "paletteIndex" INTEGER NOT NULL DEFAULT 0,
    "textColorIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_theme_settings" ("createdAt", "id", "paletteIndex", "textColorIndex", "updatedAt") SELECT "createdAt", "id", "paletteIndex", "textColorIndex", "updatedAt" FROM "theme_settings";
DROP TABLE "theme_settings";
ALTER TABLE "new_theme_settings" RENAME TO "theme_settings";
CREATE UNIQUE INDEX "theme_settings_id_key" ON "theme_settings"("id");
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("createdAt", "email", "id", "passwordHash", "role", "updatedAt", "username") SELECT "createdAt", "email", "id", "passwordHash", "role", "updatedAt", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

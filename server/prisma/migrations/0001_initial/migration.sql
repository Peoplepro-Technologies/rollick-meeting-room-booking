-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL UNIQUE,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "roomId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bookings_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms" ("id") ON DELETE CASCADE,
    CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- CreateTable
CREATE TABLE "theme_settings" (
    "id" INTEGER NOT NULL PRIMARY KEY CHECK ("id" = 1),
    "paletteIndex" INTEGER NOT NULL DEFAULT 0,
    "textColorIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
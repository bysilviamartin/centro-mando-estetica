-- CreateTable
CREATE TABLE "DailyCash" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "treatmentSales" DECIMAL NOT NULL DEFAULT 0,
    "productSales" DECIMAL NOT NULL DEFAULT 0,
    "voucherSales" DECIMAL NOT NULL DEFAULT 0,
    "giftCardSales" DECIMAL NOT NULL DEFAULT 0,
    "otherSales" DECIMAL NOT NULL DEFAULT 0,
    "cashAmount" DECIMAL NOT NULL DEFAULT 0,
    "cardAmount" DECIMAL NOT NULL DEFAULT 0,
    "transferAmount" DECIMAL NOT NULL DEFAULT 0,
    "bizumAmount" DECIMAL NOT NULL DEFAULT 0,
    "volveremosCashAmount" DECIMAL NOT NULL DEFAULT 0,
    "volveremosCardAmount" DECIMAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyCash_date_key" ON "DailyCash"("date");

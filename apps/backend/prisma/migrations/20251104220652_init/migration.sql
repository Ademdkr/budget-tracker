/*
  Warnings:

  - You are about to alter the column `emoji` on the `Category` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(10)`.
  - You are about to alter the column `color` on the `Category` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(7)`.
  - Made the column `updated_at` on table `Account` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `Budget` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `Category` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `Transaction` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "Budget" ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "month" DROP DEFAULT,
ALTER COLUMN "year" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "emoji" SET DATA TYPE VARCHAR(10),
ALTER COLUMN "color" SET DATA TYPE VARCHAR(7),
ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "updated_at" SET NOT NULL;

-- CreateIndex
CREATE INDEX "idx_category_account_id" ON "Category"("account_id");

-- CreateIndex
CREATE INDEX "idx_category_transaction_type" ON "Category"("transaction_type");

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'CASH', 'OTHER');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateTable
CREATE TABLE "User" (
    "id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "surname" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" "AccountType" NOT NULL,
    "initial_balance" DECIMAL(8,2) NOT NULL,
    "note" TEXT,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" BIGINT NOT NULL,
    "account_id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "transaction_type" "TransactionType" NOT NULL,
    "emoji" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" BIGINT NOT NULL,
    "category_id" BIGINT NOT NULL,
    "date" DATE NOT NULL,
    "total_amount" DECIMAL(8,2) NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" BIGINT NOT NULL,
    "category_id" BIGINT NOT NULL,
    "account_id" BIGINT NOT NULL,
    "date" DATE NOT NULL,
    "amount" DECIMAL(8,2) NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(0) NOT NULL,
    "updated_at" TIMESTAMP(0),

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_unique" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "category_account_id_name_unique" ON "Category"("account_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "budget_category_id_date_unique" ON "Budget"("category_id", "date");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "account_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "category_account_id_foreign" FOREIGN KEY ("account_id") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "budget_category_id_foreign" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "transaction_category_id_foreign" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "transaction_account_id_foreign" FOREIGN KEY ("account_id") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

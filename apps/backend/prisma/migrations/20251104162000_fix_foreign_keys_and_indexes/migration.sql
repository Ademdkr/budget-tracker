-- Fix Foreign Key constraints to CASCADE delete
-- Drop old constraints
ALTER TABLE "Account" DROP CONSTRAINT IF EXISTS "account_user_id_foreign";
ALTER TABLE "Category" DROP CONSTRAINT IF EXISTS "category_account_id_foreign";
ALTER TABLE "Budget" DROP CONSTRAINT IF EXISTS "budget_category_id_foreign";
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "transaction_category_id_foreign";
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "transaction_account_id_foreign";

-- Add new constraints with CASCADE
ALTER TABLE "Account" ADD CONSTRAINT "account_user_id_foreign" 
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Category" ADD CONSTRAINT "category_account_id_foreign" 
  FOREIGN KEY ("account_id") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Budget" ADD CONSTRAINT "budget_category_id_foreign" 
  FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Transaction" ADD CONSTRAINT "transaction_category_id_foreign" 
  FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Transaction" ADD CONSTRAINT "transaction_account_id_foreign" 
  FOREIGN KEY ("account_id") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add missing indexes
CREATE INDEX IF NOT EXISTS "idx_account_user_id" ON "Account"("user_id");
CREATE INDEX IF NOT EXISTS "idx_account_type" ON "Account"("type");
CREATE INDEX IF NOT EXISTS "idx_account_is_active" ON "Account"("is_active");

CREATE INDEX IF NOT EXISTS "idx_transaction_category_id" ON "Transaction"("category_id");
CREATE INDEX IF NOT EXISTS "idx_transaction_account_id" ON "Transaction"("account_id");
CREATE INDEX IF NOT EXISTS "idx_transaction_date" ON "Transaction"("date");
CREATE INDEX IF NOT EXISTS "idx_transaction_amount" ON "Transaction"("amount");

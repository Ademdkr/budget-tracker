-- Fix Budget table structure: replace date with month and year
ALTER TABLE "Budget" DROP COLUMN "date";
ALTER TABLE "Budget" ADD COLUMN "month" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Budget" ADD COLUMN "year" INTEGER NOT NULL DEFAULT 2025;

-- Drop old unique constraint on date
ALTER TABLE "Budget" DROP CONSTRAINT IF EXISTS "budget_category_id_date_unique";

-- Add new unique constraint and indexes
CREATE UNIQUE INDEX IF NOT EXISTS "budget_category_year_month_unique" ON "Budget"("category_id", "year", "month");
CREATE INDEX IF NOT EXISTS "idx_budget_category_id" ON "Budget"("category_id");
CREATE INDEX IF NOT EXISTS "idx_budget_year_month" ON "Budget"("year", "month");
CREATE INDEX IF NOT EXISTS "idx_budget_year" ON "Budget"("year");

-- Add sequences for autoincrement IDs
CREATE SEQUENCE IF NOT EXISTS "User_id_seq";
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT nextval('"User_id_seq"');
ALTER SEQUENCE "User_id_seq" OWNED BY "User"."id";
SELECT setval('"User_id_seq"', COALESCE((SELECT MAX(id) FROM "User"), 0) + 1, false);

CREATE SEQUENCE IF NOT EXISTS "Account_id_seq";
ALTER TABLE "Account" ALTER COLUMN "id" SET DEFAULT nextval('"Account_id_seq"');
ALTER SEQUENCE "Account_id_seq" OWNED BY "Account"."id";
SELECT setval('"Account_id_seq"', COALESCE((SELECT MAX(id) FROM "Account"), 0) + 1, false);

CREATE SEQUENCE IF NOT EXISTS "Category_id_seq";
ALTER TABLE "Category" ALTER COLUMN "id" SET DEFAULT nextval('"Category_id_seq"');
ALTER SEQUENCE "Category_id_seq" OWNED BY "Category"."id";
SELECT setval('"Category_id_seq"', COALESCE((SELECT MAX(id) FROM "Category"), 0) + 1, false);

CREATE SEQUENCE IF NOT EXISTS "Budget_id_seq";
ALTER TABLE "Budget" ALTER COLUMN "id" SET DEFAULT nextval('"Budget_id_seq"');
ALTER SEQUENCE "Budget_id_seq" OWNED BY "Budget"."id";
SELECT setval('"Budget_id_seq"', COALESCE((SELECT MAX(id) FROM "Budget"), 0) + 1, false);

CREATE SEQUENCE IF NOT EXISTS "Transaction_id_seq";
ALTER TABLE "Transaction" ALTER COLUMN "id" SET DEFAULT nextval('"Transaction_id_seq"');
ALTER SEQUENCE "Transaction_id_seq" OWNED BY "Transaction"."id";
SELECT setval('"Transaction_id_seq"', COALESCE((SELECT MAX(id) FROM "Transaction"), 0) + 1, false);

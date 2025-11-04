import { PrismaClient, TransactionType } from '@prisma/client';

/**
 * Factory function to create a category with optional budget
 */
export async function createCategory(
  prisma: PrismaClient,
  accountId: bigint,
  data: {
    name: string;
    description: string;
    transactionType: TransactionType;
    emoji: string;
    color: string;
  },
) {
  return await prisma.category.create({
    data: {
      accountId,
      name: data.name,
      description: data.description,
      transactionType: data.transactionType,
      emoji: data.emoji,
      color: data.color,
    },
  });
}

/**
 * Factory function to create budgets for a category
 */
export async function createBudgets(
  prisma: PrismaClient,
  categoryId: bigint,
  budgets: Array<{ year: number; month: number; totalAmount: number }>,
) {
  if (budgets.length === 0) return;

  await prisma.budget.createMany({
    data: budgets.map((budget) => ({
      categoryId,
      year: budget.year,
      month: budget.month,
      totalAmount: budget.totalAmount,
    })),
  });
}

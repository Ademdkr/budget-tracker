import { PrismaClient } from '@prisma/client';

/**
 * Factory function to create multiple transactions
 */
export async function createTransactions(
  prisma: PrismaClient,
  categoryId: bigint,
  accountId: bigint,
  transactions: Array<{ date: Date; amount: number; note: string }>,
) {
  if (transactions.length === 0) return;

  await prisma.transaction.createMany({
    data: transactions.map((tx) => ({
      categoryId,
      accountId,
      date: tx.date,
      amount: tx.amount,
      note: tx.note,
    })),
  });
}

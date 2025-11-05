import { PrismaClient, AccountType } from '@prisma/client';

/**
 * Factory function to create an account with initial balance
 */
export async function createAccount(
  prisma: PrismaClient,
  userId: bigint,
  data: {
    name: string;
    type: AccountType;
    initialBalance: number;
    note: string;
    isActive: boolean;
  },
) {
  return await prisma.account.create({
    data: {
      userId,
      name: data.name,
      type: data.type,
      initialBalance: data.initialBalance,
      note: data.note,
      isActive: data.isActive,
    },
  });
}

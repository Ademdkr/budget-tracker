import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  private convertBigIntsToStrings<T>(obj: T): T {
    return JSON.parse(
      JSON.stringify(obj, (_, value) => {
        // Konvertiere BigInt zu String
        if (typeof value === 'bigint') {
          return value.toString();
        }
        // Konvertiere Prisma Decimal zu Number
        if (
          value &&
          typeof value === 'object' &&
          value.constructor &&
          value.constructor.name === 'Decimal'
        ) {
          return parseFloat(value.toString());
        }
        return value;
      }),
    );
  }

  async findMany(userId: string) {
    const budgets = await this.prisma.budget.findMany({
      where: {
        category: {
          account: {
            userId: BigInt(userId),
          },
        },
      },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return this.convertBigIntsToStrings(budgets);
  }

  async findOne(id: string, userId: string) {
    const budget = await this.prisma.budget.findFirst({
      where: {
        id: BigInt(id),
        category: {
          account: {
            userId: BigInt(userId),
          },
        },
      },
      include: {
        category: true,
      },
    });
    return budget ? this.convertBigIntsToStrings(budget) : null;
  }

  async create(dto: CreateBudgetDto, userId: string) {
    // Verify that the category belongs to the user
    const category = await this.prisma.category.findFirst({
      where: {
        id: BigInt(dto.categoryId),
        account: {
          userId: BigInt(userId),
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found or access denied');
    }

    const budget = await this.prisma.budget.create({
      data: {
        categoryId: BigInt(dto.categoryId),
        year: dto.year,
        month: dto.month,
        totalAmount: dto.totalAmount,
      },
      include: {
        category: true,
      },
    });
    return this.convertBigIntsToStrings(budget);
  }

  async update(id: string, dto: UpdateBudgetDto, userId: string) {
    const exists = await this.findOne(id, userId);
    if (!exists)
      throw new NotFoundException('Budget not found or access denied');

    const budget = await this.prisma.budget.update({
      where: { id: BigInt(id) },
      data: {
        totalAmount: dto.totalAmount,
      },
      include: {
        category: true,
      },
    });
    return this.convertBigIntsToStrings(budget);
  }

  async remove(id: string, userId: string) {
    const exists = await this.findOne(id, userId);
    if (!exists)
      throw new NotFoundException('Budget not found or access denied');

    const budget = await this.prisma.budget.delete({
      where: { id: BigInt(id) },
      include: {
        category: true,
      },
    });
    return this.convertBigIntsToStrings(budget);
  }

  /**
   * Get budgets with calculated statistics for a specific period and account
   */
  async getBudgetsWithStats(
    year?: number,
    month?: number,
    accountId?: string,
    userId?: string,
  ) {
    // If no period specified, use current month/year
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1; // JS months are 0-based, DB months are 1-based

    const whereClause: any = {
      year: targetYear,
      month: targetMonth,
      category: {
        account: {},
      },
    };

    // Always filter by userId if provided
    if (userId) {
      whereClause.category.account.userId = BigInt(userId);
    }

    // If accountId is provided, filter by categories of that account
    if (accountId) {
      whereClause.category.account.id = BigInt(accountId);
    }

    const budgets = await this.prisma.budget.findMany({
      where: whereClause,
      include: {
        category: {
          include: {
            transactions: true, // Load ALL transactions for this category, filter later
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const budgetsWithStats = budgets.map((budget) => {
      const targetAmount = parseFloat(budget.totalAmount.toString());

      // Filter transactions for the target month/year and expense type
      const monthStart = new Date(targetYear, targetMonth - 1, 1);
      const monthEnd = new Date(targetYear, targetMonth, 1);

      const transactionsInMonth = budget.category.transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return transactionDate >= monthStart && transactionDate < monthEnd;
      });

      // Calculate actual spending from expense transactions in the target month
      const expenseTransactions = transactionsInMonth.filter(
        () => budget.category.transactionType === 'EXPENSE',
      );

      const currentAmount = expenseTransactions.reduce(
        (sum, transaction) => sum + parseFloat(transaction.amount.toString()),
        0,
      );

      const remainingAmount = targetAmount - currentAmount;
      const percentageUsed =
        targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;

      const lastTransaction =
        expenseTransactions.length > 0
          ? expenseTransactions.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            )[0]
          : null;

      return {
        id: budget.id.toString(),
        categoryId: budget.categoryId.toString(),
        categoryName: budget.category.name,
        categoryIcon: budget.category.emoji || '📦',
        categoryColor: budget.category.color || '#4CAF50',
        targetAmount,
        currentAmount,
        remainingAmount,
        percentageUsed,
        transactionCount: expenseTransactions.length,
        lastTransactionDate: lastTransaction ? lastTransaction.date : null,
        month: budget.month,
        year: budget.year,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
        isActive: true,
      };
    });

    return budgetsWithStats;
  }
}

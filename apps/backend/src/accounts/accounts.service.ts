import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async create(createAccountDto: CreateAccountDto) {
    return this.prisma.account.create({
      data: createAccountDto,
    });
  }

  async findAll() {
    return this.prisma.account.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    return account;
  }

  async update(id: string, updateAccountDto: UpdateAccountDto) {
    const account = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    return this.prisma.account.update({
      where: { id },
      data: updateAccountDto,
    });
  }

  async remove(id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    // If account has transactions, deactivate instead of delete
    if (account._count.transactions > 0) {
      return this.prisma.account.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return this.prisma.account.delete({
      where: { id },
    });
  }

  async getStatistics() {
    const accounts = await this.prisma.account.findMany({
      where: { isActive: true },
    });

    const totalBalance = accounts.reduce(
      (sum, account) => sum + account.balance,
      0,
    );
    const activeAccounts = accounts.length;
    const totalAccounts = await this.prisma.account.count();

    return {
      totalBalance,
      activeAccounts,
      totalAccounts,
    };
  }

  async recalculateAccountBalances() {
    const accounts = await this.prisma.account.findMany({
      include: {
        transactions: true,
      },
    });

    const updatePromises = accounts.map(async (account) => {
      // Berechne den Saldo basierend auf Transaktionen
      // Startbetrag ist der aktuelle Saldo im Account
      let calculatedBalance = 0;

      // Summiere alle Transaktionen
      for (const transaction of account.transactions) {
        if (transaction.type === 'INCOME') {
          calculatedBalance += transaction.amount;
        } else if (transaction.type === 'EXPENSE') {
          calculatedBalance -= transaction.amount;
        }
      }

      // Update Account-Saldo
      return this.prisma.account.update({
        where: { id: account.id },
        data: { balance: calculatedBalance },
      });
    });

    const updatedAccounts = await Promise.all(updatePromises);
    return updatedAccounts;
  }

  async getAccountsWithCalculatedBalances() {
    // Erstelle erweiterte Account-Daten mit berechneten Statistiken
    const accounts = await this.prisma.account.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
        },
        _count: {
          select: { transactions: true },
        },
      },
    });

    return accounts.map((account) => {
      // Berechne Statistiken aus Transaktionen
      const lastTransaction = account.transactions[0];
      const totalIncome = account.transactions
        .filter((t) => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = account.transactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0);

      // Der aktuelle Saldo sollte bereits korrekt aus Transaktionen berechnet sein
      const calculatedBalance = account.balance;

      return {
        ...account,
        calculatedBalance,
        totalIncome,
        totalExpenses,
        lastTransactionDate: lastTransaction?.date,
        transactionCount: account._count.transactions,
      };
    });
  }

  // Category-Account Relationship Management
  async assignCategory(accountId: string, categoryId: string) {
    // Verify both account and category exist
    const [account, category] = await Promise.all([
      this.prisma.account.findUnique({ where: { id: accountId } }),
      this.prisma.category.findUnique({ where: { id: categoryId } }),
    ]);

    if (!account) {
      throw new NotFoundException(`Account with ID ${accountId} not found`);
    }

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    // Create the assignment
    return this.prisma.categoryAccount.create({
      data: {
        accountId,
        categoryId,
      },
      include: {
        category: {
          include: {
            budget: true,
            _count: {
              select: { transactions: true },
            },
          },
        },
        account: true,
      },
    });
  }

  async removeCategory(accountId: string, categoryId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${accountId} not found`);
    }

    // Remove the assignment
    return this.prisma.categoryAccount.deleteMany({
      where: {
        accountId,
        categoryId,
      },
    });
  }

  async getAssignedCategories(accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${accountId} not found`);
    }

    // Get all category assignments for this account
    return this.prisma.categoryAccount.findMany({
      where: {
        accountId,
      },
      include: {
        category: {
          include: {
            budget: true,
            _count: {
              select: { transactions: true },
            },
          },
        },
      },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  // Hilfsfunktion für BigInt-zu-String Konvertierung
  private convertBigIntsToStrings(obj: any): any {
    const converted = JSON.parse(
      JSON.stringify(obj, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );

    // Transformiere note zu title und description für Frontend-Kompatibilität
    if (converted.note !== undefined) {
      converted.title = converted.note;
      converted.description = converted.note;
    }

    return converted;
  }

  async create(createTransactionDto: CreateTransactionDto, userId: string) {
    // Verify that the category belongs to an account owned by the user
    const category = await this.prisma.category.findFirst({
      where: {
        id: BigInt(createTransactionDto.categoryId),
        account: {
          userId: BigInt(userId),
        },
      },
    });

    if (!category) {
      throw new Error('Category not found or access denied');
    }

    // Verify that the account belongs to the user
    const account = await this.prisma.account.findFirst({
      where: {
        id: BigInt(createTransactionDto.accountId),
        userId: BigInt(userId),
      },
    });

    if (!account) {
      throw new Error('Account not found or access denied');
    }

    // Konvertiere String-IDs zu BigInt für Prisma und entferne type (wird von Category abgeleitet)
    // Verwende title oder description als note für Prisma
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { type, title, description, ...dtoWithoutType } =
      createTransactionDto;
    const data = {
      ...dtoWithoutType,
      note: title || description || null,
      categoryId: BigInt(createTransactionDto.categoryId),
      accountId: BigInt(createTransactionDto.accountId),
      date: createTransactionDto.date
        ? new Date(createTransactionDto.date)
        : new Date(),
    };

    console.log('Creating transaction with data:', data);

    try {
      const transaction = await this.prisma.transaction.create({
        data,
        include: {
          category: true,
          account: true,
        },
      });

      // Check if there are any budgets for this category in the same month/year
      const transactionDate = new Date(data.date);
      const year = transactionDate.getFullYear();
      const month = transactionDate.getMonth() + 1; // JS months are 0-based, DB months are 1-based

      const relatedBudgets = await this.prisma.budget.findMany({
        where: {
          categoryId: BigInt(createTransactionDto.categoryId),
          year,
          month,
        },
      });

      if (relatedBudgets.length > 0) {
        console.log(
          `📊 Transaction affects ${relatedBudgets.length} budget(s) for category ${createTransactionDto.categoryId} in ${year}-${month}`,
        );
      }

      // Konvertiere BigInt IDs zu Strings für JSON Serialisierung
      return this.convertBigIntsToStrings(transaction);
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  async findAll(userId: string, accountId?: string) {
    const whereClause: any = {
      category: {
        account: {
          userId: BigInt(userId),
        },
      },
    };

    // Optionally filter by specific account (if provided)
    if (accountId) {
      whereClause.accountId = BigInt(accountId);
    }

    const transactions = await this.prisma.transaction.findMany({
      where: whereClause,
      include: {
        category: true,
        account: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return this.convertBigIntsToStrings(transactions);
  }

  async findOne(id: string, userId: string) {
    const transaction = await this.prisma.transaction.findFirst({
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
        account: true,
      },
    });

    return transaction ? this.convertBigIntsToStrings(transaction) : null;
  }

  async update(
    id: string,
    updateTransactionDto: UpdateTransactionDto,
    userId: string,
  ) {
    // First verify the transaction belongs to the user
    const exists = await this.findOne(id, userId);
    if (!exists) {
      throw new Error('Transaction not found or access denied');
    }

    // Entferne type und konvertiere String-IDs zu BigInt falls vorhanden
    // Verwende title oder description als note für Prisma
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { type, title, description, ...dtoWithoutType } =
      updateTransactionDto;
    const data: any = { ...dtoWithoutType };
    if (title || description) data.note = title || description;
    if (data.categoryId) {
      // Verify new category belongs to user's account
      const category = await this.prisma.category.findFirst({
        where: {
          id: BigInt(data.categoryId),
          account: {
            userId: BigInt(userId),
          },
        },
      });
      if (!category) {
        throw new Error('Category not found or access denied');
      }
      data.categoryId = BigInt(data.categoryId);
    }
    if (data.accountId) {
      // Verify new account belongs to user
      const account = await this.prisma.account.findFirst({
        where: {
          id: BigInt(data.accountId),
          userId: BigInt(userId),
        },
      });
      if (!account) {
        throw new Error('Account not found or access denied');
      }
      data.accountId = BigInt(data.accountId);
    }
    if (data.date) data.date = new Date(data.date);

    const transaction = await this.prisma.transaction.update({
      where: { id: BigInt(id) },
      data,
      include: {
        category: true,
        account: true,
      },
    });

    return this.convertBigIntsToStrings(transaction);
  }

  async remove(id: string, userId: string) {
    // Verify the transaction belongs to the user
    const exists = await this.findOne(id, userId);
    if (!exists) {
      throw new Error('Transaction not found or access denied');
    }

    await this.prisma.transaction.delete({
      where: { id: BigInt(id) },
    });
  }
}

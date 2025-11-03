import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import {
  ImportRequestDto,
  ImportResultDto,
} from './dto/import-transactions.dto';
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

  async importTransactions(
    importRequest: ImportRequestDto,
    userId: string,
  ): Promise<ImportResultDto> {
    const { data, options } = importRequest;
    const result: ImportResultDto = {
      total: data.length,
      successful: 0,
      skipped: 0,
      errors: 0,
      errorDetails: [],
      createdTransactions: [],
    };

    // Verify account belongs to user
    const account = await this.prisma.account.findFirst({
      where: {
        id: BigInt(options.targetAccountId),
        userId: BigInt(userId),
      },
    });

    if (!account) {
      throw new Error('Account not found or access denied');
    }

    // Pre-create both INCOME and EXPENSE "Unbekannt" categories to avoid race conditions
    const categoryPromises = [
      {
        type: 'INCOME' as const,
        name: 'Unbekannte Einnahmen',
        emoji: '❓',
        color: '#4CAF50',
      },
      {
        type: 'EXPENSE' as const,
        name: 'Unbekannte Ausgaben',
        emoji: '❓',
        color: '#F44336',
      },
    ].map(async (categoryConfig) => {
      const existing = await this.prisma.category.findFirst({
        where: {
          accountId: BigInt(options.targetAccountId),
          name: categoryConfig.name,
          transactionType: categoryConfig.type,
        },
      });

      if (!existing) {
        try {
          return await this.prisma.category.create({
            data: {
              name: categoryConfig.name,
              emoji: categoryConfig.emoji,
              color: categoryConfig.color,
              transactionType: categoryConfig.type,
              accountId: BigInt(options.targetAccountId),
            },
          });
        } catch {
          // If creation fails due to race condition, fetch existing
          return await this.prisma.category.findFirst({
            where: {
              accountId: BigInt(options.targetAccountId),
              name: categoryConfig.name,
              transactionType: categoryConfig.type,
            },
          });
        }
      }
      return existing;
    });

    await Promise.all(categoryPromises);

    // Process each transaction
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 1 + (options.skipFirstRow ? 1 : 0);

      try {
        // Parse date
        const parsedDate = this.parseDate(row.date, options.dateFormat);
        if (!parsedDate) {
          throw new Error(`Ungültiges Datum: ${row.date}`);
        }

        // Parse amount
        const parsedAmount = this.parseAmount(
          row.amount.toString(),
          options.amountFormat,
        );
        if (isNaN(parsedAmount)) {
          throw new Error(`Ungültiger Betrag: ${row.amount}`);
        }

        // Determine transaction type
        const transactionType = parsedAmount >= 0 ? 'INCOME' : 'EXPENSE';
        const absoluteAmount = Math.abs(parsedAmount);
        const categoryName =
          transactionType === 'INCOME'
            ? 'Unbekannte Einnahmen'
            : 'Unbekannte Ausgaben';

        // Find the appropriate category (should exist now)
        const category = await this.prisma.category.findFirst({
          where: {
            accountId: BigInt(options.targetAccountId),
            name: categoryName,
            transactionType,
          },
        });

        if (!category) {
          throw new Error(
            `Kategorie "${categoryName}" für ${transactionType} nicht gefunden`,
          );
        }

        // Create transaction
        const transaction = await this.prisma.transaction.create({
          data: {
            date: parsedDate,
            amount: absoluteAmount,
            note: row.note || null,
            categoryId: category.id,
            accountId: BigInt(options.targetAccountId),
          },
          include: {
            category: true,
            account: true,
          },
        });

        result.successful++;
        result.createdTransactions?.push(
          this.convertBigIntsToStrings(transaction),
        );
      } catch (error) {
        result.errors++;
        result.errorDetails.push({
          row: rowNumber,
          data: row,
          error: error instanceof Error ? error.message : 'Unbekannter Fehler',
        });
      }
    }

    return result;
  }

  private parseDate(dateStr: string, format: string): Date | null {
    try {
      const parts = dateStr.split(/[.\-\/]/);
      let day: number, month: number, year: number;

      switch (format) {
        case 'DD.MM.YYYY':
        case 'DD-MM-YYYY':
          day = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10) - 1;
          year = parseInt(parts[2], 10);
          break;
        case 'MM/DD/YYYY':
          month = parseInt(parts[0], 10) - 1;
          day = parseInt(parts[1], 10);
          year = parseInt(parts[2], 10);
          break;
        case 'YYYY-MM-DD':
          year = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10) - 1;
          day = parseInt(parts[2], 10);
          break;
        default:
          return null;
      }

      // Use UTC to avoid timezone issues
      const date = new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }

  private parseAmount(amountStr: string, format: string): number {
    try {
      let cleaned = amountStr.trim();

      switch (format) {
        case 'de':
          // German: 1.234,56
          cleaned = cleaned.replace(/\./g, '').replace(',', '.');
          break;
        case 'en':
          // English: 1,234.56
          cleaned = cleaned.replace(/,/g, '');
          break;
        case 'simple':
          // Simple: 1234.56
          break;
      }

      return parseFloat(cleaned);
    } catch {
      return NaN;
    }
  }
}

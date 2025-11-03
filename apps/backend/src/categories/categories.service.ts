import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // Einfache Hilfsfunktion für BigInt-zu-String Konvertierung
  private convertBigIntsToStrings(obj: any): any {
    return JSON.parse(
      JSON.stringify(obj, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );
  }

  async create(data: any, userId: string) {
    // Verify that the account belongs to the user
    const account = await this.prisma.account.findFirst({
      where: {
        id: BigInt(data.accountId),
        userId: BigInt(userId),
      },
    });

    if (!account) {
      throw new Error('Account not found or access denied');
    }

    // Konvertiere accountId von String zu BigInt
    const accountId = BigInt(data.accountId);

    console.log('Creating category with data:', data);
    console.log('Converting accountId:', data.accountId, '->', accountId);

    try {
      const category = await this.prisma.category.create({
        data: {
          ...data,
          accountId,
        },
        include: {
          account: true,
          budgets: true,
          transactions: true,
        },
      });

      // Konvertiere BigInt IDs zu Strings für JSON Serialisierung
      return this.convertBigIntsToStrings(category);
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  async findAll(userId: string) {
    console.log('findAll categories called for user:', userId);
    try {
      const categories = await this.prisma.category.findMany({
        where: {
          account: {
            userId: BigInt(userId),
          },
        },
        include: {
          account: true, // Include account information
          budgets: true,
          _count: {
            select: { transactions: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      console.log('findAll found categories:', categories.length);

      // Konvertiere BigInt IDs zu Strings für JSON-Serialisierung
      const converted = this.convertBigIntsToStrings(categories);
      console.log('✅ Successfully found all categories:', converted.length);
      return converted;
    } catch (error) {
      console.error('Error in findAll categories:', error);
      throw error;
    }
  }

  async findOne(id: string, userId: string) {
    const idBigInt = BigInt(id);
    const category = await this.prisma.category.findFirst({
      where: {
        id: idBigInt,
        account: {
          userId: BigInt(userId),
        },
      },
      include: {
        account: true,
        budgets: true,
        transactions: true,
      },
    });

    if (!category) return null;

    // Konvertiere BigInt IDs zu Strings
    return this.convertBigIntsToStrings(category);
  }

  async update(id: string, data: any, userId: string) {
    // Verify the category belongs to the user
    const exists = await this.findOne(id, userId);
    if (!exists) {
      throw new Error('Category not found or access denied');
    }

    const idBigInt = BigInt(id);
    const category = await this.prisma.category.update({
      where: { id: idBigInt },
      data,
      include: {
        account: true,
        budgets: true,
        transactions: true,
      },
    });

    // Konvertiere BigInt IDs zu Strings für JSON Serialisierung
    return this.convertBigIntsToStrings(category);
  }

  async remove(id: string, userId: string) {
    // Verify the category belongs to the user
    const exists = await this.findOne(id, userId);
    if (!exists) {
      throw new Error('Category not found or access denied');
    }

    const idBigInt = BigInt(id);
    const result = await this.prisma.category.delete({
      where: { id: idBigInt },
    });
    return this.convertBigIntsToStrings(result);
  }

  // Account-Category Relationship Management
  // Da Kategorien direkt mit Accounts verknüpft sind, können wir die accountId direkt setzen
  async assignToAccount(categoryId: string, accountId: string, userId: string) {
    // Verify both category and account belong to user
    const category = await this.findOne(categoryId, userId);
    if (!category) {
      throw new Error('Category not found or access denied');
    }

    const account = await this.prisma.account.findFirst({
      where: {
        id: BigInt(accountId),
        userId: BigInt(userId),
      },
    });
    if (!account) {
      throw new Error('Account not found or access denied');
    }

    const categoryIdBigInt = BigInt(categoryId);
    const accountIdBigInt = BigInt(accountId);

    // Update der Kategorie mit der neuen accountId
    const result = await this.prisma.category.update({
      where: { id: categoryIdBigInt },
      data: { accountId: accountIdBigInt },
      include: {
        account: true,
      },
    });

    return this.convertBigIntsToStrings(result);
  }

  async removeFromAccount(
    categoryId: string,
    _accountId: string,
    userId: string,
  ) {
    // Verify the category belongs to the user
    const exists = await this.findOne(categoryId, userId);
    if (!exists) {
      throw new Error('Category not found or access denied');
    }

    const categoryIdBigInt = BigInt(categoryId);

    // Da Kategorien direkt mit einem Account verknüpft sind,
    // können wir sie nicht "entfernen", sondern nur löschen
    const result = await this.prisma.category.delete({
      where: { id: categoryIdBigInt },
    });

    return this.convertBigIntsToStrings(result);
  }

  async findByAccount(accountId: string, userId: string) {
    console.log('findByAccount called with accountId:', accountId);

    // Verify account belongs to user
    const account = await this.prisma.account.findFirst({
      where: {
        id: BigInt(accountId),
        userId: BigInt(userId),
      },
    });

    if (!account) {
      throw new Error('Account not found or access denied');
    }

    // Konvertiere accountId zu BigInt für Prisma-Vergleich
    const accountIdBigInt = BigInt(accountId);

    // Finde alle Kategorien, die direkt diesem Account zugeordnet sind
    const directCategories = await this.prisma.category.findMany({
      where: {
        accountId: accountIdBigInt,
      },
      include: {
        budgets: true,
        _count: {
          select: { transactions: true },
        },
      },
    });

    console.log(
      'Found direct categories for account:',
      directCategories.length,
    );

    // Finde zusätzlich alle Kategorien, die in Transaktionen dieses Accounts verwendet werden
    // Dies ist wichtig für den Import-Flow, wenn Kategorien nicht explizit zugeordnet sind
    const transactionCategories = await this.prisma.category.findMany({
      where: {
        transactions: {
          some: {
            accountId: accountIdBigInt,
          },
        },
      },
      include: {
        budgets: true,
        _count: {
          select: { transactions: true },
        },
      },
    });

    console.log(
      'Found transaction-based categories:',
      transactionCategories.length,
    );

    // Kombiniere beide Listen und entferne Duplikate (basierend auf id)
    const categoryMap = new Map();
    [...directCategories, ...transactionCategories].forEach((cat) => {
      categoryMap.set(cat.id.toString(), cat);
    });

    const allRelevantCategories = Array.from(categoryMap.values());
    console.log(
      'Total relevant categories for account:',
      allRelevantCategories.length,
    );

    // Konvertiere BigInt IDs zu Strings für JSON-Serialisierung
    const converted = this.convertBigIntsToStrings(allRelevantCategories);
    console.log('✅ Successfully found categories by account');

    return converted;
  }

  async getAccountAssignments(categoryId: string, userId: string) {
    // Verify the category belongs to the user
    const category = await this.findOne(categoryId, userId);
    if (!category) {
      throw new Error('Category not found or access denied');
    }

    const categoryIdBigInt = BigInt(categoryId);

    // Da Kategorien direkt mit einem Account verknüpft sind,
    // geben wir die Kategorie mit ihrem Account zurück
    const fullCategory = await this.prisma.category.findUnique({
      where: { id: categoryIdBigInt },
      include: {
        account: true,
      },
    });

    const result = fullCategory
      ? [{ category: fullCategory, account: fullCategory.account }]
      : [];
    return this.convertBigIntsToStrings(result);
  }

  /**
   * Since categories are directly linked to accounts, this method
   * returns all categories that belong to the given account
   */
  async autoAssignCategoriesBasedOnTransactions(
    accountId: string,
    userId: string,
  ) {
    console.log('Auto-assigning categories for account:', accountId);

    // Verify account belongs to user
    const account = await this.prisma.account.findFirst({
      where: {
        id: BigInt(accountId),
        userId: BigInt(userId),
      },
    });

    if (!account) {
      throw new Error('Account not found or access denied');
    }

    const accountIdBigInt = BigInt(accountId);

    // Find all categories that have transactions for this account
    const categoriesWithTransactions = await this.prisma.category.findMany({
      where: {
        transactions: {
          some: {
            accountId: accountIdBigInt,
          },
        },
      },
      include: {
        account: true,
        _count: {
          select: { transactions: true },
        },
      },
    });

    console.log(
      `Found ${categoriesWithTransactions.length} categories with transactions`,
    );
    return this.convertBigIntsToStrings(categoriesWithTransactions);
  }
}

import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: createCategoryDto,
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      include: {
        budget: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.category.findUnique({
      where: { id },
      include: {
        budget: true,
        transactions: true,
      },
    });
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async remove(id: string) {
    return this.prisma.category.delete({
      where: { id },
    });
  }

  // Account-Category Relationship Management
  async assignToAccount(categoryId: string, accountId: string) {
    return this.prisma.categoryAccount.create({
      data: {
        categoryId,
        accountId,
      },
      include: {
        category: true,
        account: true,
      },
    });
  }

  async removeFromAccount(categoryId: string, accountId: string) {
    return this.prisma.categoryAccount.deleteMany({
      where: {
        categoryId,
        accountId,
      },
    });
  }

  async findByAccount(accountId: string) {
    console.log('findByAccount called with accountId:', accountId);

    // Finde alle Kategorien, die diesem Account explizit zugeordnet sind
    const categoryAccounts = await this.prisma.categoryAccount.findMany({
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

    console.log('Found explicit categoryAccounts:', categoryAccounts.length);

    // Finde auch Kategorien, die durch Transaktionen mit diesem Account verbunden sind
    const transactionCategories = await this.prisma.category.findMany({
      where: {
        transactions: {
          some: {
            accountId: accountId,
          },
        },
      },
      include: {
        budget: true,
        _count: {
          select: { transactions: true },
        },
      },
    });

    console.log(
      'Found transaction-based categories:',
      transactionCategories.length,
    );

    // Kombiniere beide Listen und entferne Duplikate
    const explicitCategories = categoryAccounts.map((ca) => ca.category);
    const allRelevantCategories = [...explicitCategories];

    // Füge Kategorien aus Transaktionen hinzu, die noch nicht in der Liste sind
    transactionCategories.forEach((category) => {
      if (!allRelevantCategories.find((c) => c.id === category.id)) {
        allRelevantCategories.push(category);
      }
    });

    console.log(
      'Total relevant categories for account:',
      allRelevantCategories.length,
    );

    console.log('Returning account-specific categories');
    return allRelevantCategories;
  }

  async getAccountAssignments(categoryId: string) {
    return this.prisma.categoryAccount.findMany({
      where: {
        categoryId,
      },
      include: {
        account: true,
      },
    });
  }

  /**
   * Automatically create explicit category-account relationships
   * based on existing transactions
   */
  async autoAssignCategoriesBasedOnTransactions(accountId: string) {
    console.log('Auto-assigning categories for account:', accountId);

    // Find all categories that have transactions for this account
    const categoriesWithTransactions = await this.prisma.category.findMany({
      where: {
        transactions: {
          some: {
            accountId: accountId,
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    console.log(
      'Categories with transactions for this account:',
      categoriesWithTransactions.length,
    );

    // Create explicit assignments for each category (if they don't exist)
    const assignments = [];
    for (const category of categoriesWithTransactions) {
      try {
        const assignment = await this.prisma.categoryAccount.upsert({
          where: {
            categoryId_accountId: {
              categoryId: category.id,
              accountId: accountId,
            },
          },
          update: {}, // No update needed if it already exists
          create: {
            categoryId: category.id,
            accountId: accountId,
          },
          include: {
            category: {
              include: {
                budget: true,
              },
            },
          },
        });
        assignments.push(assignment);
        console.log(`✅ Assigned category "${category.name}" to account`);
      } catch (error) {
        console.log(`❌ Failed to assign category "${category.name}":`, error);
      }
    }

    console.log('Total assignments created/verified:', assignments.length);
    return assignments;
  }
}

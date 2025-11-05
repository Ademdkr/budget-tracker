import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

/**
 * Service für die Verwaltung von Budgets
 *
 * Verwaltet monatliche Budgets für Kategorien und berechnet automatisch
 * Ausgaben-Statistiken basierend auf Transaktionen. Unterstützt Filterung
 * nach Jahr, Monat und Konto.
 */
@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Konvertiert BigInt und Prisma Decimal zu JSON-kompatiblen Typen
   *
   * @param obj - Das zu konvertierende Objekt
   * @returns Das konvertierte Objekt
   * @private
   */
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

  /**
   * Ruft alle Budgets eines Benutzers ab
   *
   * @param userId - Die ID des Benutzers
   * @returns Array aller Budgets mit Kategorie-Details, sortiert nach Erstellungsdatum
   */
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

  /**
   * Ruft ein einzelnes Budget ab
   *
   * @param id - Die ID des Budgets
   * @param userId - Die ID des Benutzers (für Berechtigungsprüfung)
   * @returns Das Budget mit Kategorie-Details oder null
   */
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

  /**
   * Erstellt ein neues Budget
   *
   * Prüft, ob die Kategorie dem Benutzer gehört, bevor das Budget erstellt wird.
   *
   * @param dto - Die Daten des zu erstellenden Budgets
   * @param userId - Die ID des authentifizierten Benutzers
   * @returns Das erstellte Budget mit Kategorie-Details
   * @throws {NotFoundException} Wenn Kategorie nicht gefunden oder Zugriff verweigert wird
   *
   * @example
   * ```typescript
   * const budget = await create({
   *   categoryId: '1',
   *   year: 2025,
   *   month: 11,
   *   totalAmount: 500.00
   * }, '1');
   * ```
   */
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

  /**
   * Aktualisiert ein bestehendes Budget
   *
   * Aktuell kann nur der Ziel-Betrag (totalAmount) geändert werden.
   *
   * @param id - Die ID des zu aktualisierenden Budgets
   * @param dto - Die zu aktualisierenden Daten
   * @param userId - Die ID des Benutzers (für Berechtigungsprüfung)
   * @returns Das aktualisierte Budget
   * @throws {NotFoundException} Wenn Budget nicht gefunden oder Zugriff verweigert wird
   */
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

  /**
   * Löscht ein Budget
   *
   * @param id - Die ID des zu löschenden Budgets
   * @param userId - Die ID des Benutzers (für Berechtigungsprüfung)
   * @returns Das gelöschte Budget
   * @throws {NotFoundException} Wenn Budget nicht gefunden oder Zugriff verweigert wird
   */
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
   * Ruft Budgets mit berechneten Statistiken ab
   *
   * Berechnet automatisch:
   * - Aktuell ausgegebenen Betrag basierend auf Transaktionen
   * - Verbleibenden Betrag
   * - Prozentsatz der Nutzung
   * - Anzahl der Transaktionen
   * - Letztes Transaktionsdatum
   *
   * @param year - Optional: Jahr (Standard: aktuelles Jahr)
   * @param month - Optional: Monat 1-12 (Standard: aktueller Monat)
   * @param accountId - Optional: Filter nach bestimmtem Konto
   * @param userId - Optional: Filter nach Benutzer
   * @returns Array von Budgets mit detaillierten Statistiken
   *
   * @example
   * ```typescript
   * const budgets = await getBudgetsWithStats(2025, 11, '1', '1');
   * // [
   * //   {
   * //     id: '1',
   * //     categoryName: 'Lebensmittel',
   * //     targetAmount: 500,
   * //     currentAmount: 350.50,
   * //     remainingAmount: 149.50,
   * //     percentageUsed: 70.1,
   * //     transactionCount: 15
   * //   }
   * // ]
   * ```
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

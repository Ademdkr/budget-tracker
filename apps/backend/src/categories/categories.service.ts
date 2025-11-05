import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Service für die Verwaltung von Kategorien
 *
 * Verwaltet alle CRUD-Operationen für Kategorien und deren Zuordnung zu Konten.
 * Kategorien sind direkt mit einem Account verknüpft und werden für die
 * Klassifizierung von Transaktionen verwendet.
 */
@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Konvertiert BigInt-Werte zu Strings für JSON-Serialisierung
   *
   * @param obj - Das Objekt mit potenziellen BigInt-Werten
   * @returns Das konvertierte Objekt mit String-Werten
   * @private
   */
  private convertBigIntsToStrings(obj: any): any {
    return JSON.parse(
      JSON.stringify(obj, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );
  }

  /**
   * Erstellt eine neue Kategorie
   *
   * Prüft, ob das zugeordnete Konto dem Benutzer gehört, bevor die Kategorie erstellt wird.
   *
   * @param data - Die Daten der zu erstellenden Kategorie
   * @param userId - Die ID des authentifizierten Benutzers
   * @returns Die erstellte Kategorie mit Account-, Budget- und Transaktions-Details
   * @throws {Error} Wenn Konto nicht gefunden oder Zugriff verweigert wird
   *
   * @example
   * ```typescript
   * const category = await create({
   *   name: 'Lebensmittel',
   *   emoji: '🛒',
   *   color: '#4CAF50',
   *   transactionType: 'EXPENSE',
   *   accountId: '1'
   * }, '1');
   * ```
   */
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

  /**
   * Ruft alle Kategorien eines Benutzers ab
   *
   * Inkludiert Account-Informationen, Budgets und Transaktionsanzahl.
   * Ergebnisse sind nach Erstellungsdatum absteigend sortiert.
   *
   * @param userId - Die ID des Benutzers
   * @returns Array aller Kategorien mit Details
   */
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

  /**
   * Ruft eine einzelne Kategorie ab
   *
   * @param id - Die ID der Kategorie
   * @param userId - Die ID des Benutzers (für Berechtigungsprüfung)
   * @returns Die Kategorie mit Account, Budgets und Transaktionen oder null
   */
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

  /**
   * Aktualisiert eine bestehende Kategorie
   *
   * @param id - Die ID der zu aktualisierenden Kategorie
   * @param data - Die zu aktualisierenden Daten
   * @param userId - Die ID des Benutzers (für Berechtigungsprüfung)
   * @returns Die aktualisierte Kategorie
   * @throws {Error} Wenn Kategorie nicht gefunden oder Zugriff verweigert wird
   */
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

  /**
   * Löscht eine Kategorie
   *
   * Verbundene Transaktionen werden auf null gesetzt (durch onDelete: SetNull).
   *
   * @param id - Die ID der zu löschenden Kategorie
   * @param userId - Die ID des Benutzers (für Berechtigungsprüfung)
   * @returns Die gelöschte Kategorie
   * @throws {Error} Wenn Kategorie nicht gefunden oder Zugriff verweigert wird
   */
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

  /**
   * Weist eine Kategorie einem Konto zu
   *
   * Aktualisiert die accountId der Kategorie, um sie dem neuen Konto zuzuordnen.
   *
   * @param categoryId - Die ID der Kategorie
   * @param accountId - Die ID des Kontos
   * @param userId - Die ID des Benutzers (für Berechtigungsprüfung)
   * @returns Die aktualisierte Kategorie mit Account-Details
   * @throws {Error} Wenn Kategorie oder Konto nicht gefunden oder Zugriff verweigert wird
   */
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

  /**
   * Entfernt eine Kategorie von einem Konto
   *
   * Da Kategorien direkt mit einem Account verknüpft sind und nicht ohne Account
   * existieren können, löscht diese Methode die Kategorie vollständig.
   *
   * @param categoryId - Die ID der Kategorie
   * @param _accountId - Die ID des Kontos (nicht verwendet)
   * @param userId - Die ID des Benutzers (für Berechtigungsprüfung)
   * @returns Die gelöschte Kategorie
   * @throws {Error} Wenn Kategorie nicht gefunden oder Zugriff verweigert wird
   */
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

  /**
   * Ruft alle Kategorien eines bestimmten Kontos ab
   *
   * Findet sowohl direkt zugeordnete Kategorien als auch Kategorien,
   * die in Transaktionen des Kontos verwendet werden. Dies ist besonders
   * wichtig für den CSV-Import-Flow.
   *
   * @param accountId - Die ID des Kontos
   * @param userId - Die ID des Benutzers (für Berechtigungsprüfung)
   * @returns Array aller relevanten Kategorien mit Budget- und Transaktionsanzahl
   * @throws {Error} Wenn Konto nicht gefunden oder Zugriff verweigert wird
   */
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

  /**
   * Ruft alle Konto-Zuordnungen einer Kategorie ab
   *
   * Da Kategorien direkt mit einem Account verknüpft sind,
   * gibt diese Methode die Kategorie mit ihrem zugeordneten Account zurück.
   *
   * @param categoryId - Die ID der Kategorie
   * @param userId - Die ID des Benutzers (für Berechtigungsprüfung)
   * @returns Array mit der Kategorie-Account-Zuordnung
   * @throws {Error} Wenn Kategorie nicht gefunden oder Zugriff verweigert wird
   */
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
   * Auto-Zuordnung von Kategorien basierend auf Transaktionen
   *
   * Findet alle Kategorien, die bereits in Transaktionen des angegebenen Kontos
   * verwendet werden. Nützlich für die automatische Kategorisierung nach CSV-Import.
   *
   * @param accountId - Die ID des Kontos
   * @param userId - Die ID des Benutzers (für Berechtigungsprüfung)
   * @returns Array aller Kategorien mit Transaktionen für dieses Konto
   * @throws {Error} Wenn Konto nicht gefunden oder Zugriff verweigert wird
   *
   * @example
   * ```typescript
   * const categories = await autoAssignCategoriesBasedOnTransactions('1', '1');
   * // [
   * //   { id: '1', name: 'Lebensmittel', transactionCount: 15 },
   * //   { id: '2', name: 'Transport', transactionCount: 8 }
   * // ]
   * ```
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

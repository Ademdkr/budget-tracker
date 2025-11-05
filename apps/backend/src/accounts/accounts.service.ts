import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

/**
 * Service für die Verwaltung von Finanzkonten
 *
 * Verwaltet alle CRUD-Operationen für Konten und berechnet Kontostände
 * basierend auf Transaktionen. Unterstützt die Aktivierung/Deaktivierung
 * von Konten und automatisches Balance-Management.
 */
@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Serialisiert ein Account-Objekt für die API-Response
   *
   * Konvertiert BigInt-IDs zu Strings und fügt Frontend-kompatible Felder hinzu.
   *
   * @param account - Das zu serialisierende Account-Objekt
   * @returns Serialisiertes Account-Objekt
   * @private
   */
  private serializeAccount(account: any) {
    return {
      id: account.id.toString(),
      name: account.name,
      type: account.type,
      balance: Number(account.initialBalance),
      currency: 'EUR',
      note: account.note,
      isActive: account.isActive,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      userId: account.userId ? account.userId.toString() : undefined,
      transactionCount: account._count?.transactions || 0,
    };
  }

  /**
   * Erstellt ein neues Konto
   *
   * Wenn das neue Konto als aktiv markiert ist, werden automatisch alle anderen
   * aktiven Konten des Benutzers deaktiviert (nur ein aktives Konto pro Benutzer).
   *
   * @param createAccountDto - Die Daten des zu erstellenden Kontos
   * @param userId - Die ID des Benutzers
   * @returns Das erstellte Konto
   */
  async create(createAccountDto: CreateAccountDto, userId: string) {
    const shouldBeActive = createAccountDto.isActive ?? true;

    // Wenn das neue Konto aktiv sein soll, deaktiviere alle anderen Konten dieses Users
    if (shouldBeActive) {
      await this.prisma.account.updateMany({
        where: {
          userId: BigInt(userId),
          isActive: true,
        },
        data: { isActive: false },
      });
    }

    const result = await this.prisma.account.create({
      data: {
        name: createAccountDto.name,
        type: createAccountDto.type || 'CHECKING',
        initialBalance: createAccountDto.balance || 0,
        note: createAccountDto.note,
        isActive: shouldBeActive,
        userId: BigInt(userId),
      },
    });

    return this.serializeAccount(result);
  }

  /**
   * Ruft alle Konten eines Benutzers ab
   *
   * @param userId - Die ID des Benutzers
   * @returns Array aller Konten des Benutzers, sortiert nach Erstellungsdatum
   */
  async findAll(userId: string) {
    console.log('🔍 findAll called with userId:', userId);

    const accounts = await this.prisma.account.findMany({
      where: { userId: BigInt(userId) },
      orderBy: { createdAt: 'desc' },
    });

    console.log('📊 findAll found accounts:', accounts.length);
    console.log(
      '📊 findAll Account names:',
      accounts.map((a) => a.name),
    );

    return accounts.map((account) => this.serializeAccount(account));
  }

  /**
   * Ruft ein einzelnes Konto mit Details ab
   *
   * Inkludiert die letzten 10 Transaktionen und die Gesamtanzahl aller Transaktionen.
   *
   * @param id - Die ID des Kontos
   * @param userId - Die ID des Benutzers (für Berechtigungsprüfung)
   * @returns Das Konto mit Transaktionen
   * @throws {NotFoundException} Wenn Konto nicht gefunden oder keine Berechtigung
   */
  async findOne(id: string, userId: string) {
    const account = await this.prisma.account.findFirst({
      where: {
        id: BigInt(id),
        userId: BigInt(userId),
      },
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
      throw new NotFoundException(
        `Account with ID ${id} not found or access denied`,
      );
    }

    return {
      ...this.serializeAccount(account),
      transactions: account.transactions.map((t) => ({
        id: t.id.toString(),
        amount: Number(t.amount),
        date: t.date,
        note: t.note,
        categoryId: t.categoryId.toString(),
        accountId: t.accountId.toString(),
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    };
  }

  /**
   * Aktualisiert ein Konto
   *
   * Wenn das Konto auf aktiv gesetzt wird, werden automatisch alle anderen
   * aktiven Konten des Benutzers deaktiviert.
   *
   * @param id - Die ID des zu aktualisierenden Kontos
   * @param updateAccountDto - Die zu aktualisierenden Daten
   * @param userId - Die ID des Benutzers (für Berechtigungsprüfung)
   * @returns Das aktualisierte Konto
   * @throws {NotFoundException} Wenn Konto nicht gefunden oder keine Berechtigung
   */
  async update(id: string, updateAccountDto: UpdateAccountDto, userId: string) {
    const account = await this.prisma.account.findFirst({
      where: {
        id: BigInt(id),
        userId: BigInt(userId),
      },
    });

    if (!account) {
      throw new NotFoundException(
        `Account with ID ${id} not found or access denied`,
      );
    }

    // Wenn das Konto auf aktiv gesetzt werden soll, deaktiviere alle anderen Konten dieses Users
    if (updateAccountDto.isActive === true && !account.isActive) {
      await this.prisma.account.updateMany({
        where: {
          userId: BigInt(userId),
          isActive: true,
          id: { not: BigInt(id) }, // Nicht das aktuell zu aktualisierende Konto
        },
        data: { isActive: false },
      });
    }

    const result = await this.prisma.account.update({
      where: { id: BigInt(id) },
      data: {
        name: updateAccountDto.name,
        type: updateAccountDto.type,
        initialBalance: updateAccountDto.balance,
        note: updateAccountDto.note,
        isActive: updateAccountDto.isActive,
      },
    });

    return this.serializeAccount(result);
  }

  /**
   * Löscht oder deaktiviert ein Konto
   *
   * Wenn das Konto Transaktionen enthält, wird es nur deaktiviert statt gelöscht,
   * um Datenintegrität zu gewährleisten.
   *
   * @param id - Die ID des zu löschenden Kontos
   * @param userId - Die ID des Benutzers (für Berechtigungsprüfung)
   * @returns Das gelöschte oder deaktivierte Konto
   * @throws {NotFoundException} Wenn Konto nicht gefunden oder keine Berechtigung
   */
  async remove(id: string, userId: string) {
    console.log(
      '🔍 AccountsService.remove called with ID:',
      id,
      'UserID:',
      userId,
    );

    const account = await this.prisma.account.findFirst({
      where: {
        id: BigInt(id),
        userId: BigInt(userId),
      },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    console.log(
      '📊 Found account for deletion:',
      account ? account.name : 'NOT FOUND',
    );

    if (!account) {
      console.log('❌ Account not found or access denied');
      throw new NotFoundException(
        `Account with ID ${id} not found or access denied`,
      );
    }

    // If account has transactions, deactivate instead of delete
    if (account._count.transactions > 0) {
      const result = await this.prisma.account.update({
        where: { id: BigInt(id) },
        data: { isActive: false },
      });
      return this.serializeAccount(result);
    }

    const result = await this.prisma.account.delete({
      where: { id: BigInt(id) },
    });

    return this.serializeAccount(result);
  }

  /**
   * Ruft Konten-Statistiken ab
   *
   * @param userId - Die ID des Benutzers
   * @returns Statistiken über Konten (Gesamtbalance, aktive/totale Anzahl)
   */
  async getStatistics(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: {
        isActive: true,
        userId: BigInt(userId),
      },
    });

    const totalBalance = accounts.reduce(
      (sum, account) => sum + Number(account.initialBalance),
      0,
    );
    const activeAccounts = accounts.length;
    const totalAccounts = await this.prisma.account.count({
      where: { userId: BigInt(userId) },
    });

    return {
      totalBalance,
      activeAccounts,
      totalAccounts,
    };
  }

  /**
   * Berechnet Kontostände neu (Legacy-Methode)
   *
   * Mit dem neuen Schema ist diese Methode nicht mehr relevant,
   * da es kein separates balance-Feld mehr gibt.
   *
   * @param userId - Die ID des Benutzers
   * @returns Array aller Konten
   * @deprecated Verwende stattdessen getAccountsWithCalculatedBalances
   */
  async recalculateAccountBalances(userId: string) {
    // Das neue Schema hat kein balance Feld mehr, nur initialBalance
    // Diese Methode ist mit dem neuen Schema nicht mehr relevant
    const accounts = await this.prisma.account.findMany({
      where: { userId: BigInt(userId) },
    });
    return accounts.map((account) => this.serializeAccount(account));
  }

  /**
   * Ruft alle Konten mit berechneten Salden ab
   *
   * Berechnet den tatsächlichen Kontostand basierend auf initialBalance und allen Transaktionen.
   * Unterscheidet zwischen Einnahmen (INCOME) und Ausgaben (EXPENSE) für detaillierte Statistiken.
   *
   * @param userId - Die ID des Benutzers
   * @returns Array aller Konten mit berechneten Salden, Einnahmen/Ausgaben und letzter Transaktion
   *
   * @example
   * ```typescript
   * const accounts = await getAccountsWithCalculatedBalances('1');
   * // [
   * //   {
   * //     id: '1',
   * //     name: 'Girokonto',
   * //     calculatedBalance: 1500.00,
   * //     totalIncome: 2000.00,
   * //     totalExpenses: 500.00,
   * //     lastTransactionDate: '2025-11-05',
   * //     transactionCount: 25
   * //   }
   * // ]
   * ```
   */
  async getAccountsWithCalculatedBalances(userId: string) {
    console.log(
      '🔍 getAccountsWithCalculatedBalances called with userId:',
      userId,
    );

    const accounts = await this.prisma.account.findMany({
      where: { userId: BigInt(userId) },
      orderBy: { createdAt: 'desc' },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
          include: {
            category: {
              select: {
                name: true,
                transactionType: true,
              },
            },
          },
        },
        _count: {
          select: { transactions: true },
        },
      },
    });

    console.log('📊 Found accounts:', accounts.length);
    console.log(
      '📊 Account IDs:',
      accounts.map((a) => ({ id: a.id.toString(), name: a.name })),
    );

    return accounts.map((account) => {
      const lastTransaction = account.transactions[0];

      // Berechne die tatsächliche Balance aus initialBalance + Transaktionen
      let calculatedBalance = Number(account.initialBalance);
      let totalIncome = 0;
      let totalExpenses = 0;

      console.log(
        `\n🔍 Berechnung für Konto: ${account.name} (ID: ${account.id})`,
      );
      console.log(`💰 Initial Balance: ${calculatedBalance}€`);

      for (const transaction of account.transactions) {
        const amount = Number(transaction.amount);
        const transactionType = transaction.category.transactionType;

        console.log(`\n📝 Transaktion:`, {
          amount: `${amount}€`,
          categoryName: transaction.category.name,
          transactionType: transactionType,
          date: transaction.date,
        });

        if (transactionType === 'INCOME') {
          calculatedBalance += amount;
          totalIncome += amount;
          console.log(
            `  ✅ INCOME: ${calculatedBalance} = ${calculatedBalance - amount} + ${amount}`,
          );
        } else if (transactionType === 'EXPENSE') {
          calculatedBalance -= amount;
          totalExpenses += amount;
          console.log(
            `  ✅ EXPENSE: ${calculatedBalance} = ${calculatedBalance + amount} - ${amount}`,
          );
        }
      }

      console.log(`\n💵 Finaler Kontostand: ${calculatedBalance}€`);
      console.log(`📊 Total Income: ${totalIncome}€`);
      console.log(`📊 Total Expenses: ${totalExpenses}€\n`);

      return {
        ...this.serializeAccount(account),
        calculatedBalance,
        totalIncome,
        totalExpenses,
        lastTransactionDate: lastTransaction?.date,
        transactionCount: account._count.transactions,
      };
    });
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../shared/services/api.service';

/**
 * Repräsentiert ein Konto
 */
export interface Account {
  /** Eindeutige Konto-ID */
  id: string;
  /** Name des Kontos */
  name: string;
  /** Kontotyp */
  type: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT' | 'CASH' | 'OTHER';
  /** Aktueller Saldo */
  balance: number;
  /** Währung (z.B. EUR, USD) */
  currency: string;
  /** Icon für Darstellung (optional) */
  icon?: string;
  /** Farbe für Darstellung (optional) */
  color?: string;
  /** Notiz zum Konto (optional) */
  note?: string;
  /** Ob Konto aktiv ist */
  isActive: boolean;
  /** Erstellungsdatum */
  createdAt?: Date | string;
  /** Letzte Änderung */
  updatedAt?: Date | string;
}

/**
 * DTO zum Erstellen eines neuen Kontos
 */
/**
 * DTO zum Erstellen eines neuen Kontos
 */
export interface CreateAccountDto {
  /** Name des Kontos */
  name: string;
  /** Kontotyp */
  type: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT' | 'CASH' | 'OTHER';
  /** Initialer Saldo */
  balance: number;
  /** Währung (optional, default: EUR) */
  currency?: string;
  /** Icon (optional) */
  icon?: string;
  /** Farbe (optional) */
  color?: string;
  /** Notiz (optional) */
  note?: string;
  /** Ob Konto aktiv ist (optional) */
  isActive?: boolean;
}

/**
 * DTO zum Aktualisieren eines Kontos
 */
/**
 * DTO zum Aktualisieren eines Kontos
 */
export interface UpdateAccountDto {
  /** Name des Kontos (optional) */
  name?: string;
  /** Kontotyp (optional) */
  type?: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT' | 'CASH' | 'OTHER';
  /** Saldo (optional) */
  balance?: number;
  /** Währung (optional) */
  currency?: string;
  /** Icon (optional) */
  icon?: string;
  /** Farbe (optional) */
  color?: string;
  /** Notiz (optional) */
  note?: string;
  /** Ob Konto aktiv ist (optional) */
  isActive?: boolean;
}

/**
 * Konto mit berechneten Salden und Transaktions-Statistiken
 */
/**
 * Konto mit berechneten Salden und Transaktions-Statistiken
 */
export interface AccountWithCalculatedBalance extends Account {
  /** Berechneter Saldo basierend auf Transaktionen */
  calculatedBalance: number;
  /** Summe aller Einnahmen */
  totalIncome: number;
  /** Summe aller Ausgaben */
  totalExpenses: number;
  /** Datum der letzten Transaktion (optional) */
  lastTransactionDate?: Date | string;
  /** Anzahl der Transaktionen */
  transactionCount: number;
  /** Liste der Transaktionen (optional) */
  transactions?: Transaction[];
}

/**
 * Repräsentiert eine Transaktion
 */
/**
 * Repräsentiert eine Transaktion
 */
export interface Transaction {
  /** Eindeutige Transaktions-ID */
  id: string;
  /** Titel der Transaktion */
  title: string;
  /** Beschreibung (optional) */
  description?: string;
  /** Betrag */
  amount: number;
  /** Typ (Einnahme oder Ausgabe) */
  type: 'INCOME' | 'EXPENSE';
  /** Transaktionsdatum */
  date: Date | string;
  /** Erstellungsdatum */
  createdAt: Date | string;
  /** Letzte Änderung */
  updatedAt: Date | string;
}

/**
 * Verknüpfung zwischen Konto und Kategorie
 */
/**
 * Verknüpfung zwischen Konto und Kategorie
 */
export interface AccountCategory {
  /** Eindeutige ID der Verknüpfung */
  id: string;
  /** Konto-ID */
  accountId: string;
  /** Kategorie-ID */
  categoryId: string;
  /** Erstellungsdatum */
  createdAt: Date | string;
  /** Kategorie-Details */
  category: {
    /** Kategorie-ID */
    id: string;
    /** Name der Kategorie */
    name: string;
    /** Icon (optional) */
    icon?: string;
    /** Farbe (optional) */
    color?: string;
    /** Beschreibung (optional) */
    description?: string;
    /** Budget-Limit (optional) */
    budgetLimit?: number;
    /** Budget-Details (optional) */
    budget?: {
      id: string;
      name: string;
    };
    /** Anzahl Transaktionen (optional) */
    _count?: {
      transactions: number;
    };
  };
}

/**
 * Accounts API Service - Verwaltung von Konten
 *
 * Service für CRUD-Operationen auf Konten, Kategorie-Zuordnungen,
 * Saldo-Berechnungen und Statistiken.
 *
 * @example
 * ```typescript
 * constructor(private accountsApi: AccountsApiService) {}
 *
 * loadAccounts() {
 *   this.accountsApi.getAll().subscribe(accounts => {
 *     console.log('Konten:', accounts);
 *   });
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class AccountsApiService {
  private api = inject(ApiService);

  /**
   * Ruft alle Konten des Benutzers ab
   *
   * @returns Observable mit Array von Accounts
   */
  getAll(): Observable<Account[]> {
    return this.api.get<Account[]>('accounts');
  }

  /**
   * Ruft ein einzelnes Konto anhand der ID ab
   *
   * @param id - Konto-ID
   * @returns Observable mit Account
   */
  getById(id: string): Observable<Account> {
    return this.api.get<Account>(`accounts/${id}`);
  }

  /**
   * Erstellt ein neues Konto
   *
   * @param dto - Konto-Daten
   * @returns Observable mit erstelltem Account
   */
  create(dto: CreateAccountDto): Observable<Account> {
    return this.api.post<Account>('accounts', dto);
  }

  /**
   * Aktualisiert ein bestehendes Konto
   *
   * @param id - Konto-ID
   * @param dto - Zu aktualisierende Felder
   * @returns Observable mit aktualisiertem Account
   */
  update(id: string, dto: UpdateAccountDto): Observable<Account> {
    return this.api.patch<Account>(`accounts/${id}`, dto);
  }

  /**
   * Löscht ein Konto
   *
   * Konten mit Transaktionen werden deaktiviert statt gelöscht.
   *
   * @param id - Konto-ID
   * @returns Observable void
   */
  delete(id: string): Observable<void> {
    console.log('🔥 AccountsApiService.delete called with ID:', id);
    console.log('🔥 DELETE URL:', `accounts/${id}`);
    return this.api.delete<void>(`accounts/${id}`);
  }

  /**
   * Ruft Konto-Statistiken ab
   *
   * @returns Observable mit Statistiken (Gesamt-Saldo, Anzahl Konten)
   */
  getStatistics(): Observable<{
    totalBalance: number;
    accountCount: number;
    activeAccounts: number;
  }> {
    return this.api
      .get<{
        totalBalance: number;
        activeAccounts: number;
        totalAccounts: number;
      }>('accounts/statistics')
      .pipe(
        map((stats) => ({
          totalBalance: stats.totalBalance,
          accountCount: stats.totalAccounts,
          activeAccounts: stats.activeAccounts,
        })),
      );
  }

  /**
   * Ruft Konten mit berechneten Salden ab
   *
   * Berechnet Salden basierend auf tatsächlichen Transaktionen
   * statt gespeichertem Saldo.
   *
   * @returns Observable mit Array von AccountWithCalculatedBalance
   */
  getAccountsWithCalculatedBalances(): Observable<AccountWithCalculatedBalance[]> {
    return this.api.get<AccountWithCalculatedBalance[]>('accounts/with-balances');
  }

  /**
   * Berechnet alle Konto-Salden neu basierend auf Transaktionen
   *
   * Nützlich nach CSV-Import oder manuellen Korrekturen.
   *
   * @returns Observable mit Array von aktualisierten Accounts
   */
  recalculateAccountBalances(): Observable<Account[]> {
    return this.api.post<Account[]>('accounts/recalculate-balances', {});
  }

  /**
   * Weist einem Konto eine Kategorie zu
   *
   * @param accountId - Konto-ID
   * @param categoryId - Kategorie-ID
   * @returns Observable mit AccountCategory-Verknüpfung
   */
  assignCategory(accountId: string, categoryId: string): Observable<AccountCategory> {
    return this.api.post<AccountCategory>(`accounts/${accountId}/categories/${categoryId}`, {});
  }

  /**
   * Entfernt Kategorie-Zuordnung von Konto
   *
   * @param accountId - Konto-ID
   * @param categoryId - Kategorie-ID
   * @returns Observable void
   */
  removeCategory(accountId: string, categoryId: string): Observable<void> {
    return this.api.delete<void>(`accounts/${accountId}/categories/${categoryId}`);
  }

  /**
   * Ruft alle zugeordneten Kategorien eines Kontos ab
   *
   * @param accountId - Konto-ID
   * @returns Observable mit Array von AccountCategory
   */
  getAssignedCategories(accountId: string): Observable<AccountCategory[]> {
    return this.api.get<AccountCategory[]>(`accounts/${accountId}/categories`);
  }

  /**
   * Setzt Konto als aktiv (deaktiviert alle anderen Konten)
   *
   * @param accountId - Konto-ID
   * @returns Observable mit aktualisiertem Account
   */
  setActiveAccount(accountId: string): Observable<Account> {
    return this.update(accountId, { isActive: true });
  }

  /**
   * Ruft das aktuell aktive Konto ab
   *
   * @returns Observable mit aktivem Account oder null
   */
  getActiveAccount(): Observable<Account | null> {
    return this.getAll().pipe(
      map((accounts) => accounts.find((account) => account.isActive) || null),
    );
  }
}

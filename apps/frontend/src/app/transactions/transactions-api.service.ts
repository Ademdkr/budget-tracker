import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../shared/services/api.service';

/**
 * Transaktions-Schnittstelle
 */
export interface Transaction {
  /** Eindeutige Transaktions-ID */
  id: string;
  /** Transaktions-Titel (optional) */
  title?: string;
  /** Beschreibung (Backend-Feldname) */
  description?: string;
  /** Transaktionsdatum */
  date: Date | string;
  /** Transaktionsbetrag */
  amount: number;
  /** Kategoriename (normalisiert für UI-Verwendung) */
  category?: string;
  /** Kategorie-ID */
  categoryId?: string;
  /** Kategorie-Emoji */
  categoryEmoji?: string;
  /** Budget-ID zur Filterung nach Budget */
  budgetId?: string;
  /** Kontoname */
  account?: string;
  /** Konto-ID */
  accountId?: string;
  /** Notiz (Alias für description) */
  note?: string;
  /** Transaktionstyp (Backend verwendet Großbuchstaben-Enum) */
  type: 'INCOME' | 'EXPENSE';
  /** Erstellungsdatum */
  createdAt?: Date | string;
  /** Aktualisierungsdatum */
  updatedAt?: Date | string;
}

/**
 * DTO zum Erstellen einer Transaktion
 */
/**
 * DTO zum Erstellen einer Transaktion
 */
export interface CreateTransactionDto {
  /** Titel (optional) */
  title?: string;
  /** Beschreibung (optional) */
  description?: string;
  /** Transaktionsdatum (erforderlich) */
  date: Date | string;
  /** Betrag (erforderlich) */
  amount: number;
  /** Kategorie-ID (erforderlich) */
  categoryId: string;
  /** Konto-ID (erforderlich) */
  accountId: string;
  /** Transaktionstyp (erforderlich) */
  type: 'INCOME' | 'EXPENSE';
}

/**
 * DTO zum Aktualisieren einer Transaktion
 */
/**
 * DTO zum Aktualisieren einer Transaktion
 */
export interface UpdateTransactionDto {
  /** Titel (optional) */
  title?: string;
  /** Beschreibung (optional) */
  description?: string;
  /** Datum (optional) */
  date?: Date | string;
  /** Betrag (optional) */
  amount?: number;
  /** Kategorie-ID (optional) */
  categoryId?: string;
  /** Konto-ID (optional) */
  accountId?: string;
  /** Transaktionstyp (optional) */
  type?: 'INCOME' | 'EXPENSE';
}

/**
 * Filter-Optionen für Transaktionsabfragen
 */
/**
 * Filter-Optionen für Transaktionsabfragen
 */
export interface TransactionFilters {
  /** Startdatum für Zeitraumfilter */
  startDate?: Date | string;
  /** Enddatum für Zeitraumfilter */
  endDate?: Date | string;
  /** Transaktionstyp-Filter */
  type?: 'INCOME' | 'EXPENSE';
  /** Kategorie-ID-Filter */
  categoryId?: string;
  /** Konto-ID-Filter */
  accountId?: string;
  /** Minimalbetrag */
  minAmount?: number;
  /** Maximalbetrag */
  maxAmount?: number;
}

/**
 * Transaktions-API-Service
 *
 * Verwaltet alle HTTP-Anfragen für Transaktionen (CRUD-Operationen).
 * Transformiert Backend-Antworten in Frontend-kompatible Transaction-Objekte
 * mit normalisierten Kategorie-Daten und Date-Objekten.
 *
 * @example
 * ```typescript
 * // Alle Transaktionen eines Kontos abrufen
 * this.transactionsApi.getAll({ accountId: '123' }).subscribe(transactions => {
 *   console.log(transactions);
 * });
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class TransactionsApiService {
  /** API-Service für HTTP-Anfragen */
  private api = inject(ApiService);

  /**
   * Ruft alle Transaktionen mit optionalen Filtern ab
   *
   * Transformiert Backend-Antworten und normalisiert Kategorie-Daten.
   * Konvertiert String-Datum in Date-Objekte.
   *
   * @param filters - Optionale Filter-Parameter (accountId, type, dateRange, etc.)
   * @returns Observable mit Array von Transaktionen
   */
  getAll(filters?: TransactionFilters): Observable<Transaction[]> {
    let endpoint = 'transactions';
    const params = new URLSearchParams();

    if (filters?.accountId) {
      params.append('accountId', filters.accountId);
    }

    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    return this.api.get<unknown[]>(endpoint).pipe(
      map((transactions) =>
        transactions.map((tRaw) => {
          type RawTxn = {
            categoryId?: string;
            budgetId?: string;
            category?: { id?: string; name?: string } | string | null;
            date: string | Date;
          } & Record<string, unknown>;
          const t = tRaw as RawTxn;
          const catId =
            t.categoryId ??
            (typeof t.category === 'object' && t.category ? t.category.id : undefined);
          const catName =
            typeof t.category === 'string'
              ? t.category
              : typeof t.category === 'object' && t.category
                ? t.category.name
                : undefined;
          const legacyCategory = typeof t.category === 'string' ? t.category : undefined;
          return {
            ...(t as object),
            category: catName ?? legacyCategory,
            categoryId: catId,
            budgetId: t.budgetId,
            date: new Date(t.date),
          } as Transaction;
        }),
      ),
    );
  }

  /**
   * Ruft einzelne Transaktion nach ID ab
   *
   * Transformiert Backend-Antwort und normalisiert Kategorie-Daten.
   *
   * @param id - Transaktions-ID
   * @returns Observable mit Transaction-Objekt
   */
  getById(id: string): Observable<Transaction> {
    return this.api.get<unknown>(`transactions/${id}`).pipe(
      map((tRaw) => {
        type RawTxn = {
          categoryId?: string;
          budgetId?: string;
          category?: { id?: string; name?: string } | string | null;
          date: string | Date;
        } & Record<string, unknown>;
        const t = tRaw as RawTxn;
        const catId =
          t.categoryId ??
          (typeof t.category === 'object' && t.category ? t.category.id : undefined);
        const catName =
          typeof t.category === 'string'
            ? t.category
            : typeof t.category === 'object' && t.category
              ? t.category.name
              : undefined;
        const legacyCategory = typeof t.category === 'string' ? t.category : undefined;
        return {
          ...(t as object),
          category: catName ?? legacyCategory,
          categoryId: catId,
          budgetId: t.budgetId,
          date: new Date(t.date),
        } as Transaction;
      }),
    );
  }

  /**
   * Erstellt neue Transaktion
   *
   * @param dto - Transaktionsdaten zum Erstellen
   * @returns Observable mit erstellter Transaction
   */
  create(dto: CreateTransactionDto): Observable<Transaction> {
    return this.api.post<unknown>('transactions', dto).pipe(
      map((tRaw) => {
        type RawTxn = {
          categoryId?: string;
          budgetId?: string;
          category?: { id?: string; name?: string } | string | null;
          date: string | Date;
        } & Record<string, unknown>;
        const t = tRaw as RawTxn;
        const catId =
          t.categoryId ??
          (typeof t.category === 'object' && t.category ? t.category.id : undefined);
        const catName =
          typeof t.category === 'string'
            ? t.category
            : typeof t.category === 'object' && t.category
              ? t.category.name
              : undefined;
        const legacyCategory = typeof t.category === 'string' ? t.category : undefined;
        return {
          ...(t as object),
          category: catName ?? legacyCategory,
          categoryId: catId,
          budgetId: t.budgetId,
          date: new Date(t.date),
        } as Transaction;
      }),
    );
  }

  /**
   * Aktualisiert bestehende Transaktion
   *
   * @param id - Transaktions-ID
   * @param dto - Zu aktualisierende Felder
   * @returns Observable mit aktualisierter Transaction
   */
  update(id: string, dto: UpdateTransactionDto): Observable<Transaction> {
    return this.api.patch<unknown>(`transactions/${id}`, dto).pipe(
      map((tRaw) => {
        type RawTxn = {
          categoryId?: string;
          budgetId?: string;
          category?: { id?: string; name?: string } | string | null;
          date: string | Date;
        } & Record<string, unknown>;
        const t = tRaw as RawTxn;
        const catId =
          t.categoryId ??
          (typeof t.category === 'object' && t.category ? t.category.id : undefined);
        const catName =
          typeof t.category === 'string'
            ? t.category
            : typeof t.category === 'object' && t.category
              ? t.category.name
              : undefined;
        const legacyCategory = typeof t.category === 'string' ? t.category : undefined;
        return {
          ...(t as object),
          category: catName ?? legacyCategory,
          categoryId: catId,
          budgetId: t.budgetId,
          date: new Date(t.date),
        } as Transaction;
      }),
    );
  }

  /**
   * Löscht Transaktion
   *
   * @param id - Transaktions-ID
   * @returns Observable ohne Rückgabewert
   */
  delete(id: string): Observable<void> {
    return this.api.delete<void>(`transactions/${id}`);
  }

  /**
   * Get transaction statistics
   */
  // ...existing code...
}

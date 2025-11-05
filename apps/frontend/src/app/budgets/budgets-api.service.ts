import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../shared/services/api.service';

/**
 * Budget-Schnittstelle
 */
export interface Budget {
  /** Eindeutige Budget-ID */
  id: string;
  /** Kategorie-ID */
  categoryId: string;
  /** Jahr des Budgets */
  year: number;
  /** Monat des Budgets (1-12) */
  month: number;
  /** Gesamtbetrag des Budgets */
  totalAmount: number;
  /** Erstellungsdatum */
  createdAt?: Date | string;
  /** Aktualisierungsdatum */
  updatedAt?: Date | string;
  /** Zugehörige Kategorie-Informationen */
  category?: {
    /** Kategorie-ID */
    id: string;
    /** Kategoriename */
    name: string;
    /** Kategorie-Emoji */
    emoji?: string;
    /** Kategorie-Farbe */
    color?: string;
  };
}

/**
 * DTO zum Erstellen eines Budgets
 */
/**
 * DTO zum Erstellen eines Budgets
 */
export interface CreateBudgetDto {
  /** Kategorie-ID (erforderlich) */
  categoryId: string;
  /** Jahr (erforderlich) */
  year: number;
  /** Monat 1-12 (erforderlich) */
  month: number;
  /** Gesamtbetrag (erforderlich) */
  totalAmount: number;
}

/**
 * DTO zum Aktualisieren eines Budgets
 */
/**
 * DTO zum Aktualisieren eines Budgets
 */
export interface UpdateBudgetDto {
  /** Gesamtbetrag (optional) */
  totalAmount?: number;
}

/**
 * Budget mit Statistiken-Schnittstelle
 */
/**
 * Budget mit Statistiken-Schnittstelle
 */
export interface BudgetWithStats {
  /** Budget-ID */
  id: string;
  /** Kategorie-ID */
  categoryId: string;
  /** Kategoriename */
  categoryName: string;
  /** Kategorie-Icon */
  categoryIcon: string;
  /** Kategorie-Farbe */
  categoryColor: string;
  /** Zielbetrag */
  targetAmount: number;
  /** Aktueller ausgegebener Betrag */
  currentAmount: number;
  /** Verbleibender Betrag */
  remainingAmount: number;
  /** Prozentsatz der Verwendung */
  percentageUsed: number;
  /** Anzahl der Transaktionen */
  transactionCount: number;
  /** Datum der letzten Transaktion */
  lastTransactionDate?: Date | string;
  /** Monat */
  month: number;
  /** Jahr */
  year: number;
  /** Erstellungsdatum */
  createdAt: Date | string;
  /** Aktualisierungsdatum */
  updatedAt: Date | string;
  /** Gibt an, ob Budget aktiv ist */
  isActive: boolean;
}

/**
 * Budgets-API-Service
 *
 * Verwaltet alle HTTP-Anfragen für Budgets (CRUD-Operationen).
 * Bietet zusätzlich Methode zum Abrufen von Budgets mit berechneten Statistiken.
 *
 * @example
 * ```typescript
 * // Budgets mit Statistiken für bestimmten Monat abrufen
 * this.budgetsApi.getBudgetsWithStats(2025, 11, accountId).subscribe(budgets => {
 *   console.log(budgets);
 * });
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class BudgetsApiService {
  /** API-Service für HTTP-Anfragen */
  private api = inject(ApiService);

  /**
   * Ruft alle Budgets ab
   *
   * @returns Observable mit Array von Budgets
   */
  getAll(): Observable<Budget[]> {
    return this.api.get<Budget[]>('budgets');
  }

  /**
   * Ruft einzelnes Budget nach ID ab
   *
   * @param id - Budget-ID
   * @returns Observable mit Budget-Objekt
   */
  getById(id: string): Observable<Budget> {
    return this.api.get<Budget>(`budgets/${id}`);
  }

  /**
   * Erstellt neues Budget
   *
   * @param dto - Budget-Daten zum Erstellen
   * @returns Observable mit erstelltem Budget
   */
  create(dto: CreateBudgetDto): Observable<Budget> {
    return this.api.post<Budget>('budgets', dto);
  }

  /**
   * Aktualisiert bestehendes Budget
   *
   * @param id - Budget-ID
   * @param dto - Zu aktualisierende Felder
   * @returns Observable mit aktualisiertem Budget
   */
  update(id: string, dto: UpdateBudgetDto): Observable<Budget> {
    return this.api.patch<Budget>(`budgets/${id}`, dto);
  }

  /**
   * Löscht Budget
   *
   * @param id - Budget-ID
   * @returns Observable ohne Rückgabewert
   */
  delete(id: string): Observable<void> {
    return this.api.delete<void>(`budgets/${id}`);
  }

  /**
   * Ruft Budgets mit berechneten Statistiken ab
   *
   * Holt Budgets mit aktuellen Ausgaben, verbleibendem Betrag und
   * Nutzungsprozentsatz für einen bestimmten Zeitraum und Konto.
   *
   * @param year - Jahr zur Filterung (optional)
   * @param month - Monat zur Filterung (optional)
   * @param accountId - Konto-ID zur Filterung (optional)
   * @returns Observable mit Array von BudgetWithStats
   */
  getBudgetsWithStats(
    year?: number,
    month?: number,
    accountId?: string,
  ): Observable<BudgetWithStats[]> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    if (accountId) params.append('accountId', accountId);

    const queryString = params.toString();
    const url = queryString ? `budgets/with-stats?${queryString}` : 'budgets/with-stats';

    return this.api.get<BudgetWithStats[]>(url);
  }
}

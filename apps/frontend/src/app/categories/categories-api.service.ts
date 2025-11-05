import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../shared/services/api.service';

/**
 * Repräsentiert eine Kategorie
 */
export interface Category {
  /** Eindeutige Kategorie-ID */
  id: string;
  /** Name der Kategorie */
  name: string;
  /** Konto-ID (Foreign Key) */
  accountId?: string;
  /** Icon-Name vom Backend */
  icon?: string;
  /** Emoji-Alias für Icon (Kompatibilität) */
  emoji?: string;
  /** Farbe (Hex) */
  color?: string;
  /** Typ (Frontend-Format) */
  type?: 'income' | 'expense' | 'both';
  /** Transaktionstyp (Backend-Format) */
  transactionType?: 'INCOME' | 'EXPENSE';
  /** Beschreibung */
  description?: string;
  /** Budget-Limit */
  budgetLimit?: number;
  /** Budget-ID */
  budgetId?: string;
  /** Zugeordnetes Konto */
  account?: {
    id: string;
    name: string;
    type?: string;
    icon?: string;
    color?: string;
  };
  /** Zugeordnetes Budget */
  budget?: {
    id: string;
    name: string;
  };
  /** Legacy Konto-Zuordnungen (wird entfernt) */
  accounts?: CategoryAccount[];
  /** Anzahl Transaktionen */
  _count?: {
    transactions: number;
  };
  /** Erstellungsdatum */
  createdAt?: Date | string;
  /** Letzte Änderung */
  updatedAt?: Date | string;
}

/**
 * Verknüpfung zwischen Kategorie und Konto
 */
/**
 * Verknüpfung zwischen Kategorie und Konto
 */
export interface CategoryAccount {
  /** Eindeutige ID der Verknüpfung */
  id: string;
  /** Kategorie-ID */
  categoryId: string;
  /** Konto-ID */
  accountId: string;
  /** Erstellungsdatum */
  createdAt: Date | string;
  /** Konto-Details */
  account: {
    id: string;
    name: string;
    type: string;
    icon?: string;
    color?: string;
  };
}

/**
 * DTO zum Erstellen einer Kategorie
 */
export interface CreateCategoryDto {
  /** Name der Kategorie */
  name: string;
  /** Beschreibung (optional) */
  description?: string;
  /** Farbe (optional) */
  color?: string;
  /** Emoji (optional) */
  emoji?: string;
  /** Transaktionstyp (erforderlich) */
  transactionType: 'INCOME' | 'EXPENSE';
  /** Konto-ID (erforderlich) */
  accountId: string;
}

/**
 * DTO zum Aktualisieren einer Kategorie
 */
/**
 * DTO zum Aktualisieren einer Kategorie
 */
export interface UpdateCategoryDto {
  /** Name (optional) */
  name?: string;
  /** Beschreibung (optional) */
  description?: string;
  /** Farbe (optional) */
  color?: string;
  /** Emoji (optional) */
  emoji?: string;
  /** Transaktionstyp (optional) */
  transactionType?: 'INCOME' | 'EXPENSE';
}

/**
 * Categories API Service - Verwaltung von Kategorien
 *
 * Service für CRUD-Operationen auf Kategorien, Konto-Zuordnungen
 * und Auto-Assignment basierend auf Transaktionen.
 *
 * @example
 * ```typescript
 * constructor(private categoriesApi: CategoriesApiService) {}
 *
 * loadCategories() {
 *   this.categoriesApi.getAll('account-id').subscribe(categories => {
 *     console.log('Kategorien:', categories);
 *   });
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class CategoriesApiService {
  private api = inject(ApiService);

  /**
   * Ruft alle Kategorien ab, optional gefiltert nach Konto
   *
   * @param accountId - Optional: Konto-ID zum Filtern
   * @returns Observable mit Kategorie-Array
   */
  getAll(accountId?: string): Observable<Category[]> {
    let params = new HttpParams();
    if (accountId) {
      params = params.set('accountId', accountId);
    }
    return this.api.get<Category[]>('categories', params);
  }

  /**
   * Ruft einzelne Kategorie anhand ID ab
   *
   * @param id - Kategorie-ID
   * @returns Observable mit Category
   */
  getById(id: string): Observable<Category> {
    return this.api.get<Category>(`categories/${id}`);
  }

  /**
   * Erstellt neue Kategorie
   *
   * @param dto - Kategorie-Daten
   * @returns Observable mit erstellter Category
   */
  create(dto: CreateCategoryDto): Observable<Category> {
    return this.api.post<Category>('categories', dto);
  }

  /**
   * Aktualisiert bestehende Kategorie
   *
   * @param id - Kategorie-ID
   * @param dto - Zu aktualisierende Felder
   * @returns Observable mit aktualisierter Category
   */
  update(id: string, dto: UpdateCategoryDto): Observable<Category> {
    return this.api.put<Category>(`categories/${id}`, dto);
  }

  /**
   * Löscht Kategorie
   *
   * @param id - Kategorie-ID
   * @returns Observable ohne Rückgabewert
   */
  delete(id: string): Observable<void> {
    return this.api.delete<Category>(`categories/${id}`).pipe(
      map(() => void 0), // Response ignorieren und void zurückgeben
    );
  }

  // Account-Category Relationship Management

  /**
   * Weist Kategorie einem Konto zu
   *
   * @param categoryId - Kategorie-ID
   * @param accountId - Konto-ID
   * @returns Observable mit CategoryAccount-Zuordnung
   */
  assignToAccount(categoryId: string, accountId: string): Observable<CategoryAccount> {
    return this.api.post<CategoryAccount>(`categories/${categoryId}/accounts/${accountId}`, {});
  }

  /**
   * Entfernt Kategorie von einem Konto
   *
   * @param categoryId - Kategorie-ID
   * @param accountId - Konto-ID
   * @returns Observable ohne Rückgabewert
   */
  removeFromAccount(categoryId: string, accountId: string): Observable<void> {
    return this.api.delete<void>(`categories/${categoryId}/accounts/${accountId}`);
  }

  /**
   * Ruft alle Konto-Zuordnungen für eine Kategorie ab
   *
   * @param categoryId - Kategorie-ID
   * @returns Observable mit Array von CategoryAccount-Zuordnungen
   */
  getAccountAssignments(categoryId: string): Observable<CategoryAccount[]> {
    return this.api.get<CategoryAccount[]>(`categories/${categoryId}/accounts`);
  }

  /**
   * Ruft Kategorien gefiltert nach Konto ab
   *
   * @param accountId - Konto-ID zur Filterung
   * @returns Observable mit Array von Kategorien des angegebenen Kontos
   */
  getByAccount(accountId: string): Observable<Category[]> {
    return this.getAll(accountId);
  }

  /**
   * Weist Kategorien automatisch einem Konto zu basierend auf vorhandenen Transaktionen
   *
   * Analysiert die bestehenden Transaktionen eines Kontos und weist automatisch
   * passende Kategorien zu, um die manuelle Konfiguration zu erleichtern.
   *
   * @param accountId - Konto-ID für die Auto-Zuweisung
   * @returns Observable mit Array von neu zugewiesenen CategoryAccount-Einträgen
   */
  autoAssignCategoriesBasedOnTransactions(accountId: string): Observable<CategoryAccount[]> {
    return this.api.post<CategoryAccount[]>(`categories/auto-assign/${accountId}`, {});
  }
}

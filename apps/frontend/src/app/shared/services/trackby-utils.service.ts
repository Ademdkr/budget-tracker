import { Injectable } from '@angular/core';

/**
 * Zentrale TrackBy-Funktionen für optimierte ngFor-Performance
 * Eliminiert Wiederholungen in allen Komponenten
 */
@Injectable({
  providedIn: 'root'
})
export class TrackByUtilsService {

  /**
   * TrackBy für Objekte mit id-Property
   */
  trackById<T extends { id: string | number }>(index: number, item: T): string | number {
    return item.id;
  }

  /**
   * TrackBy für Transaktionen
   */
  trackByTransactionId(index: number, transaction: { id: string }): string {
    return transaction.id;
  }

  /**
   * TrackBy für Budgets
   */
  trackByBudgetId(index: number, budget: { id: string }): string {
    return budget.id;
  }

  /**
   * TrackBy für Kategorien
   */
  trackByCategoryId(index: number, category: { id: string }): string {
    return category.id;
  }

  /**
   * TrackBy für Accounts
   */
  trackByAccountId(index: number, account: { id: string }): string {
    return account.id;
  }

  /**
   * TrackBy für KPIs/Dashboard-Items
   */
  trackByKPITitle(index: number, kpi: { title?: string; label?: string }): string {
    return kpi.title || kpi.label || index.toString();
  }

  /**
   * TrackBy für Array-Items mit name-Property
   */
  trackByName<T extends { name: string }>(index: number, item: T): string {
    return item.name;
  }

  /**
   * TrackBy für Array-Items mit value-Property
   */
  trackByValue<T extends { value: string | number }>(index: number, item: T): string | number {
    return item.value;
  }

  /**
   * Fallback TrackBy für Index
   */
  trackByIndex(index: number): number {
    return index;
  }

  /**
   * TrackBy für String-Arrays
   */
  trackByString(index: number, item: string): string {
    return item;
  }

  /**
   * TrackBy für Objekte mit kombinierter ID (z.B. category-month Kombinationen)
   */
  trackByCombinedId<T extends { categoryId?: string; month?: number; year?: number }>(
    index: number, 
    item: T
  ): string {
    if (item.categoryId && item.month !== undefined && item.year !== undefined) {
      return `${item.categoryId}-${item.year}-${item.month}`;
    }
    return index.toString();
  }
}
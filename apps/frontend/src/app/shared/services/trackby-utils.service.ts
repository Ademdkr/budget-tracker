import { Injectable } from '@angular/core';

/**
 * Zentraler Service für TrackBy-Funktionen zur ngFor-Performance-Optimierung.
 *
 * Bietet wiederverwendbare TrackBy-Funktionen für alle Komponenten, die
 * *ngFor verwenden. TrackBy-Funktionen helfen Angular zu erkennen, welche
 * Listenelemente sich geändert haben, und minimieren so DOM-Updates.
 *
 * Vorteile:
 * - Eliminiert Code-Wiederholungen
 * - Verbessert Performance bei Listen-Rendering
 * - Konsistente TrackBy-Logik in der ganzen Anwendung
 * - Zentrale Wartung
 *
 * @example
 * // In Komponente injizieren
 * protected trackByUtils = inject(TrackByUtilsService);
 *
 * // TrackBy-Funktion binden
 * trackByTransaction = this.trackByUtils.trackByTransactionId.bind(this.trackByUtils);
 *
 * // Im Template verwenden
 * <div *ngFor="let item of items; trackBy: trackByTransaction">
 */
@Injectable({
  providedIn: 'root',
})
export class TrackByUtilsService {
  /**
   * TrackBy für Objekte mit id-Property.
   *
   * Generische Funktion für alle Objekte, die eine id-Property haben.
   * Funktioniert mit String- oder Number-IDs.
   *
   * @template T - Objekttyp mit id-Property
   * @param {number} index - Array-Index (wird nicht verwendet)
   * @param {T} item - Das zu trackende Item
   * @returns {string | number} Die ID des Items
   *
   * @example
   * trackById = this.trackByUtils.trackById.bind(this.trackByUtils);
   */
  trackById<T extends { id: string | number }>(index: number, item: T): string | number {
    return item.id;
  }

  /**
   * TrackBy für Transaktionen.
   *
   * Spezialisierte Funktion für Transaction-Objekte.
   *
   * @param {number} index - Array-Index (wird nicht verwendet)
   * @param {Object} transaction - Die Transaction mit id
   * @returns {string} Die Transaction-ID
   */
  trackByTransactionId(index: number, transaction: { id: string }): string {
    return transaction.id;
  }

  /**
   * TrackBy für Budgets.
   *
   * Spezialisierte Funktion für Budget-Objekte.
   *
   * @param {number} index - Array-Index (wird nicht verwendet)
   * @param {Object} budget - Das Budget mit id
   * @returns {string} Die Budget-ID
   */
  trackByBudgetId(index: number, budget: { id: string }): string {
    return budget.id;
  }

  /**
   * TrackBy für Kategorien.
   *
   * Spezialisierte Funktion für Category-Objekte.
   *
   * @param {number} index - Array-Index (wird nicht verwendet)
   * @param {Object} category - Die Kategorie mit id
   * @returns {string} Die Kategorie-ID
   */
  trackByCategoryId(index: number, category: { id: string }): string {
    return category.id;
  }

  /**
   * TrackBy für Konten.
   *
   * Spezialisierte Funktion für Account-Objekte.
   *
   * @param {number} index - Array-Index (wird nicht verwendet)
   * @param {Object} account - Das Konto mit id
   * @returns {string} Die Konto-ID
   */
  trackByAccountId(index: number, account: { id: string }): string {
    return account.id;
  }

  /**
   * TrackBy für KPIs/Dashboard-Items.
   *
   * Verwendet title oder label als Tracking-Key, fällt auf Index zurück
   * wenn beides nicht vorhanden ist.
   *
   * @param {number} index - Array-Index (Fallback)
   * @param {Object} kpi - KPI-Objekt mit title oder label
   * @returns {string} Der Tracking-Key
   */
  trackByKPITitle(index: number, kpi: { title?: string; label?: string }): string {
    return kpi.title || kpi.label || index.toString();
  }

  /**
   * TrackBy für Array-Items mit name-Property.
   *
   * Generische Funktion für Objekte mit name-Property.
   *
   * @template T - Objekttyp mit name-Property
   * @param {number} index - Array-Index (wird nicht verwendet)
   * @param {T} item - Das Item mit name
   * @returns {string} Der Name des Items
   */
  trackByName<T extends { name: string }>(index: number, item: T): string {
    return item.name;
  }

  /**
   * TrackBy für Array-Items mit value-Property.
   *
   * Generische Funktion für Objekte mit value-Property.
   * Funktioniert mit String- oder Number-Values.
   *
   * @template T - Objekttyp mit value-Property
   * @param {number} index - Array-Index (wird nicht verwendet)
   * @param {T} item - Das Item mit value
   * @returns {string | number} Der Wert des Items
   */
  trackByValue<T extends { value: string | number }>(index: number, item: T): string | number {
    return item.value;
  }

  /**
   * Fallback TrackBy für Array-Index.
   *
   * Sollte nur verwendet werden, wenn keine bessere Alternative existiert.
   * Warnung: Führt zu vollständigem DOM-Neuaufbau bei Sortierungen/Filtern.
   *
   * @param {number} index - Array-Index
   * @returns {number} Der Array-Index
   */
  trackByIndex(index: number): number {
    return index;
  }

  /**
   * TrackBy für String-Arrays.
   *
   * Verwendet den String-Wert selbst als Tracking-Key.
   *
   * @param {number} index - Array-Index (wird nicht verwendet)
   * @param {string} item - Der String-Wert
   * @returns {string} Der String selbst
   *
   * @example
   * // Für Arrays wie ['Option 1', 'Option 2', 'Option 3']
   * trackByString = this.trackByUtils.trackByString.bind(this.trackByUtils);
   */
  trackByString(index: number, item: string): string {
    return item;
  }

  /**
   * TrackBy für Objekte mit kombinierter ID.
   *
   * Erstellt einen zusammengesetzten Tracking-Key aus categoryId, year und month.
   * Nützlich für Budget-Zeitraum-Kombinationen oder ähnliche verschachtelte Daten.
   * Fällt auf Index zurück, wenn die Properties nicht vorhanden sind.
   *
   * @template T - Objekttyp mit categoryId, month, year
   * @param {number} index - Array-Index (Fallback)
   * @param {T} item - Das Item mit categoryId, month, year
   * @returns {string} Kombinierter Key (z.B. "cat-1-2024-5") oder Index als String
   *
   * @example
   * // Für Budget-Listen mit Kategorie-Monats-Kombinationen
   * trackByCombined = this.trackByUtils.trackByCombinedId.bind(this.trackByUtils);
   */
  trackByCombinedId<T extends { categoryId?: string; month?: number; year?: number }>(
    index: number,
    item: T,
  ): string {
    if (item.categoryId && item.month !== undefined && item.year !== undefined) {
      return `${item.categoryId}-${item.year}-${item.month}`;
    }
    return index.toString();
  }
}

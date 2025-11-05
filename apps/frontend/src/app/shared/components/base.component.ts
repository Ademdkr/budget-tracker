import { Component, OnDestroy, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { FormatUtilsService } from '../services/format-utils.service';
import { TrackByUtilsService } from '../services/trackby-utils.service';
import { LoadingStateService } from '../services/loading-state.service';

/**
 * Basis-Komponente mit gemeinsamen Funktionen.
 *
 * Abstrakte Basisklasse, die gemeinsame Funktionalität für alle Komponenten
 * bereitstellt und Code-Wiederholungen eliminiert. Stellt Services und
 * Hilfsmethoden zur Verfügung, die häufig benötigt werden.
 *
 * Features:
 * - Automatisches Subscription-Management mit destroy$
 * - Zugriff auf Format-Utils (Währung, Datum, etc.)
 * - Zugriff auf TrackBy-Utils für Performance-Optimierung
 * - Loading-State-Management
 * - Gemeinsame Hilfsmethoden (safeGet, debounce, etc.)
 * - Automatisches Cleanup in ngOnDestroy
 *
 * Verwendung:
 * - Komponente muss von BaseComponent erben
 * - componentKey muss definiert werden
 * - Optional: retry()-Methode implementieren
 *
 * @example
 * export class TransactionsComponent extends BaseComponent {
 *   protected componentKey = 'transactions';
 *
 *   ngOnInit() {
 *     this.initializeLoadingState();
 *     this.setLoading();
 *     // Daten laden...
 *   }
 *
 *   retry() {
 *     this.loadData();
 *   }
 * }
 */
@Component({
  template: '',
})
export abstract class BaseComponent implements OnDestroy {
  /** Subject für Subscription-Cleanup */
  protected destroy$ = new Subject<void>();

  // Injected Services
  /** Format-Utils für Währung, Datum, etc. */
  protected formatUtils = inject(FormatUtilsService);

  /** TrackBy-Utils für ngFor-Performance */
  protected trackByUtils = inject(TrackByUtilsService);

  /** Loading-State-Service für Komponenten-State */
  protected loadingStateService = inject(LoadingStateService);

  // Komponenten-spezifischer State-Key
  /** Eindeutiger Key für diese Komponente (muss in abgeleiteter Klasse definiert werden) */
  protected abstract componentKey: string;

  /**
   * Konstruktor der Basiskomponente.
   *
   * Hinweis: State-Initialisierung sollte in ngOnInit() erfolgen.
   */
  constructor() {
    // State-Initialisierung wird in ngOnInit gemacht
  }

  /**
   * Initialisiert den Loading-State für diese Komponente.
   *
   * Sollte in ngOnInit() der abgeleiteten Komponente aufgerufen werden.
   *
   * @protected
   */
  protected initializeLoadingState(): void {
    this.loadingStateService.initializeState(this.componentKey);
  }

  /**
   * Angular Lifecycle Hook - wird beim Zerstören der Komponente aufgerufen.
   *
   * Beendet alle Subscriptions über destroy$ und räumt den Loading-State auf.
   *
   * @returns {void}
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.loadingStateService.cleanup(this.componentKey);
  }

  // === Formatting Methods ===

  /**
   * Formatiert einen Betrag als Währung.
   *
   * @param {number} amount - Der zu formatierende Betrag
   * @returns {string} Formatierter Währungsbetrag (z.B. "1.234,56 €")
   */
  formatCurrency(amount: number): string {
    return this.formatUtils.formatCurrency(amount);
  }

  /**
   * Formatiert ein Datum im deutschen Format.
   *
   * @param {Date | string | undefined} date - Das zu formatierende Datum
   * @returns {string} Formatiertes Datum (z.B. "31.12.2024") oder "-"
   */
  formatDate(date: Date | string | undefined): string {
    return this.formatUtils.formatDate(date);
  }

  /**
   * Formatiert ein Datum mit Zeit im deutschen Format.
   *
   * @param {Date | string | undefined} date - Das zu formatierende Datum
   * @returns {string} Formatiertes Datum mit Zeit (z.B. "31.12.2024 23:59") oder "-"
   */
  formatDateTime(date: Date | string | undefined): string {
    return this.formatUtils.formatDateTime(date);
  }

  /**
   * Formatiert einen Prozentsatz.
   *
   * @param {number} value - Der Prozentsatz (0-100)
   * @param {number} [decimals=1] - Anzahl der Dezimalstellen
   * @returns {string} Formatierter Prozentsatz (z.B. "75,5 %")
   */
  formatPercentage(value: number, decimals: number = 1): string {
    return this.formatUtils.formatPercentage(value, decimals);
  }

  /**
   * Formatiert eine Zahl mit Tausendertrennzeichen.
   *
   * @param {number} value - Die zu formatierende Zahl
   * @param {number} [decimals=0] - Anzahl der Dezimalstellen
   * @returns {string} Formatierte Zahl (z.B. "1.234.567")
   */
  formatNumber(value: number, decimals: number = 0): string {
    return this.formatUtils.formatNumber(value, decimals);
  }

  // === TrackBy Methods ===
  /** Gebundene TrackBy-Funktionen für optimierte ngFor-Performance */

  /** TrackBy für Objekte mit id */
  trackById = this.trackByUtils.trackById.bind(this.trackByUtils);

  /** TrackBy für Transaktionen */
  trackByTransactionId = this.trackByUtils.trackByTransactionId.bind(this.trackByUtils);

  /** TrackBy für Budgets */
  trackByBudgetId = this.trackByUtils.trackByBudgetId.bind(this.trackByUtils);

  /** TrackBy für Kategorien */
  trackByCategoryId = this.trackByUtils.trackByCategoryId.bind(this.trackByUtils);

  /** TrackBy für Konten */
  trackByAccountId = this.trackByUtils.trackByAccountId.bind(this.trackByUtils);

  /** TrackBy für KPIs */
  trackByKPITitle = this.trackByUtils.trackByKPITitle.bind(this.trackByUtils);

  /** TrackBy für Objekte mit name */
  trackByName = this.trackByUtils.trackByName.bind(this.trackByUtils);

  /** TrackBy für Index (Fallback) */
  trackByIndex = this.trackByUtils.trackByIndex.bind(this.trackByUtils);

  // === Loading State Methods ===

  /**
   * Gibt zurück, ob die Komponente gerade lädt.
   *
   * @returns {boolean} True wenn isLoading gesetzt ist
   */
  get isLoading(): boolean {
    return this.loadingStateService.isLoading(this.componentKey);
  }

  /**
   * Gibt zurück, ob ein Fehler aufgetreten ist.
   *
   * @returns {boolean} True wenn hasError gesetzt ist
   */
  get hasError(): boolean {
    return this.loadingStateService.hasError(this.componentKey);
  }

  /**
   * Gibt zurück, ob keine Daten vorhanden sind.
   *
   * @returns {boolean} True wenn isEmpty gesetzt ist
   */
  get isDataEmpty(): boolean {
    return this.loadingStateService.isEmpty(this.componentKey);
  }

  /**
   * Setzt den Loading-State.
   *
   * @protected
   */
  protected setLoading(): void {
    this.loadingStateService.setLoading(this.componentKey);
  }

  /**
   * Setzt den Error-State.
   *
   * @protected
   * @param {string} [errorMessage] - Optionale Fehlermeldung
   */
  protected setError(errorMessage?: string): void {
    this.loadingStateService.setError(this.componentKey, errorMessage);
  }

  /**
   * Setzt den Empty-State.
   *
   * @protected
   */
  protected setEmpty(): void {
    this.loadingStateService.setEmpty(this.componentKey);
  }

  /**
   * Setzt den Success-State.
   *
   * @protected
   * @param {boolean} [isEmpty=false] - Ob die geladenen Daten leer sind
   */
  protected setSuccess(isEmpty: boolean = false): void {
    this.loadingStateService.setSuccess(this.componentKey, isEmpty);
  }

  /**
   * Resettet den State auf Initial-Zustand.
   *
   * @protected
   */
  protected resetState(): void {
    this.loadingStateService.reset(this.componentKey);
  }

  // === Common Utility Methods ===

  /**
   * Sicherer Zugriff auf verschachtelte Objekt-Properties.
   *
   * Verhindert Fehler beim Zugriff auf undefined/null-Werte.
   *
   * @protected
   * @template T - Der Rückgabetyp
   * @param {Record<string, unknown> | null | undefined} obj - Das Objekt
   * @param {string} path - Der Pfad zur Property (z.B. 'user.address.city')
   * @param {T} [defaultValue] - Rückgabewert wenn Property nicht existiert
   * @returns {T | undefined} Der Wert der Property oder defaultValue
   *
   * @example
   * const city = this.safeGet(user, 'address.city', 'Unknown');
   */
  protected safeGet<T>(
    obj: Record<string, unknown> | null | undefined,
    path: string,
    defaultValue?: T,
  ): T | undefined {
    if (!obj) return defaultValue;
    return (
      (path.split('.').reduce((current: unknown, key: string) => {
        return current && typeof current === 'object' && current !== null
          ? (current as Record<string, unknown>)[key]
          : undefined;
      }, obj) as T | undefined) ?? defaultValue
    );
  }

  /**
   * Prüft ob ein Wert leer ist.
   *
   * Behandelt verschiedene Datentypen: null, undefined, leere Strings,
   * leere Arrays, leere Objekte.
   *
   * @protected
   * @param {unknown} value - Der zu prüfende Wert
   * @returns {boolean} True wenn der Wert leer ist
   *
   * @example
   * if (this.isValueEmpty(input)) {
   *   console.log('Eingabe ist leer');
   * }
   */
  protected isValueEmpty(value: unknown): boolean {
    if (value == null) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  /**
   * Generiert eine eindeutige ID.
   *
   * Kombiniert Timestamp und Zufallsstring für Eindeutigkeit.
   *
   * @protected
   * @returns {string} Eindeutige ID
   *
   * @example
   * const newId = this.generateId(); // "lk3j2h1k3j2h1k3"
   */
  protected generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Debounce-Funktion zur Verzögerung von Funktionsaufrufen.
   *
   * Verhindert zu häufige Aufrufe (z.B. bei Suchfeldern). Die Funktion
   * wird erst nach Ablauf der Verzögerung ausgeführt.
   *
   * @protected
   * @template T - Funktionstyp
   * @param {T} func - Die zu verzögernde Funktion
   * @param {number} delay - Verzögerung in Millisekunden
   * @returns {Function} Debounced Funktion
   *
   * @example
   * const debouncedSearch = this.debounce(this.search, 300);
   * // search() wird erst 300ms nach dem letzten Aufruf ausgeführt
   */
  protected debounce<T extends (...args: unknown[]) => void>(
    func: T,
    delay: number,
  ): (...args: Parameters<T>) => void {
    let timeoutId: number;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * Retry-Funktion für fehlgeschlagene Operationen.
   *
   * Optionale Methode, die in abgeleiteten Komponenten implementiert werden
   * kann, um fehlgeschlagene Operationen zu wiederholen.
   *
   * @protected
   * @example
   * retry() {
   *   this.loadData();
   * }
   */
  protected abstract retry?(): void;
}

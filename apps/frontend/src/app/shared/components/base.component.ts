import { Component, OnDestroy, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { FormatUtilsService } from '../services/format-utils.service';
import { TrackByUtilsService } from '../services/trackby-utils.service';
import { LoadingStateService } from '../services/loading-state.service';

/**
 * Basis-Komponente mit gemeinsamen Funktionen
 * Reduziert Code-Wiederholungen in allen abgeleiteten Komponenten
 */
@Component({
  template: '',
})
export abstract class BaseComponent implements OnDestroy {
  protected destroy$ = new Subject<void>();

  // Injected Services
  protected formatUtils = inject(FormatUtilsService);
  protected trackByUtils = inject(TrackByUtilsService);
  protected loadingStateService = inject(LoadingStateService);

  // Komponenten-spezifischer State-Key
  protected abstract componentKey: string;

  constructor() {
    // State-Initialisierung wird in ngOnInit gemacht
  }

  protected initializeLoadingState(): void {
    this.loadingStateService.initializeState(this.componentKey);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.loadingStateService.cleanup(this.componentKey);
  }

  // === Formatting Methods ===

  formatCurrency(amount: number): string {
    return this.formatUtils.formatCurrency(amount);
  }

  formatDate(date: Date | string | undefined): string {
    return this.formatUtils.formatDate(date);
  }

  formatDateTime(date: Date | string | undefined): string {
    return this.formatUtils.formatDateTime(date);
  }

  formatPercentage(value: number, decimals: number = 1): string {
    return this.formatUtils.formatPercentage(value, decimals);
  }

  formatNumber(value: number, decimals: number = 0): string {
    return this.formatUtils.formatNumber(value, decimals);
  }

  // === TrackBy Methods ===

  trackById = this.trackByUtils.trackById.bind(this.trackByUtils);
  trackByTransactionId = this.trackByUtils.trackByTransactionId.bind(this.trackByUtils);
  trackByBudgetId = this.trackByUtils.trackByBudgetId.bind(this.trackByUtils);
  trackByCategoryId = this.trackByUtils.trackByCategoryId.bind(this.trackByUtils);
  trackByAccountId = this.trackByUtils.trackByAccountId.bind(this.trackByUtils);
  trackByKPITitle = this.trackByUtils.trackByKPITitle.bind(this.trackByUtils);
  trackByName = this.trackByUtils.trackByName.bind(this.trackByUtils);
  trackByIndex = this.trackByUtils.trackByIndex.bind(this.trackByUtils);

  // === Loading State Methods ===

  get isLoading(): boolean {
    return this.loadingStateService.isLoading(this.componentKey);
  }

  get hasError(): boolean {
    return this.loadingStateService.hasError(this.componentKey);
  }

  get isDataEmpty(): boolean {
    return this.loadingStateService.isEmpty(this.componentKey);
  }

  protected setLoading(): void {
    this.loadingStateService.setLoading(this.componentKey);
  }

  protected setError(errorMessage?: string): void {
    this.loadingStateService.setError(this.componentKey, errorMessage);
  }

  protected setEmpty(): void {
    this.loadingStateService.setEmpty(this.componentKey);
  }

  protected setSuccess(isEmpty: boolean = false): void {
    this.loadingStateService.setSuccess(this.componentKey, isEmpty);
  }

  protected resetState(): void {
    this.loadingStateService.reset(this.componentKey);
  }

  // === Common Utility Methods ===

  /**
   * Sicherer Zugriff auf verschachtelte Objekt-Properties
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
   * Prüft ob ein Wert leer ist (null, undefined, leerer String, leeres Array)
   */
  protected isValueEmpty(value: unknown): boolean {
    if (value == null) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  /**
   * Generiert eine eindeutige ID
   */
  protected generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Debounce-Funktion
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
   * Retry-Funktion für fehlgeschlagene Operationen
   */
  protected abstract retry?(): void;
}

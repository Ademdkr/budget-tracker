import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Globaler Service zur Verwaltung des Lade-Zustands.
 *
 * Verwaltet einen globalen Loading-Status, der typischerweise für HTTP-Interceptoren
 * verwendet wird. Zählt aktive Requests und zeigt nur dann Loading an, wenn
 * tatsächlich Requests laufen. Wird oft mit einem globalen Loading-Spinner kombiniert.
 *
 * Features:
 * - Automatisches Zählen aktiver Requests
 * - Observable für reaktive UI-Updates
 * - Verhindert negative Request-Counts
 * - Thread-sicher durch Counter-Mechanismus
 *
 * @example
 * // Im HTTP-Interceptor verwenden
 * this.loadingService.setLoading(true);
 * return next(req).pipe(
 *   finalize(() => this.loadingService.setLoading(false))
 * );
 *
 * // Im Template beobachten
 * loadingService.loading$.subscribe(isLoading => {
 *   // Loading-Spinner anzeigen/verstecken
 * });
 */
@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  /** BehaviorSubject für den Loading-Status */
  private loadingSubject = new BehaviorSubject<boolean>(false);

  /** Observable für den Loading-Status */
  public loading$ = this.loadingSubject.asObservable();

  /** Zähler für aktive HTTP-Requests */
  private activeRequestsCount = 0;

  /**
   * Setzt den Loading-Status.
   *
   * Erhöht bei true den Counter, verringert bei false. Emittiert nur dann
   * true, wenn tatsächlich aktive Requests laufen (Counter > 0).
   *
   * @param {boolean} loading - True für Request-Start, false für Request-Ende
   *
   * @example
   * // Request startet
   * this.loadingService.setLoading(true);
   *
   * // Request endet
   * this.loadingService.setLoading(false);
   */
  setLoading(loading: boolean) {
    if (loading) {
      this.activeRequestsCount++;
    } else {
      this.activeRequestsCount--;
      if (this.activeRequestsCount < 0) {
        this.activeRequestsCount = 0;
      }
    }

    // Only emit true when there are active requests, false when no active requests
    this.loadingSubject.next(this.activeRequestsCount > 0);
  }

  /**
   * Gibt den aktuellen Loading-Status zurück.
   *
   * @returns {boolean} True wenn aktuell Requests laufen, sonst false
   */
  get isLoading(): boolean {
    return this.loadingSubject.value;
  }
}

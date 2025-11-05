import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Interface für Loading-States einer Komponente.
 *
 * Definiert die drei Hauptzustände einer Komponente: Loading, Error, Empty.
 */
export interface LoadingState {
  /** Komponente lädt gerade Daten */
  isLoading: boolean;

  /** Ein Fehler ist aufgetreten */
  hasError: boolean;

  /** Keine Daten vorhanden (leere Liste) */
  isEmpty: boolean;

  /** Optionale Fehlermeldung */
  errorMessage?: string;
}

/**
 * Zentraler Service für Loading/Error/Empty States.
 *
 * Verwaltet Komponenten-spezifische Loading-States und eliminiert Code-Wiederholungen.
 * Jede Komponente registriert sich mit einem eindeutigen Key und kann dann ihren
 * Status (Loading/Error/Empty/Success) über diesen Service verwalten.
 *
 * Features:
 * - Komponenten-spezifische State-Verwaltung
 * - Observable für reaktive UI-Updates
 * - Hilfsmethoden für häufige State-Wechsel
 * - Automatisches Cleanup
 *
 * @example
 * // In Komponente
 * protected componentKey = 'transactions';
 *
 * // State setzen
 * this.loadingStateService.setLoading(this.componentKey);
 *
 * // Nach erfolgreichem Laden
 * this.loadingStateService.setSuccess(this.componentKey, data.length === 0);
 *
 * // Bei Fehler
 * this.loadingStateService.setError(this.componentKey, 'Laden fehlgeschlagen');
 */
@Injectable({
  providedIn: 'root',
})
export class LoadingStateService {
  /** Map mit allen registrierten Komponenten-States */
  private states = new Map<string, BehaviorSubject<LoadingState>>();

  /**
   * Initialisiert einen neuen Loading-State für eine Komponente.
   *
   * Erstellt einen neuen BehaviorSubject mit Initial-State, falls noch
   * nicht vorhanden. Wird automatisch beim ersten Zugriff aufgerufen.
   *
   * @param {string} componentKey - Eindeutiger Key der Komponente
   *
   * @example
   * this.loadingStateService.initializeState('transactions');
   */
  initializeState(componentKey: string): void {
    if (!this.states.has(componentKey)) {
      this.states.set(
        componentKey,
        new BehaviorSubject<LoadingState>({
          isLoading: false,
          hasError: false,
          isEmpty: false,
        }),
      );
    }
  }

  /**
   * Gibt den Observable für einen bestimmten State zurück.
   *
   * Initialisiert den State automatisch, falls noch nicht vorhanden.
   *
   * @param {string} componentKey - Eindeutiger Key der Komponente
   * @returns {Observable<LoadingState>} Observable für State-Änderungen
   *
   * @example
   * this.loadingStateService.getState('transactions').subscribe(state => {
   *   console.log('Loading:', state.isLoading);
   * });
   */
  getState(componentKey: string): Observable<LoadingState> {
    this.initializeState(componentKey);
    return this.states.get(componentKey)!.asObservable();
  }

  /**
   * Gibt den aktuellen State-Wert zurück.
   *
   * @param {string} componentKey - Eindeutiger Key der Komponente
   * @returns {LoadingState} Der aktuelle State
   *
   * @example
   * const state = this.loadingStateService.getCurrentState('transactions');
   * if (state.hasError) {
   *   console.error('Fehler:', state.errorMessage);
   * }
   */
  getCurrentState(componentKey: string): LoadingState {
    this.initializeState(componentKey);
    return this.states.get(componentKey)!.value;
  }

  /**
   * Setzt Loading-State auf true.
   *
   * Setzt hasError und isEmpty auf false.
   *
   * @param {string} componentKey - Eindeutiger Key der Komponente
   */
  setLoading(componentKey: string): void {
    this.updateState(componentKey, {
      isLoading: true,
      hasError: false,
      isEmpty: false,
    });
  }

  /**
   * Setzt Error-State.
   *
   * Setzt isLoading und isEmpty auf false, hasError auf true.
   *
   * @param {string} componentKey - Eindeutiger Key der Komponente
   * @param {string} [errorMessage] - Optionale Fehlermeldung
   *
   * @example
   * this.loadingStateService.setError('transactions', 'Laden fehlgeschlagen');
   */
  setError(componentKey: string, errorMessage?: string): void {
    this.updateState(componentKey, {
      isLoading: false,
      hasError: true,
      isEmpty: false,
      errorMessage,
    });
  }

  /**
   * Setzt Empty-State.
   *
   * Setzt isLoading und hasError auf false, isEmpty auf true.
   * Wird verwendet, wenn keine Daten vorhanden sind (z.B. leere Liste).
   *
   * @param {string} componentKey - Eindeutiger Key der Komponente
   */
  setEmpty(componentKey: string): void {
    this.updateState(componentKey, {
      isLoading: false,
      hasError: false,
      isEmpty: true,
    });
  }

  /**
   * Setzt Success-State.
   *
   * Setzt isLoading und hasError auf false. isEmpty kann optional gesetzt werden.
   * Wird nach erfolgreichem Laden der Daten verwendet.
   *
   * @param {string} componentKey - Eindeutiger Key der Komponente
   * @param {boolean} [isEmpty=false] - Ob die geladenen Daten leer sind
   *
   * @example
   * // Daten erfolgreich geladen
   * this.loadingStateService.setSuccess('transactions', data.length === 0);
   */
  setSuccess(componentKey: string, isEmpty: boolean = false): void {
    this.updateState(componentKey, {
      isLoading: false,
      hasError: false,
      isEmpty,
    });
  }

  /**
   * Resettet den State auf Initial-Zustand.
   *
   * Setzt alle Flags auf false.
   *
   * @param {string} componentKey - Eindeutiger Key der Komponente
   */
  reset(componentKey: string): void {
    this.updateState(componentKey, {
      isLoading: false,
      hasError: false,
      isEmpty: false,
    });
  }

  /**
   * Aktualisiert den State mit partiellen Änderungen.
   *
   * @private
   * @param {string} componentKey - Eindeutiger Key der Komponente
   * @param {Partial<LoadingState>} partialState - Zu ändernde State-Properties
   */
  private updateState(componentKey: string, partialState: Partial<LoadingState>): void {
    this.initializeState(componentKey);
    const currentState = this.states.get(componentKey)!.value;
    const newState = { ...currentState, ...partialState };
    this.states.get(componentKey)!.next(newState);
  }

  /**
   * Aufräumen beim Zerstören der Komponente.
   *
   * Beendet den BehaviorSubject und entfernt ihn aus der Map.
   * Sollte in ngOnDestroy() der Komponente aufgerufen werden.
   *
   * @param {string} componentKey - Eindeutiger Key der Komponente
   *
   * @example
   * ngOnDestroy() {
   *   this.loadingStateService.cleanup(this.componentKey);
   * }
   */
  cleanup(componentKey: string): void {
    if (this.states.has(componentKey)) {
      this.states.get(componentKey)!.complete();
      this.states.delete(componentKey);
    }
  }

  /**
   * Hilfsmethode: Prüft ob State in Loading ist.
   *
   * @param {string} componentKey - Eindeutiger Key der Komponente
   * @returns {boolean} True wenn isLoading gesetzt ist
   */
  isLoading(componentKey: string): boolean {
    return this.getCurrentState(componentKey).isLoading;
  }

  /**
   * Hilfsmethode: Prüft ob State einen Fehler hat.
   *
   * @param {string} componentKey - Eindeutiger Key der Komponente
   * @returns {boolean} True wenn hasError gesetzt ist
   */
  hasError(componentKey: string): boolean {
    return this.getCurrentState(componentKey).hasError;
  }

  /**
   * Hilfsmethode: Prüft ob State leer ist.
   *
   * @param {string} componentKey - Eindeutiger Key der Komponente
   * @returns {boolean} True wenn isEmpty gesetzt ist
   */
  isEmpty(componentKey: string): boolean {
    return this.getCurrentState(componentKey).isEmpty;
  }
}

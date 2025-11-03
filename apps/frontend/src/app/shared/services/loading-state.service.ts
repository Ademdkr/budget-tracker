import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Interface für Loading-States einer Komponente
 */
export interface LoadingState {
  isLoading: boolean;
  hasError: boolean;
  isEmpty: boolean;
  errorMessage?: string;
}

/**
 * Zentrale Service für Loading/Error/Empty States
 * Eliminiert Wiederholungen in allen Komponenten
 */
@Injectable({
  providedIn: 'root',
})
export class LoadingStateService {
  private states = new Map<string, BehaviorSubject<LoadingState>>();

  /**
   * Initialisiert einen neuen Loading-State für eine Komponente
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
   * Gibt den Observable für einen bestimmten State zurück
   */
  getState(componentKey: string): Observable<LoadingState> {
    this.initializeState(componentKey);
    return this.states.get(componentKey)!.asObservable();
  }

  /**
   * Gibt den aktuellen State-Wert zurück
   */
  getCurrentState(componentKey: string): LoadingState {
    this.initializeState(componentKey);
    return this.states.get(componentKey)!.value;
  }

  /**
   * Setzt Loading-State auf true
   */
  setLoading(componentKey: string): void {
    this.updateState(componentKey, {
      isLoading: true,
      hasError: false,
      isEmpty: false,
    });
  }

  /**
   * Setzt Error-State
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
   * Setzt Empty-State
   */
  setEmpty(componentKey: string): void {
    this.updateState(componentKey, {
      isLoading: false,
      hasError: false,
      isEmpty: true,
    });
  }

  /**
   * Setzt Success-State (kein Loading, kein Error, nicht leer)
   */
  setSuccess(componentKey: string, isEmpty: boolean = false): void {
    this.updateState(componentKey, {
      isLoading: false,
      hasError: false,
      isEmpty,
    });
  }

  /**
   * Resettet den State auf Initial-Zustand
   */
  reset(componentKey: string): void {
    this.updateState(componentKey, {
      isLoading: false,
      hasError: false,
      isEmpty: false,
    });
  }

  /**
   * Aktualisiert den State
   */
  private updateState(componentKey: string, partialState: Partial<LoadingState>): void {
    this.initializeState(componentKey);
    const currentState = this.states.get(componentKey)!.value;
    const newState = { ...currentState, ...partialState };
    this.states.get(componentKey)!.next(newState);
  }

  /**
   * Aufräumen beim Zerstören der Komponente
   */
  cleanup(componentKey: string): void {
    if (this.states.has(componentKey)) {
      this.states.get(componentKey)!.complete();
      this.states.delete(componentKey);
    }
  }

  /**
   * Hilfsmethode: Prüft ob State in Loading ist
   */
  isLoading(componentKey: string): boolean {
    return this.getCurrentState(componentKey).isLoading;
  }

  /**
   * Hilfsmethode: Prüft ob State einen Fehler hat
   */
  hasError(componentKey: string): boolean {
    return this.getCurrentState(componentKey).hasError;
  }

  /**
   * Hilfsmethode: Prüft ob State leer ist
   */
  isEmpty(componentKey: string): boolean {
    return this.getCurrentState(componentKey).isEmpty;
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Interface für API-Fehler.
 *
 * Definiert die Struktur von Fehlerantworten der API.
 */
export interface ApiError {
  /** Fehlermeldung */
  message: string;

  /** HTTP-Statuscode */
  statusCode: number;

  /** Optionale Fehlerdetails */
  error?: string;
}

/**
 * Zentraler API-Service für HTTP-Anfragen.
 *
 * Bietet typsichere Wrapper-Methoden für alle HTTP-Verben (GET, POST, PUT,
 * PATCH, DELETE) sowie eine Upload-Methode für Datei-Uploads. Alle Anfragen
 * nutzen die konfigurierte API-Basis-URL aus den Environment-Einstellungen
 * und eine zentrale Fehlerbehandlung.
 *
 * Features:
 * - Typsichere HTTP-Methoden
 * - Zentrale Fehlerbehandlung
 * - Automatische URL-Zusammensetzung
 * - HttpParams-Unterstützung
 * - FormData-Upload
 *
 * @example
 * // GET-Anfrage
 * this.api.get<User[]>('users').subscribe(users => {
 *   console.log(users);
 * });
 *
 * // POST-Anfrage
 * this.api.post<User>('users', { name: 'John' }).subscribe(newUser => {
 *   console.log('Erstellt:', newUser);
 * });
 *
 * // File-Upload
 * const formData = new FormData();
 * formData.append('file', file);
 * this.api.upload<UploadResult>('import/csv', formData).subscribe(result => {
 *   console.log('Upload erfolgreich:', result);
 * });
 */
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  /** HttpClient für HTTP-Anfragen */
  private http = inject(HttpClient);

  /** Basis-URL der API aus Environment-Konfiguration */
  private baseUrl = environment.apiBaseUrl;

  /**
   * Führt eine GET-Anfrage aus.
   *
   * @template T - Der erwartete Antworttyp
   * @param {string} endpoint - Der API-Endpunkt (relativ zur baseUrl)
   * @param {HttpParams} [params] - Optionale Query-Parameter
   * @returns {Observable<T>} Observable mit der typisierten Antwort
   *
   * @example
   * this.api.get<Transaction[]>('transactions', new HttpParams().set('limit', '10'))
   *   .subscribe(transactions => console.log(transactions));
   */
  get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    return this.http
      .get<T>(`${this.baseUrl}/${endpoint}`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Führt eine POST-Anfrage aus.
   *
   * @template T - Der erwartete Antworttyp
   * @param {string} endpoint - Der API-Endpunkt (relativ zur baseUrl)
   * @param {unknown} body - Der Request-Body (wird automatisch als JSON serialisiert)
   * @returns {Observable<T>} Observable mit der typisierten Antwort
   *
   * @example
   * this.api.post<Transaction>('transactions', { amount: 100, note: 'Test' })
   *   .subscribe(newTransaction => console.log('Erstellt:', newTransaction));
   */
  post<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http
      .post<T>(`${this.baseUrl}/${endpoint}`, body)
      .pipe(catchError(this.handleError));
  }

  /**
   * Führt eine PUT-Anfrage aus.
   *
   * @template T - Der erwartete Antworttyp
   * @param {string} endpoint - Der API-Endpunkt (relativ zur baseUrl)
   * @param {unknown} body - Der Request-Body (wird automatisch als JSON serialisiert)
   * @returns {Observable<T>} Observable mit der typisierten Antwort
   *
   * @example
   * this.api.put<Transaction>('transactions/123', { amount: 150 })
   *   .subscribe(updated => console.log('Aktualisiert:', updated));
   */
  put<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${endpoint}`, body).pipe(catchError(this.handleError));
  }

  /**
   * Führt eine PATCH-Anfrage aus.
   *
   * @template T - Der erwartete Antworttyp
   * @param {string} endpoint - Der API-Endpunkt (relativ zur baseUrl)
   * @param {unknown} body - Der Request-Body mit partiellen Updates
   * @returns {Observable<T>} Observable mit der typisierten Antwort
   *
   * @example
   * this.api.patch<Account>('accounts/456', { isActive: true })
   *   .subscribe(updated => console.log('Teilweise aktualisiert:', updated));
   */
  patch<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http
      .patch<T>(`${this.baseUrl}/${endpoint}`, body)
      .pipe(catchError(this.handleError));
  }

  /**
   * Führt eine DELETE-Anfrage aus.
   *
   * @template T - Der erwartete Antworttyp
   * @param {string} endpoint - Der API-Endpunkt (relativ zur baseUrl)
   * @returns {Observable<T>} Observable mit der typisierten Antwort
   *
   * @example
   * this.api.delete<void>('transactions/789')
   *   .subscribe(() => console.log('Gelöscht'));
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}/${endpoint}`).pipe(catchError(this.handleError));
  }

  /**
   * Führt einen Datei-Upload per POST aus.
   *
   * @template T - Der erwartete Antworttyp
   * @param {string} endpoint - Der API-Endpunkt (relativ zur baseUrl)
   * @param {FormData} formData - FormData-Objekt mit der hochzuladenden Datei
   * @returns {Observable<T>} Observable mit der typisierten Antwort
   *
   * @example
   * const formData = new FormData();
   * formData.append('file', file);
   * formData.append('accountId', 'account-1');
   * this.api.upload<ImportResult>('import/csv', formData)
   *   .subscribe(result => console.log('Import erfolgreich:', result));
   */
  upload<T>(endpoint: string, formData: FormData): Observable<T> {
    return this.http
      .post<T>(`${this.baseUrl}/${endpoint}`, formData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Zentrale Fehlerbehandlung für alle API-Anfragen.
   *
   * Extrahiert Fehlermeldungen aus HTTP-Fehlerantworten und gibt sie
   * als Observable-Fehler weiter. Loggt alle Fehler in die Konsole.
   *
   * @private
   * @param {unknown} error - Der aufgetretene Fehler
   * @returns {Observable<never>} Observable, das sofort einen Fehler wirft
   */
  private handleError(error: unknown): Observable<never> {
    let errorMessage = 'Ein unbekannter Fehler ist aufgetreten';

    if (error && typeof error === 'object' && 'error' in error) {
      const httpError = error as { error?: { message?: string; error?: string }; status?: number };
      errorMessage = httpError.error?.message || httpError.error?.error || errorMessage;
    }

    console.error('API Error:', error);
    return throwError(() => ({ message: errorMessage, error }));
  }
}

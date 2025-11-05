import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../shared/services/api.service';
import { Transaction } from '../transactions/transactions-api.service';

/**
 * Ergebnis eines CSV-Imports.
 *
 * Enthält Informationen über den Erfolg und die Details des Import-Vorgangs.
 */
export interface CSVImportResult {
  /** Status des Imports (erfolgreich oder nicht) */
  success: boolean;

  /** Anzahl der erfolgreich importierten Transaktionen */
  importedCount: number;

  /** Anzahl der fehlgeschlagenen Importe */
  failedCount: number;

  /** Liste von Fehlermeldungen (optional) */
  errors?: string[];

  /** Liste der importierten Transaktionen (optional) */
  transactions?: Transaction[];
}

/**
 * Optionen für den CSV-Import.
 *
 * Definiert verschiedene Konfigurationsparameter für das Parsen und
 * Importieren von CSV-Dateien.
 */
export interface CSVImportOptions {
  /** Erste Zeile (Header) überspringen */
  skipHeader?: boolean;

  /** Trennzeichen für CSV-Spalten (Standard: ',') */
  delimiter?: string;

  /** Format für Datumswerte (z.B. 'DD.MM.YYYY') */
  dateFormat?: string;

  /** ID des Zielkontos für den Import */
  accountId?: string;

  /** Standardkategorie für Transaktionen ohne Kategorie */
  defaultCategory?: string;
}

/**
 * API-Service für Import-Funktionen.
 *
 * Bietet Methoden zum Importieren von Transaktionen aus CSV-Dateien,
 * Validierung von Dateien, Herunterladen von Vorlagen und Abrufen
 * der Import-Historie.
 *
 * @example
 * // CSV-Datei importieren
 * const file = new File(['...'], 'transactions.csv');
 * this.importApi.importCSV(file, {
 *   skipHeader: true,
 *   dateFormat: 'DD.MM.YYYY',
 *   accountId: 'account-123'
 * }).subscribe(result => {
 *   console.log(`${result.importedCount} Transaktionen importiert`);
 * });
 */
@Injectable({
  providedIn: 'root',
})
export class ImportApiService {
  /** API-Service für HTTP-Anfragen */
  private api = inject(ApiService);

  /**
   * Importiert Transaktionen aus einer CSV-Datei.
   *
   * Lädt die CSV-Datei zum Backend hoch und verarbeitet sie gemäß den
   * angegebenen Optionen. Gibt ein Ergebnisobjekt mit Erfolgs- und
   * Fehlerinformationen zurück.
   *
   * @param {File} file - Die zu importierende CSV-Datei
   * @param {CSVImportOptions} [options] - Optionale Import-Konfiguration
   * @returns {Observable<CSVImportResult>} Observable mit Import-Ergebnis
   *
   * @example
   * this.importApi.importCSV(file, {
   *   skipHeader: true,
   *   delimiter: ',',
   *   dateFormat: 'DD.MM.YYYY'
   * }).subscribe(result => {
   *   if (result.success) {
   *     console.log(`${result.importedCount} Transaktionen importiert`);
   *   }
   * });
   */
  importCSV(file: File, options?: CSVImportOptions): Observable<CSVImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    if (options) {
      if (options.skipHeader !== undefined) {
        formData.append('skipHeader', String(options.skipHeader));
      }
      if (options.delimiter) {
        formData.append('delimiter', options.delimiter);
      }
      if (options.dateFormat) {
        formData.append('dateFormat', options.dateFormat);
      }
      if (options.accountId) {
        formData.append('accountId', options.accountId);
      }
      if (options.defaultCategory) {
        formData.append('defaultCategory', options.defaultCategory);
      }
    }

    return this.api.upload<CSVImportResult>('import/csv', formData);
  }

  /**
   * Lädt eine CSV-Vorlage herunter.
   *
   * Gibt eine Beispiel-CSV-Datei zurück, die als Vorlage für den Import
   * verwendet werden kann. Die Vorlage enthält die erwarteten Spalten
   * und Beispieldaten.
   *
   * @returns {Observable<string>} Observable mit CSV-Vorlagen-Inhalt
   *
   * @example
   * this.importApi.getTemplate().subscribe(template => {
   *   const blob = new Blob([template], { type: 'text/csv' });
   *   // Download-Link erstellen
   * });
   */
  getTemplate(): Observable<string> {
    // TODO: Implement backend endpoint for CSV template download
    return this.api.get<string>('import/template');
  }

  /**
   * Validiert eine CSV-Datei vor dem Import.
   *
   * Überprüft die Struktur und den Inhalt der CSV-Datei ohne einen
   * tatsächlichen Import durchzuführen. Gibt Informationen über die
   * Anzahl der Zeilen sowie eventuelle Fehler und Warnungen zurück.
   *
   * @param {File} file - Die zu validierende CSV-Datei
   * @returns {Observable<Object>} Observable mit Validierungsergebnis
   *
   * @example
   * this.importApi.validateCSV(file).subscribe(result => {
   *   if (result.valid) {
   *     console.log(`Datei ist gültig: ${result.rowCount} Zeilen`);
   *   } else {
   *     console.error('Validierungsfehler:', result.errors);
   *   }
   * });
   */
  validateCSV(file: File): Observable<{
    valid: boolean;
    rowCount: number;
    errors?: string[];
    warnings?: string[];
  }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.api.upload<{
      valid: boolean;
      rowCount: number;
      errors?: string[];
      warnings?: string[];
    }>('import/validate', formData);
  }

  /**
   * Ruft die Import-Historie ab.
   *
   * Gibt eine Liste aller vergangenen Import-Vorgänge mit Details wie
   * Dateiname, Zeitpunkt, Anzahl importierter/fehlgeschlagener Transaktionen
   * und Status zurück.
   *
   * @returns {Observable<Array>} Observable mit Liste der Import-Historie-Einträge
   *
   * @example
   * this.importApi.getImportHistory().subscribe(history => {
   *   history.forEach(entry => {
   *     console.log(`${entry.fileName}: ${entry.importedCount} importiert`);
   *   });
   * });
   */
  getImportHistory(): Observable<
    Array<{
      id: string;
      fileName: string;
      importedAt: Date | string;
      importedCount: number;
      failedCount: number;
      status: 'success' | 'partial' | 'failed';
    }>
  > {
    return this.api.get<
      Array<{
        id: string;
        fileName: string;
        importedAt: Date | string;
        importedCount: number;
        failedCount: number;
        status: 'success' | 'partial' | 'failed';
      }>
    >('import/history');
  }
}

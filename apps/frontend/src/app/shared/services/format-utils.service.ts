import { Injectable } from '@angular/core';

/**
 * Zentraler Utility-Service für Formatierungen.
 *
 * Bietet konsistente Formatierungsmethoden für die gesamte Anwendung,
 * eliminiert Code-Wiederholungen und stellt sicher, dass Werte einheitlich
 * dargestellt werden. Nutzt Intl-APIs für lokalisierte Formatierung.
 *
 * Features:
 * - Währungsformatierung (EUR, deutsches Format)
 * - Datumsformatierung (deutsch)
 * - Prozentformatierung
 * - Zahlenformatierung mit Tausendertrennzeichen
 * - Text-Kürzung mit Ellipsis
 * - Dateigrößen-Formatierung
 *
 * @example
 * // In Komponente injizieren
 * private formatUtils = inject(FormatUtilsService);
 *
 * // Währung formatieren
 * const formatted = this.formatUtils.formatCurrency(1234.56); // "1.234,56 €"
 *
 * // Datum formatieren
 * const date = this.formatUtils.formatDate(new Date()); // "05.11.2025"
 */
@Injectable({
  providedIn: 'root',
})
export class FormatUtilsService {
  /**
   * Formatiert Beträge als deutsche Währung.
   *
   * Verwendet das deutsche Währungsformat mit Punkt als Tausendertrennzeichen
   * und Komma als Dezimaltrennzeichen. Zeigt das Euro-Symbol (€) an.
   *
   * @param {number} amount - Der zu formatierende Betrag
   * @returns {string} Formatierter Währungsbetrag (z.B. "1.234,56 €")
   *
   * @example
   * formatCurrency(1234.56) // "1.234,56 €"
   * formatCurrency(-500) // "-500,00 €"
   * formatCurrency(0.99) // "0,99 €"
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  /**
   * Formatiert Datum im deutschen Format.
   *
   * Konvertiert Date-Objekte oder ISO-Strings in das deutsche Datumsformat
   * (TT.MM.JJJJ). Gibt '-' zurück, wenn kein Datum übergeben wird.
   *
   * @param {Date | string | undefined} date - Das zu formatierende Datum
   * @returns {string} Formatiertes Datum (z.B. "31.12.2024") oder "-"
   *
   * @example
   * formatDate(new Date('2024-12-31')) // "31.12.2024"
   * formatDate('2024-12-31T10:00:00Z') // "31.12.2024"
   * formatDate(undefined) // "-"
   */
  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(dateObj);
  }

  /**
   * Formatiert Datum und Zeit im deutschen Format.
   *
   * Konvertiert Date-Objekte oder ISO-Strings in das deutsche Datums- und
   * Zeitformat (TT.MM.JJJJ HH:MM). Gibt '-' zurück, wenn kein Datum übergeben wird.
   *
   * @param {Date | string | undefined} date - Das zu formatierende Datum
   * @returns {string} Formatiertes Datum mit Zeit (z.B. "31.12.2024 23:59") oder "-"
   *
   * @example
   * formatDateTime(new Date('2024-12-31T23:59:00Z')) // "31.12.2024 23:59"
   * formatDateTime('2024-01-15T14:30:00Z') // "15.01.2024 14:30"
   */
  formatDateTime(date: Date | string | undefined): string {
    if (!date) return '-';

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  }

  /**
   * Formatiert Prozentsätze.
   *
   * Konvertiert numerische Werte in Prozentdarstellung mit konfigurierbarer
   * Anzahl von Dezimalstellen. Der Eingabewert wird durch 100 geteilt
   * (z.B. 75 → 75%).
   *
   * @param {number} value - Der Prozentsatz (0-100)
   * @param {number} [decimals=1] - Anzahl der Dezimalstellen
   * @returns {string} Formatierter Prozentsatz (z.B. "75,5 %")
   *
   * @example
   * formatPercentage(75.5) // "75,5 %"
   * formatPercentage(100, 0) // "100 %"
   * formatPercentage(33.333, 2) // "33,33 %"
   */
  formatPercentage(value: number, decimals: number = 1): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100);
  }

  /**
   * Formatiert große Zahlen mit Tausender-Trennzeichen.
   *
   * Verwendet das deutsche Zahlenformat mit Punkt als Tausendertrennzeichen
   * und Komma als Dezimaltrennzeichen.
   *
   * @param {number} value - Die zu formatierende Zahl
   * @param {number} [decimals=0] - Anzahl der Dezimalstellen
   * @returns {string} Formatierte Zahl (z.B. "1.234.567,89")
   *
   * @example
   * formatNumber(1234567) // "1.234.567"
   * formatNumber(1234.56, 2) // "1.234,56"
   * formatNumber(999, 0) // "999"
   */
  formatNumber(value: number, decimals: number = 0): string {
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  /**
   * Kürzt lange Texte mit Ellipsis (...).
   *
   * Wenn der Text länger als die maximale Länge ist, wird er abgeschnitten
   * und "..." angehängt. Die maximale Länge berücksichtigt die Ellipsis.
   *
   * @param {string} text - Der zu kürzende Text
   * @param {number} [maxLength=50] - Maximale Textlänge (inkl. Ellipsis)
   * @returns {string} Gekürzter oder originaler Text
   *
   * @example
   * truncateText('Dies ist ein sehr langer Text', 20) // "Dies ist ein sehr..."
   * truncateText('Kurz', 50) // "Kurz"
   * truncateText('', 10) // ""
   */
  truncateText(text: string, maxLength: number = 50): string {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Formatiert Dateigröße in lesbares Format.
   *
   * Konvertiert Bytes automatisch in die passende Einheit (Bytes, KB, MB, GB)
   * und rundet auf zwei Dezimalstellen.
   *
   * @param {number} bytes - Die Dateigröße in Bytes
   * @returns {string} Formatierte Dateigröße (z.B. "2.5 MB")
   *
   * @example
   * formatFileSize(0) // "0 Bytes"
   * formatFileSize(1024) // "1 KB"
   * formatFileSize(1536) // "1.5 KB"
   * formatFileSize(2621440) // "2.5 MB"
   * formatFileSize(1073741824) // "1 GB"
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

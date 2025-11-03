import { Injectable } from '@angular/core';

/**
 * Zentrale Utility-Service für Formatierungen
 * Eliminiert Wiederholungen in allen Komponenten
 */
@Injectable({
  providedIn: 'root'
})
export class FormatUtilsService {
  
  /**
   * Formatiert Beträge als deutsche Währung
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  /**
   * Formatiert Datum im deutschen Format
   */
  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(dateObj);
  }

  /**
   * Formatiert Datum und Zeit im deutschen Format
   */
  formatDateTime(date: Date | string | undefined): string {
    if (!date) return '-';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  }

  /**
   * Formatiert Prozentsätze
   */
  formatPercentage(value: number, decimals: number = 1): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value / 100);
  }

  /**
   * Formatiert große Zahlen mit Tausender-Trennzeichen
   */
  formatNumber(value: number, decimals: number = 0): string {
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }

  /**
   * Kürzt lange Texte mit Ellipsis
   */
  truncateText(text: string, maxLength: number = 50): string {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Formatiert Dateigröße (Bytes zu KB, MB, etc.)
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
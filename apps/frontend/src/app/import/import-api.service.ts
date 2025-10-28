import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../shared/services/api.service';
import { Transaction } from '../transactions/transactions-api.service';

export interface CSVImportResult {
  success: boolean;
  importedCount: number;
  failedCount: number;
  errors?: string[];
  transactions?: Transaction[];
}

export interface CSVImportOptions {
  skipHeader?: boolean;
  delimiter?: string;
  dateFormat?: string;
  accountId?: string;
  defaultCategory?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ImportApiService {
  private api = inject(ApiService);

  /**
   * Import transactions from CSV file
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
   * Get CSV import template
   */
  getTemplate(): Observable<string> {
    // TODO: Implement backend endpoint for CSV template download
    return this.api.get<string>('import/template');
  }

  /**
   * Validate CSV file before import
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
   * Get import history
   */
  getImportHistory(): Observable<Array<{
    id: string;
    fileName: string;
    importedAt: Date | string;
    importedCount: number;
    failedCount: number;
    status: 'success' | 'partial' | 'failed';
  }>> {
    return this.api.get<Array<{
      id: string;
      fileName: string;
      importedAt: Date | string;
      importedCount: number;
      failedCount: number;
      status: 'success' | 'partial' | 'failed';
    }>>('import/history');
  }
}

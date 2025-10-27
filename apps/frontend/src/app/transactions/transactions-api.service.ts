import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../shared/services/api.service';

export interface Transaction {
  id: string;
  title?: string;
  description?: string; // Backend field name
  date: Date | string;
  amount: number;
  category?: string; // normalized to string name for UI usage
  categoryId?: string;
  categoryEmoji?: string;
  budgetId?: string; // Budget ID for filtering transactions by budget
  account?: string;
  accountId?: string;
  note?: string; // Alias for description
  type: 'INCOME' | 'EXPENSE'; // Backend uses uppercase enum
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CreateTransactionDto {
  title?: string;
  description?: string;
  date: Date | string;
  amount: number;
  categoryId: string;
  budgetId: string;
  type: 'INCOME' | 'EXPENSE'; // Backend uses uppercase enum
}

export interface UpdateTransactionDto {
  title?: string;
  description?: string;
  date?: Date | string;
  amount?: number;
  categoryId?: string;
  type?: 'INCOME' | 'EXPENSE'; // Backend uses uppercase enum
}

export interface TransactionFilters {
  startDate?: Date | string;
  endDate?: Date | string;
  type?: 'INCOME' | 'EXPENSE'; // Backend uses uppercase enum
  categoryId?: string;
  accountId?: string;
  minAmount?: number;
  maxAmount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionsApiService {
  private api = inject(ApiService);

  /**
   * Get all transactions (with optional filters)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getAll(filters?: TransactionFilters): Observable<Transaction[]> {
    // TODO: Implement query params for filters
    return this.api.get<unknown[]>('transactions').pipe(
      map(transactions => transactions.map((tRaw) => {
        type RawTxn = { categoryId?: string; budgetId?: string; category?: { id?: string; name?: string } | string | null; date: string | Date } & Record<string, unknown>;
        const t = tRaw as RawTxn;
        const catId = t.categoryId ?? (typeof t.category === 'object' && t.category ? t.category.id : undefined);
        const catName = typeof t.category === 'string' ? t.category : (typeof t.category === 'object' && t.category ? t.category.name : undefined);
        const legacyCategory = typeof t.category === 'string' ? t.category : undefined;
        return {
          ...(t as object),
          category: catName ?? legacyCategory,
          categoryId: catId,
          budgetId: t.budgetId,
          date: new Date(t.date)
        } as Transaction;
      }))
    );
  }

  /**
   * Get single transaction by ID
   */
  getById(id: string): Observable<Transaction> {
    return this.api.get<unknown>(`transactions/${id}`).pipe(
      map((tRaw) => {
        type RawTxn = { categoryId?: string; budgetId?: string; category?: { id?: string; name?: string } | string | null; date: string | Date } & Record<string, unknown>;
        const t = tRaw as RawTxn;
        const catId = t.categoryId ?? (typeof t.category === 'object' && t.category ? t.category.id : undefined);
        const catName = typeof t.category === 'string' ? t.category : (typeof t.category === 'object' && t.category ? t.category.name : undefined);
        const legacyCategory = typeof t.category === 'string' ? t.category : undefined;
        return {
          ...(t as object),
          category: catName ?? legacyCategory,
          categoryId: catId,
          budgetId: t.budgetId,
          date: new Date(t.date)
        } as Transaction;
      })
    );
  }

  /**
   * Create new transaction
   */
  create(dto: CreateTransactionDto): Observable<Transaction> {
    return this.api.post<unknown>('transactions', dto).pipe(
      map((tRaw) => {
        type RawTxn = { categoryId?: string; budgetId?: string; category?: { id?: string; name?: string } | string | null; date: string | Date } & Record<string, unknown>;
        const t = tRaw as RawTxn;
        const catId = t.categoryId ?? (typeof t.category === 'object' && t.category ? t.category.id : undefined);
        const catName = typeof t.category === 'string' ? t.category : (typeof t.category === 'object' && t.category ? t.category.name : undefined);
        const legacyCategory = typeof t.category === 'string' ? t.category : undefined;
        return {
          ...(t as object),
          category: catName ?? legacyCategory,
          categoryId: catId,
          budgetId: t.budgetId,
          date: new Date(t.date)
        } as Transaction;
      })
    );
  }

  /**
   * Update existing transaction
   */
  update(id: string, dto: UpdateTransactionDto): Observable<Transaction> {
    return this.api.patch<unknown>(`transactions/${id}`, dto).pipe(
      map((tRaw) => {
        type RawTxn = { categoryId?: string; budgetId?: string; category?: { id?: string; name?: string } | string | null; date: string | Date } & Record<string, unknown>;
        const t = tRaw as RawTxn;
        const catId = t.categoryId ?? (typeof t.category === 'object' && t.category ? t.category.id : undefined);
        const catName = typeof t.category === 'string' ? t.category : (typeof t.category === 'object' && t.category ? t.category.name : undefined);
        const legacyCategory = typeof t.category === 'string' ? t.category : undefined;
        return {
          ...(t as object),
          category: catName ?? legacyCategory,
          categoryId: catId,
          budgetId: t.budgetId,
          date: new Date(t.date)
        } as Transaction;
      })
    );
  }

  /**
   * Delete transaction
   */
  delete(id: string): Observable<void> {
    return this.api.delete<void>(`transactions/${id}`);
  }

  /**
   * Get transaction statistics
   */
  // ...existing code...
}

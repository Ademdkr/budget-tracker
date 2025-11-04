import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../shared/services/api.service';

export interface Category {
  id: string;
  name: string;
  accountId?: string; // Direct foreign key to Account
  icon?: string; // Backend field name
  emoji?: string; // Alias for icon (for compatibility)
  color?: string;
  type?: 'income' | 'expense' | 'both';
  transactionType?: 'INCOME' | 'EXPENSE'; // Backend field
  description?: string;
  budgetLimit?: number;
  budgetId?: string;
  account?: {
    id: string;
    name: string;
    type?: string;
    icon?: string;
    color?: string;
  };
  budget?: {
    id: string;
    name: string;
  };
  accounts?: CategoryAccount[]; // Legacy - to be removed
  _count?: {
    transactions: number;
  };
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CategoryAccount {
  id: string;
  categoryId: string;
  accountId: string;
  createdAt: Date | string;
  account: {
    id: string;
    name: string;
    type: string;
    icon?: string;
    color?: string;
  };
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  color?: string;
  emoji?: string; // Backend expects 'emoji'
  transactionType: 'INCOME' | 'EXPENSE'; // Required by backend
  accountId: string; // Required by backend (changed from budgetId)
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  color?: string;
  emoji?: string;
  transactionType?: 'INCOME' | 'EXPENSE';
}

@Injectable({
  providedIn: 'root',
})
export class CategoriesApiService {
  private api = inject(ApiService);

  /**
   * Get all categories
   */
  getAll(accountId?: string): Observable<Category[]> {
    let params = new HttpParams();
    if (accountId) {
      params = params.set('accountId', accountId);
    }
    return this.api.get<Category[]>('categories', params);
  }

  /**
   * Get single category by ID
   */
  getById(id: string): Observable<Category> {
    return this.api.get<Category>(`categories/${id}`);
  }

  /**
   * Create new category
   */
  create(dto: CreateCategoryDto): Observable<Category> {
    return this.api.post<Category>('categories', dto);
  }

  /**
   * Update existing category
   */
  update(id: string, dto: UpdateCategoryDto): Observable<Category> {
    return this.api.patch<Category>(`categories/${id}`, dto);
  }

  /**
   * Delete category
   */
  delete(id: string): Observable<void> {
    return this.api.delete<Category>(`categories/${id}`).pipe(
      map(() => void 0), // Response ignorieren und void zurückgeben
    );
  }

  // Account-Category Relationship Management

  /**
   * Assign category to account
   */
  assignToAccount(categoryId: string, accountId: string): Observable<CategoryAccount> {
    return this.api.post<CategoryAccount>(`categories/${categoryId}/accounts/${accountId}`, {});
  }

  /**
   * Remove category from account
   */
  removeFromAccount(categoryId: string, accountId: string): Observable<void> {
    return this.api.delete<void>(`categories/${categoryId}/accounts/${accountId}`);
  }

  /**
   * Get all account assignments for a category
   */
  getAccountAssignments(categoryId: string): Observable<CategoryAccount[]> {
    return this.api.get<CategoryAccount[]>(`categories/${categoryId}/accounts`);
  }

  /**
   * Get categories filtered by account
   */
  getByAccount(accountId: string): Observable<Category[]> {
    return this.getAll(accountId);
  }

  /**
   * Auto-assign categories to account based on existing transactions
   */
  autoAssignCategoriesBasedOnTransactions(accountId: string): Observable<CategoryAccount[]> {
    return this.api.post<CategoryAccount[]>(`categories/auto-assign/${accountId}`, {});
  }
}

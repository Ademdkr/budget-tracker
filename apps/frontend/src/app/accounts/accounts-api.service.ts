import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../shared/services/api.service';

export interface Account {
  id: string;
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT' | 'CASH' | 'OTHER';
  balance: number;
  currency: string;
  icon?: string;
  color?: string;
  note?: string;
  isActive: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CreateAccountDto {
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT' | 'CASH' | 'OTHER';
  balance: number;
  currency?: string;
  icon?: string;
  color?: string;
  note?: string;
  isActive?: boolean;
}

export interface UpdateAccountDto {
  name?: string;
  type?: 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT' | 'CASH' | 'OTHER';
  balance?: number;
  currency?: string;
  icon?: string;
  color?: string;
  note?: string;
  isActive?: boolean;
}

export interface AccountWithCalculatedBalance extends Account {
  calculatedBalance: number;
  totalIncome: number;
  totalExpenses: number;
  lastTransactionDate?: Date | string;
  transactionCount: number;
  transactions?: Transaction[];
}

export interface Transaction {
  id: string;
  title: string;
  description?: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AccountCategory {
  id: string;
  accountId: string;
  categoryId: string;
  createdAt: Date | string;
  category: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
    description?: string;
    budgetLimit?: number;
    budget?: {
      id: string;
      name: string;
    };
    _count?: {
      transactions: number;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class AccountsApiService {
  private api = inject(ApiService);

  /**
   * Get all accounts
   */
  getAll(): Observable<Account[]> {
    return this.api.get<Account[]>('accounts');
  }

  /**
   * Get single account by ID
   */
  getById(id: string): Observable<Account> {
    return this.api.get<Account>(`accounts/${id}`);
  }

  /**
   * Create new account
   */
  create(dto: CreateAccountDto): Observable<Account> {
    return this.api.post<Account>('accounts', dto);
  }

  /**
   * Update existing account
   */
  update(id: string, dto: UpdateAccountDto): Observable<Account> {
    return this.api.patch<Account>(`accounts/${id}`, dto);
  }

  /**
   * Delete account
   */
  delete(id: string): Observable<void> {
    return this.api.delete<void>(`accounts/${id}`);
  }

  /**
   * Get account statistics
   */
  getStatistics(): Observable<{
    totalBalance: number;
    accountCount: number;
    activeAccounts: number;
  }> {
    return this.api.get<{
      totalBalance: number;
      activeAccounts: number;
      totalAccounts: number;
    }>('accounts/statistics').pipe(
      map(stats => ({
        totalBalance: stats.totalBalance,
        accountCount: stats.totalAccounts,
        activeAccounts: stats.activeAccounts
      }))
    );
  }

  /**
   * Get accounts with calculated balances based on transactions
   */
  getAccountsWithCalculatedBalances(): Observable<AccountWithCalculatedBalance[]> {
    return this.api.get<AccountWithCalculatedBalance[]>('accounts/with-balances');
  }

  /**
   * Recalculate all account balances based on transactions
   */
  recalculateAccountBalances(): Observable<Account[]> {
    return this.api.post<Account[]>('accounts/recalculate-balances', {});
  }

  // Category-Account Relationship Management

  /**
   * Assign category to account
   */
  assignCategory(accountId: string, categoryId: string): Observable<AccountCategory> {
    return this.api.post<AccountCategory>(`accounts/${accountId}/categories/${categoryId}`, {});
  }

  /**
   * Remove category from account
   */
  removeCategory(accountId: string, categoryId: string): Observable<void> {
    return this.api.delete<void>(`accounts/${accountId}/categories/${categoryId}`);
  }

  /**
   * Get all assigned categories for an account
   */
  getAssignedCategories(accountId: string): Observable<AccountCategory[]> {
    return this.api.get<AccountCategory[]>(`accounts/${accountId}/categories`);
  }
}

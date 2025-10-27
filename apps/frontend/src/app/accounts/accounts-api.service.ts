import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../shared/services/api.service';

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'cash' | 'investment';
  balance: number;
  currency: string;
  icon: string;
  color: string;
  note?: string;
  isActive: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CreateAccountDto {
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'cash' | 'investment';
  balance: number;
  currency?: string;
  icon?: string;
  color?: string;
  note?: string;
  isActive?: boolean;
}

export interface UpdateAccountDto {
  name?: string;
  type?: 'checking' | 'savings' | 'credit' | 'cash' | 'investment';
  balance?: number;
  currency?: string;
  icon?: string;
  color?: string;
  note?: string;
  isActive?: boolean;
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
    // TODO: Add dedicated statistics endpoint
    return this.getAll().pipe(
      map(accounts => ({
        totalBalance: accounts.reduce((sum, acc) => sum + acc.balance, 0),
        accountCount: accounts.length,
        activeAccounts: accounts.filter(acc => acc.isActive).length
      }))
    );
  }
}

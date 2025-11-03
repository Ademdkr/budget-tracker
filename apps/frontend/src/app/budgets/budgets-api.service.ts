import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../shared/services/api.service';

export interface Budget {
  id: string;
  categoryId: string;
  year: number;
  month: number; // 1-12
  totalAmount: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  category?: {
    id: string;
    name: string;
    emoji?: string;
    color?: string;
  };
}

export interface CreateBudgetDto {
  categoryId: string;
  year: number;
  month: number; // 1-12
  totalAmount: number;
}

export interface UpdateBudgetDto {
  totalAmount?: number;
}

export interface BudgetWithStats {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  transactionCount: number;
  lastTransactionDate?: Date | string;
  month: number;
  year: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BudgetsApiService {
  private api = inject(ApiService);

  /**
   * Get all budgets
   */
  getAll(): Observable<Budget[]> {
    return this.api.get<Budget[]>('budgets');
  }

  /**
   * Get single budget by ID
   */
  getById(id: string): Observable<Budget> {
    return this.api.get<Budget>(`budgets/${id}`);
  }

  /**
   * Create new budget
   */
  create(dto: CreateBudgetDto): Observable<Budget> {
    return this.api.post<Budget>('budgets', dto);
  }

  /**
   * Update existing budget
   */
  update(id: string, dto: UpdateBudgetDto): Observable<Budget> {
    return this.api.patch<Budget>(`budgets/${id}`, dto);
  }

  /**
   * Delete budget
   */
  delete(id: string): Observable<void> {
    return this.api.delete<void>(`budgets/${id}`);
  }

  /**
   * Get budgets with calculated statistics for a specific period and account
   */
  getBudgetsWithStats(year?: number, month?: number, accountId?: string): Observable<BudgetWithStats[]> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    if (accountId) params.append('accountId', accountId);
    
    const queryString = params.toString();
    const url = queryString ? `budgets/with-stats?${queryString}` : 'budgets/with-stats';
    
    return this.api.get<BudgetWithStats[]>(url);
  }
}

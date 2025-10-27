import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../shared/services/api.service';

export interface Budget {
  id: string;
  name: string;
  description?: string;
  totalAmount: number;
  spent: number;
  currency: string;
  startDate: Date | string;
  endDate?: Date | string;
  isActive: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CreateBudgetDto {
  name: string;
  description?: string;
  totalAmount?: number;
  currency?: string;
  startDate?: Date | string;
  endDate?: Date | string;
}

export interface UpdateBudgetDto {
  name?: string;
  description?: string;
  totalAmount?: number;
  spent?: number;
  currency?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  isActive?: boolean;
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
}

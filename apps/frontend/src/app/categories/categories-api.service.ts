import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../shared/services/api.service';

export interface Category {
  id: string;
  name: string;
  icon?: string;  // Backend field name
  emoji?: string; // Alias for icon (for compatibility)
  color?: string;
  type?: 'income' | 'expense' | 'both';
  description?: string;
  budgetLimit?: number;
  budgetId?: string;
  budget?: {
    id: string;
    name: string;
  };
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;            // Backend expects 'icon'
  budgetLimit?: number;
  budgetId: string;         // Required by backend
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  budgetLimit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriesApiService {
  private api = inject(ApiService);

  /**
   * Get all categories
   */
  getAll(): Observable<Category[]> {
    return this.api.get<Category[]>('categories');
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
    return this.api.delete<void>(`categories/${id}`);
  }
}

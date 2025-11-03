import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AccountsApiService, AccountCategory } from '../accounts-api.service';
import { CategoriesApiService, Category } from '../../categories/categories-api.service';

export interface CategoryAssignmentDialogData {
  account: {
    id: string;
    name: string;
    type: string;
    icon?: string;
    color?: string;
  };
}

@Component({
  selector: 'app-category-assignment',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './category-assignment.component.html',
  styleUrls: ['./category-assignment.component.scss'],
})
export class CategoryAssignmentComponent implements OnInit {
  private accountsApi = inject(AccountsApiService);
  private categoriesApi = inject(CategoriesApiService);
  private snackBar = inject(MatSnackBar);
  public dialogRef = inject(MatDialogRef<CategoryAssignmentComponent>);
  public data = inject<CategoryAssignmentDialogData>(MAT_DIALOG_DATA);

  // State
  isLoading = true;
  hasError = false;

  // Data
  assignedCategories: AccountCategory[] = [];
  allCategories: Category[] = [];
  availableCategories: Category[] = [];

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    this.hasError = false;

    try {
      // Load assigned categories and all categories in parallel
      const [assigned, all] = await Promise.all([
        this.accountsApi.getAssignedCategories(this.data.account.id).toPromise(),
        this.categoriesApi.getAll().toPromise(),
      ]);

      this.assignedCategories = assigned || [];
      this.allCategories = all || [];

      // Calculate available categories (not yet assigned)
      const assignedCategoryIds = this.assignedCategories.map((a) => a.categoryId);
      this.availableCategories = this.allCategories.filter(
        (cat) => !assignedCategoryIds.includes(cat.id),
      );

      this.isLoading = false;
    } catch (error) {
      console.error('Error loading category assignments:', error);
      this.hasError = true;
      this.isLoading = false;
    }
  }

  async assignCategory(categoryId: string) {
    try {
      await this.accountsApi.assignCategory(this.data.account.id, categoryId).toPromise();

      this.snackBar.open('Kategorie erfolgreich zugewiesen', 'OK', { duration: 3000 });

      // Reload data
      await this.loadData();
    } catch (error) {
      console.error('Error assigning category:', error);
      this.snackBar.open('Fehler beim Zuweisen der Kategorie', 'OK', { duration: 3000 });
    }
  }

  async removeCategory(categoryId: string) {
    try {
      await this.accountsApi.removeCategory(this.data.account.id, categoryId).toPromise();

      this.snackBar.open('Kategorie erfolgreich entfernt', 'OK', { duration: 3000 });

      // Reload data
      await this.loadData();
    } catch (error) {
      console.error('Error removing category:', error);
      this.snackBar.open('Fehler beim Entfernen der Kategorie', 'OK', { duration: 3000 });
    }
  }
}

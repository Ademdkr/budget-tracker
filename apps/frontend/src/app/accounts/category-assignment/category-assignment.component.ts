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
    MatTooltipModule
  ],
  template: `
    <div class="category-assignment-dialog">
      <div mat-dialog-title class="dialog-header">
        <div class="account-info">
          <mat-icon [style.color]="data.account.color || '#666'">
            {{ data.account.icon || 'account_balance_wallet' }}
          </mat-icon>
          <div>
            <h2>Kategorien verwalten</h2>
            <p>{{ data.account.name }}</p>
          </div>
        </div>
      </div>

      <div mat-dialog-content class="dialog-content">
        <!-- Loading State -->
        <div *ngIf="isLoading" class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Lade Kategorien...</p>
        </div>

        <!-- Error State -->
        <div *ngIf="hasError && !isLoading" class="error-container">
          <mat-icon>error</mat-icon>
          <p>Fehler beim Laden der Kategorien</p>
          <button mat-button (click)="loadData()">Erneut versuchen</button>
        </div>

        <!-- Content -->
        <div *ngIf="!isLoading && !hasError" class="categories-content">
          <!-- Assigned Categories -->
          <div class="section" *ngIf="assignedCategories.length > 0">
            <h3>Zugewiesene Kategorien</h3>
            <div class="categories-grid">
              <mat-card
                *ngFor="let assignment of assignedCategories"
                class="category-card assigned">
                <mat-card-content>
                  <div class="category-info">
                    <span class="category-emoji">{{ assignment.category.icon || '📦' }}</span>
                    <div class="category-details">
                      <span class="category-name">{{ assignment.category.name }}</span>
                      <span class="category-meta" *ngIf="assignment.category._count">
                        {{ assignment.category._count.transactions }} Transaktionen
                      </span>
                    </div>
                  </div>
                  <button
                    mat-icon-button
                    color="warn"
                    (click)="removeCategory(assignment.categoryId)"
                    matTooltip="Kategorie entfernen">
                    <mat-icon>remove</mat-icon>
                  </button>
                </mat-card-content>
              </mat-card>
            </div>
          </div>

          <!-- Available Categories -->
          <div class="section">
            <h3>Verfügbare Kategorien</h3>
            <div *ngIf="availableCategories.length === 0" class="empty-state">
              <mat-icon>category</mat-icon>
              <p>Alle Kategorien sind bereits zugewiesen</p>
            </div>
            <div class="categories-grid" *ngIf="availableCategories.length > 0">
              <mat-card
                *ngFor="let category of availableCategories"
                class="category-card available">
                <mat-card-content>
                  <div class="category-info">
                    <span class="category-emoji">{{ category.icon || category.emoji || '📦' }}</span>
                    <div class="category-details">
                      <span class="category-name">{{ category.name }}</span>
                      <span class="category-meta" *ngIf="category._count">
                        {{ category._count.transactions }} Transaktionen
                      </span>
                    </div>
                  </div>
                  <button
                    mat-icon-button
                    color="primary"
                    (click)="assignCategory(category.id)"
                    matTooltip="Kategorie zuweisen">
                    <mat-icon>add</mat-icon>
                  </button>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </div>
      </div>

      <div mat-dialog-actions class="dialog-actions">
        <button mat-button mat-dialog-close>Schließen</button>
      </div>
    </div>
  `,
  styles: [`
    .category-assignment-dialog {
      width: 100%;
      max-width: 600px;
    }

    .dialog-header {
      .account-info {
        display: flex;
        align-items: center;
        gap: 1rem;

        mat-icon {
          font-size: 2rem;
          width: 2rem;
          height: 2rem;
        }

        h2 {
          margin: 0;
          font-size: 1.25rem;
        }

        p {
          margin: 0;
          color: var(--mat-sys-on-surface-variant);
          font-size: 0.875rem;
        }
      }
    }

    .dialog-content {
      min-height: 300px;
      max-height: 500px;
      padding: 1rem 0;
    }

    .loading-container,
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      gap: 1rem;

      mat-icon {
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
        color: var(--mat-sys-on-surface-variant);
      }
    }

    .categories-content {
      .section {
        margin-bottom: 2rem;

        h3 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          font-weight: 500;
          color: var(--mat-sys-on-surface-variant);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .categories-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.5rem;
        }

        .category-card {
          transition: all 0.2s ease;

          &.assigned {
            border-left: 4px solid var(--mat-sys-primary);
          }

          &.available {
            border-left: 4px solid var(--mat-sys-outline-variant);
          }

          mat-card-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem !important;

            .category-info {
              display: flex;
              align-items: center;
              gap: 0.75rem;

              .category-emoji {
                font-size: 1.5rem;
              }

              .category-details {
                display: flex;
                flex-direction: column;

                .category-name {
                  font-weight: 500;
                  color: var(--mat-sys-on-surface);
                }

                .category-meta {
                  font-size: 0.75rem;
                  color: var(--mat-sys-on-surface-variant);
                }
              }
            }
          }

          &:hover {
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            transform: translateY(-1px);
          }
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
          color: var(--mat-sys-on-surface-variant);

          mat-icon {
            font-size: 3rem;
            width: 3rem;
            height: 3rem;
            margin-bottom: 1rem;
          }
        }
      }
    }

    .dialog-actions {
      padding: 1rem 0 0 0;
      justify-content: flex-end;
    }
  `]
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
        this.categoriesApi.getAll().toPromise()
      ]);

      this.assignedCategories = assigned || [];
      this.allCategories = all || [];

      // Calculate available categories (not yet assigned)
      const assignedCategoryIds = this.assignedCategories.map(a => a.categoryId);
      this.availableCategories = this.allCategories.filter(
        cat => !assignedCategoryIds.includes(cat.id)
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

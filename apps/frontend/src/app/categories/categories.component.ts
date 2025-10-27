import { Component, OnInit, inject } from '@angular/core';
import { CategoriesApiService, CreateCategoryDto, UpdateCategoryDto } from './categories-api.service';
import { BudgetsApiService } from '../budgets/budgets-api.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatBadgeModule } from '@angular/material/badge';
import { TransactionsApiService, Transaction } from '../transactions/transactions-api.service';

// Enhanced Category interface with transaction count
export interface CategoryWithStats {
  id: string;
  name: string;
  emoji?: string;
  icon?: string;
  color?: string;
  type?: 'income' | 'expense' | 'both';
  transactionCount: number;
  totalAmount: number;
  description?: string;
  budgetLimit?: number;
  createdAt: Date;
  updatedAt: Date;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatGridListModule,
    MatBadgeModule
  ],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss'
})
export class CategoriesComponent implements OnInit {
  private dialog = inject(MatDialog);

  // Data properties
  categories: CategoryWithStats[] = [];
  incomeCategories: CategoryWithStats[] = [];
  expenseCategories: CategoryWithStats[] = [];

  // UI states
  isLoading = true;
  hasError = false;
  isEmpty = false;

  // View settings
  viewMode: 'grid' | 'list' = 'grid';
  selectedFilter: 'all' | 'income' | 'expense' = 'all';

  private categoriesApi = inject(CategoriesApiService);
  private budgetsApi = inject(BudgetsApiService);
  private transactionsApi = inject(TransactionsApiService);

  ngOnInit() {
    this.loadCategories();
  }

  private loadCategories() {
    this.isLoading = true;
    this.hasError = false;

    this.categoriesApi.getAll().toPromise()
      .then(categories => {
        this.categories = (categories ?? []).map(cat => {
          const emoji = (cat.emoji && cat.emoji.trim() !== '')
            ? cat.emoji
            : (cat.icon && String(cat.icon).trim() !== '' ? String(cat.icon) : '📦');
          // Backend liefert kein "type"-Feld – sinnvolle Defaults setzen
          // Heuristik: Kategorie "Gehalt" als income, sonst expense
          const type = cat.type ?? (cat.name?.toLowerCase().includes('gehalt') ? 'income' : 'expense');

          return {
            ...cat,
            emoji,
            type,
            transactionCount: 0,
            totalAmount: 0,
            createdAt: cat.createdAt ? new Date(cat.createdAt) : new Date(),
            updatedAt: cat.updatedAt ? new Date(cat.updatedAt) : new Date()
          } as CategoryWithStats;
        });
        return this.loadAndApplyTransactionStats();
      })
      .then(() => {
        this.filterCategories();
        this.checkEmptyState();
        this.isLoading = false;
      })
      .catch(() => {
        this.hasError = true;
        this.isLoading = false;
      });
  }

  private async loadAndApplyTransactionStats(): Promise<void> {
    try {
      const transactions = await this.transactionsApi.getAll().toPromise();
      type CatStats = { incomeCount: number; incomeTotal: number; expenseCount: number; expenseTotal: number };
      const byCategory = new Map<string, CatStats>();

      (transactions ?? []).forEach((t: Transaction) => {
        const cid = t.categoryId;
        if (!cid) return; // skip transactions without category
        const prev: CatStats = byCategory.get(cid) || { incomeCount: 0, incomeTotal: 0, expenseCount: 0, expenseTotal: 0 };
        if (t.type === 'INCOME') {
          prev.incomeCount += 1;
          prev.incomeTotal += Math.abs(t.amount);
        } else {
          prev.expenseCount += 1;
          prev.expenseTotal += Math.abs(t.amount);
        }
        byCategory.set(cid, prev);
      });

      this.categories = this.categories.map(c => {
        const stats: CatStats = byCategory.get(c.id) || { incomeCount: 0, incomeTotal: 0, expenseCount: 0, expenseTotal: 0 };
        // Bestimme Typ automatisch anhand vorhandener Transaktionen
        let typeAuto: 'income' | 'expense' | 'both' | undefined = c.type;
        if (stats.incomeCount > 0 && stats.expenseCount === 0) typeAuto = 'income';
        else if (stats.expenseCount > 0 && stats.incomeCount === 0) typeAuto = 'expense';
        else if (stats.incomeCount > 0 && stats.expenseCount > 0) typeAuto = c.type ?? 'expense';

        const isIncome = typeAuto === 'income';
        return {
          ...c,
          type: typeAuto ?? c.type,
          transactionCount: isIncome ? stats.incomeCount : stats.expenseCount,
          totalAmount: isIncome ? stats.incomeTotal : -stats.expenseTotal, // negative for expense for coloring logic
        };
      });
    } catch (e) {
      console.error('Konnte Transaktionsstatistiken nicht laden:', e);
      // Fallback: Behalte 0-Werte, UI bleibt funktionsfähig
    }
  }


  private filterCategories() {
    switch (this.selectedFilter) {
      case 'income':
        this.incomeCategories = this.categories.filter(c => c.type === 'income');
        this.expenseCategories = [];
        break;
      case 'expense':
        this.incomeCategories = [];
        this.expenseCategories = this.categories.filter(c => c.type === 'expense');
        break;
      case 'all':
      default:
        this.incomeCategories = this.categories.filter(c => c.type === 'income');
        this.expenseCategories = this.categories.filter(c => c.type === 'expense');
        break;
    }
  }

  private checkEmptyState() {
    this.isEmpty = this.categories.length === 0;
  }

  // Public methods
  setFilter(filter: 'all' | 'income' | 'expense') {
    this.selectedFilter = filter;
    this.filterCategories();
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  addCategory() {
    import('./category-form/category-form.component').then(({ CategoryFormComponent }) => {
      const dialogRef = this.dialog.open(CategoryFormComponent, {
        width: '500px',
        maxWidth: '90vw',
        data: {
          mode: 'create',
          existingNames: this.categories.map(c => c.name.toLowerCase())
        },
        disableClose: true
      });

      dialogRef.afterClosed().subscribe(result => {
        if (!result) return;

        this.isLoading = true;
        this.resolveCurrentBudgetId()
          .then((budgetId) => {
            if (!budgetId) {
              this.isLoading = false;
              alert('Kein aktives Budget gefunden. Bitte erstellen Sie zunächst ein Budget.');
              return;
            }

            const dto: CreateCategoryDto = {
              name: String(result.name).trim(),
              description: result.description || undefined,
              color: result.color || undefined,
              icon: result.emoji || '📦',
              budgetId,
            };

            this.categoriesApi.create(dto).subscribe({
              next: (created) => {
                // Map Backend -> UI
                const emoji = (created.icon || '📦');
                const type = (result.type ?? (created.name?.toLowerCase().includes('gehalt') ? 'income' : 'expense')) as 'income' | 'expense' | 'both';
                const createdAt = created.createdAt ? new Date(created.createdAt) : new Date();
                const updatedAt = created.updatedAt ? new Date(created.updatedAt) : new Date();

                const newCategory: CategoryWithStats = {
                  id: created.id,
                  name: created.name,
                  emoji,
                  icon: created.icon,
                  color: created.color,
                  type,
                  transactionCount: 0,
                  totalAmount: 0,
                  description: created.description,
                  budgetLimit: created.budgetLimit,
                  createdAt,
                  updatedAt,
                };

                this.categories.unshift(newCategory);
                this.filterCategories();
                this.checkEmptyState();
                this.isLoading = false;
                console.log('Kategorie erstellt:', newCategory);
              },
              error: (error) => {
                console.error('Fehler beim Erstellen der Kategorie:', error);
                this.isLoading = false;
                const message = (error && error.message) ? error.message : 'Kategorie konnte nicht erstellt werden.';
                alert(message);
              }
            });
          })
          .catch((e) => {
            console.error('Fehler beim Ermitteln des Budgets:', e);
            this.isLoading = false;
            alert('Budget konnte nicht ermittelt werden.');
          });
      });
    });
  }

  editCategory(category: CategoryWithStats) {
    import('./category-form/category-form.component').then(({ CategoryFormComponent }) => {
      const dialogRef = this.dialog.open(CategoryFormComponent, {
        width: '500px',
        maxWidth: '90vw',
        data: {
          mode: 'edit',
          category: category,
          existingNames: this.categories
            .filter(c => c.id !== category.id)
            .map(c => c.name.toLowerCase())
        },
        disableClose: true
      });

      dialogRef.afterClosed().subscribe(result => {
        if (!result) return;
        this.isLoading = true;

        const dto: UpdateCategoryDto = {
          name: String(result.name).trim(),
          description: result.description || undefined,
          color: result.color || undefined,
          icon: result.emoji || category.emoji || '📦',
        };

        this.categoriesApi.update(category.id, dto).subscribe({
          next: (updated) => {
            const index = this.categories.findIndex(c => c.id === category.id);
            if (index !== -1) {
              const emoji = (updated.icon || '📦');
              const type = (result.type ?? category.type ?? (updated.name?.toLowerCase().includes('gehalt') ? 'income' : 'expense')) as 'income' | 'expense' | 'both';
              const updatedAt = updated.updatedAt ? new Date(updated.updatedAt) : new Date();
              this.categories[index] = {
                ...this.categories[index],
                name: updated.name,
                emoji,
                icon: updated.icon,
                color: updated.color,
                type,
                description: updated.description,
                budgetLimit: updated.budgetLimit,
                updatedAt,
              };
            }
            this.filterCategories();
            this.checkEmptyState();
            this.isLoading = false;
            console.log('Kategorie aktualisiert:', updated);
          },
          error: (error) => {
            console.error('Fehler beim Aktualisieren der Kategorie:', error);
            this.isLoading = false;
            alert('Kategorie konnte nicht aktualisiert werden.');
          }
        });
      });
    });
  }

  deleteCategory(category: CategoryWithStats) {
    const hasTransactions = category.transactionCount > 0;

    let confirmMessage = `Möchten Sie die Kategorie "${category.name}" wirklich löschen?`;
    if (hasTransactions) {
      confirmMessage += `\n\nWarnung: Diese Kategorie hat ${category.transactionCount} Transaktionen. Diese werden ebenfalls betroffen sein.`;
    }

    const confirmed = window.confirm(confirmMessage);

    if (confirmed) {
      this.isLoading = true;
      this.categoriesApi.delete(category.id).subscribe({
        next: () => {
          const index = this.categories.findIndex(c => c.id === category.id);
          if (index !== -1) {
            this.categories.splice(index, 1);
          }
          this.filterCategories();
          this.checkEmptyState();
          this.isLoading = false;
          console.log('Kategorie erfolgreich gelöscht:', category.name);
        },
        error: (error) => {
          console.error('Fehler beim Löschen der Kategorie:', error);
          this.isLoading = false;
          alert('Kategorie konnte nicht gelöscht werden. Bitte versuchen Sie es erneut.');
        }
      });
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(Math.abs(amount));
  }

  getAmountClass(amount: number): string {
    return amount >= 0 ? 'income' : 'expense';
  }

  getCategoryTypeLabel(type?: string): string {
    switch (type) {
      case 'income': return 'Einnahme';
      case 'expense': return 'Ausgabe';
      case 'both': return 'Beide';
      default: return type || 'Unbekannt';
    }
  }

  getCategoryTypeColor(type?: string): string {
    switch (type) {
      case 'income': return 'success';
      case 'expense': return 'error';
      case 'both': return 'primary';
      default: return 'default';
    }
  }

  retry() {
    this.loadCategories();
  }

  private async resolveCurrentBudgetId(): Promise<string | null> {
    try {
      const budgets = await this.budgetsApi.getAll().toPromise();
      const first = (budgets ?? [])[0];
      return first?.id ?? null;
    } catch {
      return null;
    }
  }
}

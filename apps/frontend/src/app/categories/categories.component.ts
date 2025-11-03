import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import {
  CategoriesApiService,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './categories-api.service';
import { BudgetsApiService } from '../budgets/budgets-api.service';
import { AccountSelectionService } from '../shared/services/account-selection.service';
import { AccountsApiService } from '../accounts/accounts-api.service';
import { BaseComponent } from '../shared/components/base.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
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
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatGridListModule,
    MatBadgeModule,
  ],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
})
export class CategoriesComponent extends BaseComponent implements OnInit, OnDestroy {
  protected componentKey = 'categories';
  private dialog = inject(MatDialog);

  // Data properties
  categories: CategoryWithStats[] = [];
  incomeCategories: CategoryWithStats[] = [];
  expenseCategories: CategoryWithStats[] = [];

  // UI states
  isEmpty = false;

  // View settings
  viewMode: 'grid' | 'list' = 'grid';
  selectedFilter: 'all' | 'income' | 'expense' = 'all';

  private categoriesApi = inject(CategoriesApiService);
  private budgetsApi = inject(BudgetsApiService);
  private transactionsApi = inject(TransactionsApiService);
  private accountSelection = inject(AccountSelectionService);
  private accountsApi = inject(AccountsApiService);

  private initialLoadCompleted = false;
  private accountSubscription?: Subscription;

  ngOnInit() {
    // BaseComponent initialisieren
    this.initializeLoadingState();
    
    // Zuerst den AccountSelectionService initialisieren
    this.accountSelection.initialize();

    // Initial load
    this.loadCategories();

    // Subscribe to account selection changes
    this.accountSubscription = this.accountSelection.selectedAccount$.subscribe((account) => {
      if (this.initialLoadCompleted && account) {
        this.loadCategories();
      }
    });
  }

  private loadCategories() {
    this.setLoading();
    

    const selectedAccountId = this.accountSelection.getSelectedAccountId();
    console.log('🔍 Loading categories with accountId:', selectedAccountId);
    console.log('🏦 Selected account:', this.accountSelection.getSelectedAccount());

    // Kein Konto ausgewählt? Zeige leere Liste
    if (!selectedAccountId) {
      console.log('⚠️ No account selected, showing empty categories list');
      this.categories = [];
      this.filterCategories();
      this.checkEmptyState();
      this.setSuccess(this.isEmpty);
      this.initialLoadCompleted = true;
      return;
    }

    this.categoriesApi
      .getAll(selectedAccountId)
      .toPromise()
      .then((categories) => {
        console.log('📂 Categories API response:', categories);
        console.log('📊 Total categories loaded:', (categories ?? []).length);
        console.log(
          '🎯 Category names:',
          (categories ?? []).map((c) => c.name),
        );
        this.categories = (categories ?? []).map((cat) => {
          const emoji =
            cat.emoji && cat.emoji.trim() !== ''
              ? cat.emoji
              : cat.icon && String(cat.icon).trim() !== ''
                ? String(cat.icon)
                : '📦';

          // Backend liefert "transactionType" (INCOME/EXPENSE), Frontend erwartet "type" (income/expense)
          const type = cat.transactionType ? cat.transactionType.toLowerCase() : 'expense'; // fallback

          return {
            ...cat,
            emoji,
            type,
            transactionCount: 0,
            totalAmount: 0,
            createdAt: cat.createdAt ? new Date(cat.createdAt) : new Date(),
            updatedAt: cat.updatedAt ? new Date(cat.updatedAt) : new Date(),
          } as CategoryWithStats;
        });
        return this.loadAndApplyTransactionStats();
      })
      .then(() => {
        this.filterCategories();
        this.checkEmptyState();
        this.setSuccess(this.isEmpty);
        this.initialLoadCompleted = true;
      })
      .catch(() => {
        this.setError('Fehler beim Laden der Kategorien');
        this.initialLoadCompleted = true;
      });
  }

  private async loadAndApplyTransactionStats(): Promise<void> {
    try {
      // Get selected account ID to filter transactions
      const selectedAccountId = this.accountSelection.getSelectedAccountId();
      
      // Wenn kein Account ausgewählt ist, keine Stats laden
      if (!selectedAccountId) {
        console.log('⚠️ No account selected, skipping transaction stats');
        return;
      }

      const transactions = await this.transactionsApi.getAll({ accountId: selectedAccountId }).toPromise();
      type CatStats = {
        incomeCount: number;
        incomeTotal: number;
        expenseCount: number;
        expenseTotal: number;
      };
      const byCategory = new Map<string, CatStats>();

      // Derive transaction type from category if missing on transaction (new schema)
      const typeByCatId = new Map<string, 'INCOME' | 'EXPENSE'>();
      this.categories.forEach((c) => {
        const cid = String(c.id);
        const t = c.type === 'income' ? 'INCOME' : 'EXPENSE';
        typeByCatId.set(cid, t);
      });

      (transactions ?? []).forEach((t: Transaction) => {
        const cidRaw = (t as Transaction).categoryId;
        if (cidRaw === undefined || cidRaw === null) return; // skip transactions without category
        const cid = String(cidRaw);
        const prev: CatStats = byCategory.get(cid) || {
          incomeCount: 0,
          incomeTotal: 0,
          expenseCount: 0,
          expenseTotal: 0,
        };
        const derivedType: 'INCOME' | 'EXPENSE' =
          typeByCatId.get(cid) || (t.type as 'INCOME' | 'EXPENSE' | undefined) || 'EXPENSE';
        if (derivedType === 'INCOME') {
          prev.incomeCount += 1;
          prev.incomeTotal += Math.abs(t.amount);
        } else {
          prev.expenseCount += 1;
          prev.expenseTotal += Math.abs(t.amount);
        }
        byCategory.set(cid, prev);
      });

      this.categories = this.categories.map((c) => {
        const stats: CatStats = byCategory.get(String(c.id)) || {
          incomeCount: 0,
          incomeTotal: 0,
          expenseCount: 0,
          expenseTotal: 0,
        };
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
    // Arrays immer mit allen Kategorien befüllen für korrekte Anzeige der Anzahl
    this.incomeCategories = this.categories.filter((c) => c.type === 'income');
    this.expenseCategories = this.categories.filter((c) => c.type === 'expense');

    // selectedFilter wird im Template für die Anzeige verwendet
    // Die Arrays bleiben immer gefüllt für die korrekte Anzeige der Anzahl in den Tabs
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
    // Überprüfen ob ein Konto ausgewählt ist
    if (!this.hasAccountSelection()) {
      alert('Bitte wählen Sie zunächst ein Konto aus, um eine Kategorie zu erstellen.');
      return;
    }

    import('./category-form/category-form.component').then(({ CategoryFormComponent }) => {
      const dialogRef = this.dialog.open(CategoryFormComponent, {
        width: '500px',
        maxWidth: '90vw',
        data: {
          mode: 'create',
          existingNames: this.categories.map((c) => c.name.toLowerCase()),
        },
        disableClose: true,
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (!result) return;

        this.setLoading();
        const selectedAccountId = this.accountSelection.getSelectedAccountId();

        if (!selectedAccountId) {
          this.setSuccess(this.isEmpty);
          alert('Kein Konto ausgewählt. Bitte wählen Sie zunächst ein Konto aus.');
          return;
        }

        // Konvertiere Frontend-Type zu Backend-Enum
        const transactionType = result.type === 'income' ? 'INCOME' : 'EXPENSE';

        const dto: CreateCategoryDto = {
          name: String(result.name).trim(),
          description: result.description || undefined,
          color: result.color || undefined,
          emoji: result.emoji || '📦',
          transactionType,
          accountId: selectedAccountId,
        };

        this.categoriesApi.create(dto).subscribe({
          next: (created) => {
            // Map Backend -> UI
            const emoji = created.emoji || created.icon || '📦';
            const type = (result.type ??
              (created.name?.toLowerCase().includes('gehalt') ? 'income' : 'expense')) as
              | 'income'
              | 'expense'
              | 'both';
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
              createdAt,
              updatedAt,
            };

            this.categories.unshift(newCategory);
            this.filterCategories();
            this.checkEmptyState();
            this.setSuccess(this.isEmpty);
            console.log('Kategorie erstellt:', newCategory);
          },
          error: (error) => {
            console.error('Fehler beim Erstellen der Kategorie:', error);
            this.setSuccess(this.isEmpty);
            const message =
              error && error.message ? error.message : 'Kategorie konnte nicht erstellt werden.';
            alert(message);
          },
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
            .filter((c) => c.id !== category.id)
            .map((c) => c.name.toLowerCase()),
        },
        disableClose: true,
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (!result) return;
        this.setLoading();

        const dto: UpdateCategoryDto = {
          name: String(result.name).trim(),
          description: result.description || undefined,
          color: result.color || undefined,
          emoji: result.emoji || category.emoji || '📦',
          transactionType: result.type === 'income' ? 'INCOME' : 'EXPENSE',
        };

        this.categoriesApi.update(category.id, dto).subscribe({
          next: (updated) => {
            const index = this.categories.findIndex((c) => c.id === category.id);
            if (index !== -1) {
              const emoji = updated.emoji || updated.icon || '📦';
              const type = (result.type ??
                category.type ??
                (updated.name?.toLowerCase().includes('gehalt') ? 'income' : 'expense')) as
                | 'income'
                | 'expense'
                | 'both';
              const updatedAt = updated.updatedAt ? new Date(updated.updatedAt) : new Date();
              this.categories[index] = {
                ...this.categories[index],
                name: updated.name,
                emoji,
                icon: updated.icon,
                color: updated.color,
                type,
                description: updated.description,
                updatedAt,
              };
            }
            this.filterCategories();
            this.checkEmptyState();
            this.setSuccess(this.isEmpty);
            console.log('Kategorie aktualisiert:', updated);
          },
          error: (error) => {
            console.error('Fehler beim Aktualisieren der Kategorie:', error);
            this.setSuccess(this.isEmpty);
            alert('Kategorie konnte nicht aktualisiert werden.');
          },
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
      this.setLoading();
      this.categoriesApi.delete(category.id).subscribe({
        next: () => {
          const index = this.categories.findIndex((c) => c.id === category.id);
          if (index !== -1) {
            this.categories.splice(index, 1);
          }
          this.filterCategories();
          this.checkEmptyState();
          this.setSuccess(this.isEmpty);
          console.log('Kategorie erfolgreich gelöscht:', category.name);
        },
        error: (error) => {
          console.error('Fehler beim Löschen der Kategorie:', error);
          this.setSuccess(this.isEmpty);
          alert('Kategorie konnte nicht gelöscht werden. Bitte versuchen Sie es erneut.');
        },
      });
    }
  }

  formatCurrency(amount: number): string {
    return this.formatUtils.formatCurrency(Math.abs(amount));
  }

  getAmountClass(amount: number): string {
    return amount >= 0 ? 'income' : 'expense';
  }

  getCategoryTypeLabel(type?: string): string {
    switch (type) {
      case 'income':
        return 'Einnahme';
      case 'expense':
        return 'Ausgabe';
      case 'both':
        return 'Beide';
      default:
        return type || 'Unbekannt';
    }
  }

  getCategoryTypeColor(type?: string): string {
    switch (type) {
      case 'income':
        return 'success';
      case 'expense':
        return 'error';
      case 'both':
        return 'primary';
      default:
        return 'default';
    }
  }

  retry() {
    this.loadCategories();
  }

  // Account Selection Helper Methods
  getSelectedAccountName(): string {
    const selected = this.accountSelection.getSelectedAccount();
    return selected ? selected.name : '';
  }

  hasAccountSelection(): boolean {
    return this.accountSelection.hasSelection();
  }

  clearAccountFilter(): void {
    this.accountSelection.clearSelection().catch(err => {
      console.error('Error clearing account filter:', err);
    });
  }

  // TrackBy functions for performance optimization - using inherited methods
  trackByCategory = this.trackByUtils.trackByCategoryId.bind(this.trackByUtils);

  ngOnDestroy() {
    // Cleanup subscriptions to prevent memory leaks and duplicate API calls during navigation
    if (this.accountSubscription) {
      this.accountSubscription.unsubscribe();
    }
  }
}

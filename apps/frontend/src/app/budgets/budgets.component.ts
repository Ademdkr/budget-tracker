import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { BudgetFormComponent, BudgetDialogData } from './budget-form/budget-form.component';
import { CategoriesApiService, Category } from '../categories/categories-api.service';
import { TransactionsApiService } from '../transactions/transactions-api.service';
import { AccountSelectionService } from '../shared/services/account-selection.service';
import { BaseComponent } from '../shared/components/base.component';

import { BudgetsApiService } from './budgets-api.service';

// Budget interfaces
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
  lastTransactionDate?: Date;
  month: number;
  year: number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface MonthlyBudgetSummary {
  month: number;
  year: number;
  totalTarget: number;
  totalSpent: number;
  totalRemaining: number;
  budgetCount: number;
  overBudgetCount: number;
  achievedCount: number;
}

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatChipsModule,
    MatMenuModule,
    RouterModule,
  ],
  templateUrl: './budgets.component.html',
  styleUrl: './budgets.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetsComponent extends BaseComponent implements OnInit, OnDestroy {
  protected componentKey = 'budgets';
  private dialog = inject(MatDialog);
  private accountSelection = inject(AccountSelectionService);
  private cdr = inject(ChangeDetectorRef);

  // Data properties
  budgets: BudgetWithStats[] = [];
  monthlyStats: MonthlyBudgetSummary | null = null;
  private availableCategories: Category[] = [];
  private accountSubscription?: Subscription;

  // Helper for template
  Math = Math;

  // UI states
  isEmpty = false;
  private initialLoadCompleted = false;

  // Date selection
  selectedMonth = new Date().getMonth(); // 0-11
  selectedYear = new Date().getFullYear();
  monthControl = new FormControl(this.selectedMonth);
  yearControl = new FormControl(this.selectedYear);

  // Available options
  availableMonths = [
    { value: 0, label: 'Januar' },
    { value: 1, label: 'Februar' },
    { value: 2, label: 'März' },
    { value: 3, label: 'April' },
    { value: 4, label: 'Mai' },
    { value: 5, label: 'Juni' },
    { value: 6, label: 'Juli' },
    { value: 7, label: 'August' },
    { value: 8, label: 'September' },
    { value: 9, label: 'Oktober' },
    { value: 10, label: 'November' },
    { value: 11, label: 'Dezember' },
  ];

  availableYears: number[] = [];

  // Table columns
  displayedColumns: string[] = [
    'category',
    'target',
    'current',
    'progress',
    'remaining',
    'actions',
  ];

  private budgetsApi = inject(BudgetsApiService);
  private categoriesApi = inject(CategoriesApiService);
  private transactionsApi = inject(TransactionsApiService);

  ngOnInit() {
    // BaseComponent initialisieren
    this.initializeLoadingState();

    this.initializeYears();
    this.setupFormSubscriptions();

    // Reagiere auf Account-Änderungen und lade Daten erst, wenn Account verfügbar ist
    this.accountSubscription = this.accountSelection.selectedAccount$.subscribe((account) => {
      // Nur neu laden wenn die initiale Ladung abgeschlossen ist
      if (this.initialLoadCompleted && account) {
        this.loadBudgetsForPeriod();
      }
    });

    // Account Selection Service initialisieren und dann Daten laden
    this.initializeAndLoadData();
  }

  private async initializeAndLoadData() {
    // Warte auf die Initialisierung des AccountSelectionService
    await this.accountSelection.initialize();

    // Dann Initial load
    this.loadBudgetsForPeriod();
  }

  private initializeYears() {
    const currentYear = new Date().getFullYear();
    this.availableYears = [];

    // Add years from 2020 to next year
    for (let year = 2020; year <= currentYear + 1; year++) {
      this.availableYears.push(year);
    }
  }

  private setupFormSubscriptions() {
    this.monthControl.valueChanges.subscribe((month) => {
      if (month !== null) {
        this.selectedMonth = month;
        this.loadBudgetsForPeriod();
      }
    });

    this.yearControl.valueChanges.subscribe((year) => {
      if (year !== null) {
        this.selectedYear = year;
        this.loadBudgetsForPeriod();
      }
    });
  }

  private loadBudgetsForPeriod() {
    console.log('🔄 Loading budgets for period:', this.selectedYear, this.selectedMonth);

    // Verwende die ausgewählte Account-ID
    const selectedAccountId = this.accountSelection.getSelectedAccountId();

    // Wenn kein Account ausgewählt ist, lade keine Daten
    if (!selectedAccountId) {
      console.log('⚠️ No account selected, skipping budget load');
      this.budgets = [];
      this.availableCategories = [];
      this.checkEmptyState();
      this.setSuccess(true); // Beende Loading-State
      return;
    }

    this.setLoading();

    // Verwende die neue optimierte API mit bereits berechneten Statistiken
    const budgetMonth = this.selectedMonth + 1; // Frontend: 0-11, Backend: 1-12

    // Lade nur Kategorien für Dialog-Zwecke, Budgets kommen bereits mit allen Statistiken
    Promise.all([
      this.budgetsApi
        .getBudgetsWithStats(this.selectedYear, budgetMonth, selectedAccountId)
        .toPromise(),
      this.categoriesApi.getAll(selectedAccountId).toPromise(), // Nur für Dialog-Zwecke
    ])
      .then(([budgetsWithStats, categories]) => {
        // Store categories for reuse in dialogs
        this.availableCategories = categories ?? [];

        console.log('📊 Budgets with stats loaded:', budgetsWithStats?.length);
        console.log('📊 Sample budget data:', budgetsWithStats?.[0]);

        // Die neue API liefert bereits alle berechneten Statistiken
        this.budgets = (budgetsWithStats ?? []).map((budget) => ({
          id: budget.id,
          categoryId: budget.categoryId,
          categoryName: budget.categoryName,
          categoryIcon: budget.categoryIcon,
          categoryColor: budget.categoryColor,
          targetAmount: budget.targetAmount,
          currentAmount: budget.currentAmount,
          remainingAmount: budget.remainingAmount,
          percentageUsed: budget.percentageUsed,
          transactionCount: budget.transactionCount,
          lastTransactionDate: budget.lastTransactionDate
            ? new Date(budget.lastTransactionDate)
            : undefined,
          month: budget.month - 1, // Backend: 1-12, Frontend: 0-11
          year: budget.year,
          createdAt: budget.createdAt ? new Date(budget.createdAt) : new Date(),
          updatedAt: budget.updatedAt ? new Date(budget.updatedAt) : new Date(),
          isActive: budget.isActive,
        }));

        // Berechne monatliche Statistiken
        this.calculateMonthlyStats();
        this.checkEmptyState();
        this.setSuccess(this.isEmpty);
        this.initialLoadCompleted = true;
        this.cdr.markForCheck();
      })
      .catch(() => {
        this.setError('Fehler beim Laden der Budgets');
        this.initialLoadCompleted = true;
        this.cdr.markForCheck();
      });
  }

  private calculateMonthlyStats() {
    if (this.budgets.length === 0) {
      this.monthlyStats = null;
      return;
    }

    // GEPLANT: Summe aller Budget-Sollwerte (targetAmount) für den ausgewählten Monat
    const totalTarget = this.budgets.reduce((sum, budget) => {
      const amount = Number(budget.targetAmount) || 0;
      console.log(
        '🔢 Adding targetAmount:',
        budget.categoryName,
        amount,
        'Type:',
        typeof budget.targetAmount,
      );
      return sum + amount;
    }, 0);

    // AUSGEGEBEN: Summe aller tatsächlichen Ausgaben (currentAmount)
    const totalSpent = this.budgets.reduce((sum, budget) => {
      const amount = Number(budget.currentAmount) || 0;
      return sum + amount;
    }, 0);

    console.log('📊 Monthly stats calculation:', {
      month: this.selectedMonth,
      year: this.selectedYear,
      budgetCount: this.budgets.length,
      totalTarget,
      totalSpent,
      budgets: this.budgets.map((b) => ({
        id: b.id,
        categoryName: b.categoryName,
        targetAmount: b.targetAmount,
        currentAmount: b.currentAmount,
      })),
    });

    const totalRemaining = totalTarget - totalSpent;
    const overBudgetCount = this.budgets.filter((b) => b.percentageUsed > 100).length;
    const achievedCount = this.budgets.filter(
      (b) => b.percentageUsed >= 90 && b.percentageUsed <= 100,
    ).length;

    this.monthlyStats = {
      month: this.selectedMonth,
      year: this.selectedYear,
      totalTarget,
      totalSpent,
      totalRemaining,
      budgetCount: this.budgets.length,
      overBudgetCount,
      achievedCount,
    };
  }

  private checkEmptyState() {
    this.isEmpty = this.budgets.length === 0;
  }

  // UI Helper Methods
  formatCurrency(amount: number): string {
    return this.formatUtils.formatCurrency(amount);
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'Keine Aktivität';
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  getProgressBarColor(percentage: number): string {
    if (percentage <= 50) return 'primary'; // Blue
    if (percentage <= 80) return 'accent'; // Orange
    if (percentage <= 100) return 'primary'; // Blue
    return 'warn'; // Red for over budget
  }

  getBudgetStatus(budget: BudgetWithStats): 'success' | 'warning' | 'danger' | 'info' {
    if (!budget.isActive) return 'info';
    if (budget.percentageUsed > 100) return 'danger';
    if (budget.percentageUsed >= 90) return 'success'; // Im Ziel
    if (budget.percentageUsed >= 80) return 'warning'; // Fast aufgebraucht
    if (budget.percentageUsed >= 50) return 'info'; // Moderat
    if (budget.percentageUsed > 0) return 'success'; // Auf Kurs
    return 'info'; // Nicht verwendet
  }

  getBudgetStatusText(budget: BudgetWithStats): string {
    if (!budget.isActive) return 'Inaktiv';
    if (budget.percentageUsed === 0) return 'Nicht verwendet';
    if (budget.percentageUsed > 100) return 'Überschritten';
    if (budget.percentageUsed >= 90) return 'Im Ziel';
    if (budget.percentageUsed >= 80) return 'Fast aufgebraucht';
    if (budget.percentageUsed >= 50) return 'Moderat';
    return 'Auf Kurs';
  }

  getSelectedMonthName(): string {
    return this.availableMonths.find((m) => m.value === this.selectedMonth)?.label || '';
  }

  // Budget Actions
  async createBudget(): Promise<void> {
    // Überprüfen ob ein Konto ausgewählt ist
    const selectedAccountId = this.accountSelection.getSelectedAccountId();
    if (!selectedAccountId) {
      alert('Bitte wählen Sie zunächst ein Konto aus, um ein Budget zu erstellen.');
      return;
    }

    const categories = await this.loadCategoriesForDialog();

    // Wenn keine Kategorien für das Konto vorhanden sind
    if (categories.length === 0) {
      alert(
        'Für das ausgewählte Konto sind keine Kategorien verfügbar. Erstellen Sie zunächst Kategorien für dieses Konto.',
      );
      return;
    }

    const existingBudgets = this.budgets.map((b) => ({
      id: b.id,
      categoryId: b.categoryId,
      categoryName: b.categoryName,
      targetAmount: b.targetAmount,
      month: b.month,
      year: b.year,
      isActive: b.isActive,
    }));

    const dialogRef = this.dialog.open(BudgetFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        categories,
        existingBudgets,
        month: this.selectedMonth,
        year: this.selectedYear,
        isEdit: false,
      } as BudgetDialogData,
      disableClose: true,
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.action === 'create') {
        this.createBudgetFromDialog(result.budget);
      }
    });
  }

  async editBudget(budget: BudgetWithStats): Promise<void> {
    const categories = await this.loadCategoriesForDialog();
    const existingBudgets = this.budgets
      .filter((b) => b.id !== budget.id)
      .map((b) => ({
        id: b.id,
        categoryId: b.categoryId,
        categoryName: b.categoryName,
        targetAmount: b.targetAmount,
        month: b.month,
        year: b.year,
        isActive: b.isActive,
      }));

    const dialogRef = this.dialog.open(BudgetFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        budget: {
          id: budget.id,
          categoryId: budget.categoryId,
          categoryName: budget.categoryName,
          targetAmount: budget.targetAmount,
          month: budget.month,
          year: budget.year,
          isActive: budget.isActive,
        },
        categories,
        existingBudgets,
        month: this.selectedMonth,
        year: this.selectedYear,
        isEdit: true,
      } as BudgetDialogData,
      disableClose: true,
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.action === 'edit') {
        this.updateBudgetFromDialog(budget.id, result.budget);
      }
    });
  }

  deleteBudget(budget: BudgetWithStats): void {
    const confirmed = confirm(
      `Möchten Sie das Budget für "${budget.categoryName}" wirklich löschen?`,
    );
    if (confirmed) {
      this.budgetsApi.delete(budget.id).subscribe({
        next: () => {
          console.log('Budget erfolgreich gelöscht:', budget.categoryName);
          this.loadBudgetsForPeriod(); // Liste neu laden
        },
        error: (error) => {
          console.error('Fehler beim Löschen des Budgets:', error);
          alert('Budget konnte nicht gelöscht werden. Bitte versuchen Sie es erneut.');
        },
      });
    }
  }

  retry(): void {
    this.loadBudgetsForPeriod();
  }

  // Helper methods for dialog integration
  private async loadCategoriesForDialog(): Promise<Category[]> {
    try {
      // Versuche zuerst, bereits geladene Kategorien zu verwenden (aus loadBudgetsForPeriod)
      if (this.availableCategories && this.availableCategories.length > 0) {
        console.log('🔄 Reusing already loaded categories for dialog');
        const expenseCategories = this.availableCategories.filter(
          (cat: Category) => cat.transactionType !== 'INCOME',
        );
        return expenseCategories.map((cat: Category) => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon || cat.emoji || '📦',
          color: cat.color || '#4CAF50',
          isActive: true,
        }));
      }

      // Fallback: Lade Kategorien nur wenn noch nicht geladen
      const selectedAccountId = this.accountSelection.getSelectedAccountId();

      if (!selectedAccountId) {
        console.warn('Kein Konto ausgewählt, lade keine Kategorien');
        return [];
      }

      console.log('📥 Loading fresh categories for dialog (fallback)');
      const categories = await this.categoriesApi.getAll(selectedAccountId).toPromise();
      // Nur Ausgabekategorien für Budgeterstellung zulassen
      const expenseCategories = (categories ?? []).filter(
        (cat) => cat.transactionType !== 'INCOME',
      );
      return expenseCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon || cat.emoji || '📦',
        color: cat.color || '#4CAF50',
        isActive: true,
      }));
    } catch (error) {
      console.error('Fehler beim Laden der Kategorien:', error);
      return [];
    }
  }

  private async createBudgetFromDialog(budgetData: Partial<BudgetWithStats>): Promise<void> {
    const categoryId = budgetData.categoryId || '';
    const targetAmount = budgetData.targetAmount || 0;
    const month = (budgetData.month ?? this.selectedMonth) + 1; // Frontend: 0-11, Backend: 1-12
    const year = budgetData.year || this.selectedYear;

    console.log('🔍 Budget data from dialog:', budgetData);
    console.log('🔍 Selected month/year:', this.selectedMonth, this.selectedYear);
    console.log('🔍 Calculated month (backend):', month);

    // Validierung
    if (!categoryId || categoryId.trim() === '') {
      console.error('❌ Kategorie-ID fehlt:', categoryId);
      alert('Kategorie-ID ist erforderlich.');
      return;
    }

    if (targetAmount <= 0) {
      console.error('❌ Ungültiger Betrag:', targetAmount);
      alert('Budget-Betrag muss größer als 0 sein.');
      return;
    }

    // Zusätzliche Absicherung gegen Einnahme-Kategorien
    try {
      const cat = await this.categoriesApi.getById(categoryId.trim()).toPromise();
      if (cat && cat.transactionType === 'INCOME') {
        alert(
          'Für Einnahme-Kategorien können keine Budgets erstellt werden. Bitte wählen Sie eine Ausgaben-Kategorie.',
        );
        return;
      }
    } catch {
      console.warn('Kategorie konnte zur Validierung nicht geladen werden.');
    }

    const createDto = {
      categoryId: categoryId.trim(),
      year: year,
      month: month,
      totalAmount: Number(targetAmount), // Explizit zu Number konvertieren
    };

    console.log('📤 Sending create request with:', createDto);

    this.budgetsApi.create(createDto).subscribe({
      next: (createdBudget) => {
        console.log('✅ Budget erfolgreich erstellt:', createdBudget);
        console.log('🔄 Aktualisiere Budget-Liste...');
        this.loadBudgetsForPeriod(); // Liste neu laden
      },
      error: (error) => {
        console.error('Fehler beim Erstellen des Budgets:', error);
        const errorMessage = error?.error?.message?.[0] || 'Budget konnte nicht erstellt werden.';
        alert(`Fehler: ${errorMessage}\nBitte versuchen Sie es erneut.`);
      },
    });
  }

  private updateBudgetFromDialog(budgetId: string, budgetData: Partial<BudgetWithStats>): void {
    const targetAmount = budgetData.targetAmount || 0;

    const updateDto = {
      totalAmount: targetAmount,
    };

    this.budgetsApi.update(budgetId, updateDto).subscribe({
      next: (updatedBudget) => {
        console.log('Budget erfolgreich aktualisiert:', updatedBudget);
        this.loadBudgetsForPeriod(); // Liste neu laden
      },
      error: (error) => {
        console.error('Fehler beim Aktualisieren des Budgets:', error);
        alert('Budget konnte nicht aktualisiert werden. Bitte versuchen Sie es erneut.');
      },
    });
  }

  // Account Selection Helper Methods
  hasAccountSelection(): boolean {
    return !!this.accountSelection.getSelectedAccountId();
  }

  getSelectedAccountName(): string {
    const account = this.accountSelection.getSelectedAccount();
    return account?.name || '';
  }

  clearAccountFilter(): void {
    this.accountSelection.clearSelection().catch((err) => {
      console.error('Error clearing account filter:', err);
    });
  }

  // TrackBy functions for performance optimization - using inherited methods
  trackByBudget = this.trackByUtils.trackById.bind(this.trackByUtils);
  trackByCategory = this.trackByUtils.trackByCategoryId.bind(this.trackByUtils);

  // Die folgenden Helper wurden durch echte Kategorien ersetzt und sind nicht mehr nötig.

  protected generateId(): string {
    return 'budget_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  ngOnDestroy() {
    // Cleanup subscriptions to prevent memory leaks and duplicate API calls during navigation
    if (this.accountSubscription) {
      this.accountSubscription.unsubscribe();
    }
  }
}

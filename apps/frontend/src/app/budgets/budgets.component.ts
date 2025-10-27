import { Component, OnInit, inject } from '@angular/core';
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
import { BudgetFormComponent, BudgetDialogData, Category } from './budget-form/budget-form.component';
import { CategoriesApiService } from '../categories/categories-api.service';
import { TransactionsApiService } from '../transactions/transactions-api.service';

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
    MatMenuModule
  ],
  templateUrl: './budgets.component.html',
  styleUrl: './budgets.component.scss'
})
export class BudgetsComponent implements OnInit {
  private dialog = inject(MatDialog);

  // Data properties
  budgets: BudgetWithStats[] = [];
  monthlyStats: MonthlyBudgetSummary | null = null;

  // Helper for template
  Math = Math;

  // UI states
  isLoading = true;
  hasError = false;
  isEmpty = false;

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
    { value: 11, label: 'Dezember' }
  ];

  availableYears: number[] = [];

  // Table columns
  displayedColumns: string[] = ['category', 'target', 'current', 'progress', 'remaining', 'actions'];

  private budgetsApi = inject(BudgetsApiService);
  private categoriesApi = inject(CategoriesApiService);
  private transactionsApi = inject(TransactionsApiService);

  ngOnInit() {
    this.initializeYears();
    this.setupFormSubscriptions();
    this.loadInitialData();
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
    this.monthControl.valueChanges.subscribe(month => {
      if (month !== null) {
        this.selectedMonth = month;
        this.loadBudgetsForPeriod();
      }
    });

    this.yearControl.valueChanges.subscribe(year => {
      if (year !== null) {
        this.selectedYear = year;
        this.loadBudgetsForPeriod();
      }
    });
  }

  private loadInitialData() {
    this.isLoading = true;
    this.hasError = false;

    this.loadBudgetsForPeriod();
  }

  private loadBudgetsForPeriod() {
    this.isLoading = true;
    this.hasError = false;

    // Lade Budgets, Kategorien und Transaktionen für korrekte Berechnungen
    Promise.all([
      this.budgetsApi.getAll().toPromise(),
      this.loadCategoriesForDialog(),
      this.transactionsApi.getAll().toPromise()
    ]).then(([budgets, categories, transactions]) => {
        type InternalBudget = BudgetWithStats & { _startDate: Date; _endDate: Date; _hasIncomeTransactions: boolean };

        // Berechne die Gesamtausgaben für den Zeitraum (für Einnahmen-Budgets)
        const periodStart = new Date(this.selectedYear, this.selectedMonth, 1);
        const periodEnd = new Date(this.selectedYear, this.selectedMonth + 1, 0);
        
        const totalExpensesInPeriod = (transactions ?? [])
          .filter(t => 
            t.type === 'EXPENSE' &&
            new Date(t.date) >= periodStart &&
            new Date(t.date) <= periodEnd
          )
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const all: InternalBudget[] = (budgets ?? []).map(budget => {
          const totalAmount = budget.totalAmount ?? 0;
          const start = new Date(budget.startDate);
          const end = budget.endDate ? new Date(budget.endDate) : new Date(start.getFullYear(), start.getMonth() + 1, 0);

          // Berechne tatsächliche Ausgaben aus Transaktionen dieses Budgets
          const budgetTransactions = (transactions ?? []).filter(t =>
            t.budgetId === budget.id &&
            t.type === 'EXPENSE' &&
            new Date(t.date) >= start &&
            new Date(t.date) <= end
          );

          // Prüfe, ob dieses Budget INCOME-Transaktionen hat
          const hasIncomeTransactions = (transactions ?? []).some(t =>
            t.budgetId === budget.id &&
            t.type === 'INCOME' &&
            new Date(t.date) >= start &&
            new Date(t.date) <= end
          );

          // Für Einnahmen-Budgets: Gesamtausgaben aller Budgets
          // Für Ausgaben-Budgets: Nur die Ausgaben dieses Budgets
          const actualSpent = hasIncomeTransactions ? totalExpensesInPeriod : budgetTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
          
          const transactionCount = budgetTransactions.length;
          const lastTransaction = budgetTransactions.length > 0
            ? budgetTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
            : null;

          const percentageUsed = totalAmount > 0 ? (actualSpent / totalAmount) * 100 : 0;

          // Intelligente Icon-Zuordnung basierend auf Budget-Namen
          const matchingCategory = this.findCategoryByBudgetName(budget.name, categories);
          const categoryIcon = matchingCategory?.icon || '💰';
          const categoryColor = matchingCategory?.color || '#4CAF50';

          return {
            id: budget.id,
            categoryId: matchingCategory?.id || '',
            categoryName: budget.name,
            categoryIcon,
            categoryColor,
            targetAmount: totalAmount,
            currentAmount: actualSpent,
            remainingAmount: totalAmount - actualSpent,
            percentageUsed,
            transactionCount,
            lastTransactionDate: lastTransaction ? new Date(lastTransaction.date) : undefined,
            month: start.getMonth(),
            year: start.getFullYear(),
            createdAt: budget.createdAt ? new Date(budget.createdAt) : new Date(),
            updatedAt: budget.updatedAt ? new Date(budget.updatedAt) : new Date(),
            isActive: budget.isActive ?? true,
            // Interne Felder zur Filterung
            _startDate: start,
            _endDate: end,
            _hasIncomeTransactions: hasIncomeTransactions,
          } as InternalBudget;
        });

        // Überlappung prüfen: (start <= periodEnd) && (end >= periodStart)
        const filtered = all.filter(b => b._startDate <= periodEnd && b._endDate >= periodStart);

        // interne Felder entfernen und Ergebnis setzen
        this.budgets = filtered.map(b => ({
          id: b.id,
          categoryId: b.categoryId,
          categoryName: b.categoryName,
          categoryIcon: b.categoryIcon,
          categoryColor: b.categoryColor,
          targetAmount: b.targetAmount,
          currentAmount: b.currentAmount,
          remainingAmount: b.remainingAmount,
          percentageUsed: b.percentageUsed,
          transactionCount: b.transactionCount,
          lastTransactionDate: b.lastTransactionDate,
          month: b.month,
          year: b.year,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
          isActive: b.isActive,
        }));

        // Speichere die vollständigen Informationen für calculateMonthlyStats
        this.calculateMonthlyStats(filtered);
        this.checkEmptyState();
        this.isLoading = false;
      })
      .catch(() => {
        this.hasError = true;
        this.isLoading = false;
      });
  }

  private calculateMonthlyStats(filteredBudgets?: (BudgetWithStats & { _hasIncomeTransactions: boolean })[]) {
    if (this.budgets.length === 0) {
      this.monthlyStats = null;
      return;
    }

    // Verwende die vollständigen Budget-Informationen wenn verfügbar
    const budgetsWithIncomeInfo = filteredBudgets || this.budgets;

    // Für GEPLANT (totalTarget) nur Budgets mit INCOME-Transaktionen berücksichtigen
    const incomeBudgets = budgetsWithIncomeInfo.filter(b => 
      '_hasIncomeTransactions' in b ? b._hasIncomeTransactions === true : false
    );
    const totalTarget = incomeBudgets.reduce((sum, budget) => sum + budget.targetAmount, 0);
    
    // Für AUSGEGEBEN (totalSpent) nur Budgets ohne INCOME-Transaktionen berücksichtigen
    const expenseBudgets = budgetsWithIncomeInfo.filter(b => 
      '_hasIncomeTransactions' in b ? b._hasIncomeTransactions !== true : true
    );
    const totalSpent = expenseBudgets.reduce((sum, budget) => sum + budget.currentAmount, 0);
    
    const totalRemaining = totalTarget - totalSpent;
    const overBudgetCount = this.budgets.filter(b => b.percentageUsed > 100).length;
    const achievedCount = this.budgets.filter(b => b.percentageUsed >= 90 && b.percentageUsed <= 100).length;

    this.monthlyStats = {
      month: this.selectedMonth,
      year: this.selectedYear,
      totalTarget,
      totalSpent,
      totalRemaining,
      budgetCount: this.budgets.length,
      overBudgetCount,
      achievedCount
    };
  }

  private checkEmptyState() {
    this.isEmpty = this.budgets.length === 0;
  }

  // UI Helper Methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'Keine Aktivität';
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  }

  getProgressBarColor(percentage: number): string {
    if (percentage <= 50) return 'primary'; // Blue
    if (percentage <= 80) return 'accent';  // Orange
    if (percentage <= 100) return 'primary'; // Blue
    return 'warn'; // Red for over budget
  }

  getBudgetStatus(budget: BudgetWithStats): 'success' | 'warning' | 'danger' | 'info' {
    if (!budget.isActive) return 'info';
    if (budget.percentageUsed > 100) return 'danger';
    if (budget.percentageUsed >= 90) return 'success'; // Im Ziel
    if (budget.percentageUsed >= 80) return 'warning'; // Fast aufgebraucht
    if (budget.percentageUsed >= 50) return 'info';    // Moderat
    if (budget.percentageUsed > 0) return 'success';   // Auf Kurs
    return 'info';                                     // Nicht verwendet
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
    return this.availableMonths.find(m => m.value === this.selectedMonth)?.label || '';
  }

  // Budget Actions
  async createBudget(): Promise<void> {
    const categories = await this.loadCategoriesForDialog();
    const existingBudgets = this.budgets.map(b => ({
      id: b.id,
      categoryId: b.categoryId,
      categoryName: b.categoryName,
      targetAmount: b.targetAmount,
      month: b.month,
      year: b.year,
      isActive: b.isActive
    }));

    const dialogRef = this.dialog.open(BudgetFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        categories,
        existingBudgets,
        month: this.selectedMonth,
        year: this.selectedYear,
        isEdit: false
      } as BudgetDialogData,
      disableClose: true,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'create') {
        this.createBudgetFromDialog(result.budget);
      }
    });
  }

  async editBudget(budget: BudgetWithStats): Promise<void> {
    const categories = await this.loadCategoriesForDialog();
    const existingBudgets = this.budgets
      .filter(b => b.id !== budget.id)
      .map(b => ({
        id: b.id,
        categoryId: b.categoryId,
        categoryName: b.categoryName,
        targetAmount: b.targetAmount,
        month: b.month,
        year: b.year,
        isActive: b.isActive
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
          isActive: budget.isActive
        },
        categories,
        existingBudgets,
        month: this.selectedMonth,
        year: this.selectedYear,
        isEdit: true
      } as BudgetDialogData,
      disableClose: true,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'edit') {
        this.updateBudgetFromDialog(budget.id, result.budget);
      }
    });
  }

  deleteBudget(budget: BudgetWithStats): void {
    const confirmed = confirm(`Möchten Sie das Budget für "${budget.categoryName}" wirklich löschen?`);
    if (confirmed) {
      this.budgetsApi.delete(budget.id).subscribe({
        next: () => {
          console.log('Budget erfolgreich gelöscht:', budget.categoryName);
          this.loadBudgetsForPeriod(); // Liste neu laden
        },
        error: (error) => {
          console.error('Fehler beim Löschen des Budgets:', error);
          alert('Budget konnte nicht gelöscht werden. Bitte versuchen Sie es erneut.');
        }
      });
    }
  }

  retry(): void {
    this.loadInitialData();
  }

  // Helper methods for dialog integration
  private async loadCategoriesForDialog(): Promise<Category[]> {
    try {
      const categories = await this.categoriesApi.getAll().toPromise();
      return (categories ?? []).map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon || cat.emoji || '📦',
        color: cat.color || '#4CAF50',
        isActive: true
      }));
    } catch (error) {
      console.error('Fehler beim Laden der Kategorien:', error);
      return [];
    }
  }

  private findCategoryByBudgetName(budgetName: string, categories: Category[]): Category | undefined {
    // Erste Strategie: Exakte Übereinstimmung mit Kategorie-Namen
    let match = categories.find(cat =>
      cat.name.toLowerCase() === budgetName.toLowerCase()
    );

    if (match) return match;

    // Zweite Strategie: Budget-Name enthält Kategorie-Namen
    match = categories.find(cat =>
      budgetName.toLowerCase().includes(cat.name.toLowerCase())
    );

    if (match) return match;

    // Dritte Strategie: Kategorie-Name ist in Budget-Name enthalten
    match = categories.find(cat =>
      cat.name.toLowerCase().includes(budgetName.toLowerCase())
    );

    if (match) return match;

    // Vierte Strategie: Budget enthält "Budget für [Kategorie]" Pattern
    const budgetForMatch = budgetName.match(/budget für (.+?) - /i);
    if (budgetForMatch) {
      const categoryNameFromBudget = budgetForMatch[1].trim();
      match = categories.find(cat =>
        cat.name.toLowerCase() === categoryNameFromBudget.toLowerCase()
      );
      if (match) return match;
    }

    return undefined;
  }

  private createBudgetFromDialog(budgetData: Partial<BudgetWithStats>): void {
    const categoryName = budgetData.categoryName || '';
    const targetAmount = budgetData.targetAmount || 0;
    const month = budgetData.month || this.selectedMonth;
    const year = budgetData.year || this.selectedYear;

    // Validierung
    if (!categoryName || categoryName.trim() === '') {
      alert('Kategoriename ist erforderlich.');
      return;
    }

    // Erstelle Start- und Enddatum für das Budget
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0); // Letzter Tag des Monats

    const createDto = {
      name: categoryName.trim(),
      description: `Budget für ${categoryName} - ${this.getSelectedMonthName()} ${year}`,
      totalAmount: targetAmount,
      currency: 'EUR',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };

    console.log('Sending create request with:', createDto);

        this.budgetsApi.create(createDto).subscribe({
      next: (createdBudget) => {
        console.log('Budget erfolgreich erstellt:', createdBudget);
        this.loadBudgetsForPeriod(); // Liste neu laden
      },
      error: (error) => {
        console.error('Fehler beim Erstellen des Budgets:', error);
        const errorMessage = error?.error?.message?.[0] || 'Budget konnte nicht erstellt werden.';
        alert(`Fehler: ${errorMessage}\nBitte versuchen Sie es erneut.`);
      }
    });
  }

  private updateBudgetFromDialog(budgetId: string, budgetData: Partial<BudgetWithStats>): void {
    const targetAmount = budgetData.targetAmount || 0;

    const updateDto = {
      totalAmount: targetAmount
    };

    this.budgetsApi.update(budgetId, updateDto).subscribe({
      next: (updatedBudget) => {
        console.log('Budget erfolgreich aktualisiert:', updatedBudget);
        this.loadBudgetsForPeriod(); // Liste neu laden
      },
      error: (error) => {
        console.error('Fehler beim Aktualisieren des Budgets:', error);
        alert('Budget konnte nicht aktualisiert werden. Bitte versuchen Sie es erneut.');
      }
    });
  }

  // Die folgenden Helper wurden durch echte Kategorien ersetzt und sind nicht mehr nötig.

  private generateId(): string {
    return 'budget_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

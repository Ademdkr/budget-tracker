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

    // Simulate API call
    setTimeout(() => {
      try {
        this.loadBudgetsForPeriod();
        this.isLoading = false;
      } catch {
        this.hasError = true;
        this.isLoading = false;
      }
    }, 800);
  }

  private loadBudgetsForPeriod() {
    // Generate mock budget data for the selected month/year
    this.budgets = [
      {
        id: '1',
        categoryId: 'cat_1',
        categoryName: 'Lebensmittel',
        categoryIcon: '🛒',
        categoryColor: '#4CAF50',
        targetAmount: 400.00,
        currentAmount: 285.40,
        remainingAmount: 114.60,
        percentageUsed: 71.35,
        transactionCount: 12,
        lastTransactionDate: new Date('2025-10-24'),
        month: this.selectedMonth,
        year: this.selectedYear,
        createdAt: new Date('2025-10-01'),
        updatedAt: new Date('2025-10-24'),
        isActive: true
      },
      {
        id: '2',
        categoryId: 'cat_2',
        categoryName: 'Transport',
        categoryIcon: '🚗',
        categoryColor: '#2196F3',
        targetAmount: 200.00,
        currentAmount: 145.80,
        remainingAmount: 54.20,
        percentageUsed: 72.90,
        transactionCount: 8,
        lastTransactionDate: new Date('2025-10-23'),
        month: this.selectedMonth,
        year: this.selectedYear,
        createdAt: new Date('2025-10-01'),
        updatedAt: new Date('2025-10-23'),
        isActive: true
      },
      {
        id: '3',
        categoryId: 'cat_3',
        categoryName: 'Unterhaltung',
        categoryIcon: '🎬',
        categoryColor: '#FF9800',
        targetAmount: 150.00,
        currentAmount: 185.90,
        remainingAmount: -35.90,
        percentageUsed: 123.93,
        transactionCount: 6,
        lastTransactionDate: new Date('2025-10-22'),
        month: this.selectedMonth,
        year: this.selectedYear,
        createdAt: new Date('2025-10-01'),
        updatedAt: new Date('2025-10-22'),
        isActive: true
      },
      {
        id: '4',
        categoryId: 'cat_4',
        categoryName: 'Kleidung',
        categoryIcon: '👕',
        categoryColor: '#E91E63',
        targetAmount: 100.00,
        currentAmount: 45.99,
        remainingAmount: 54.01,
        percentageUsed: 45.99,
        transactionCount: 2,
        lastTransactionDate: new Date('2025-10-20'),
        month: this.selectedMonth,
        year: this.selectedYear,
        createdAt: new Date('2025-10-01'),
        updatedAt: new Date('2025-10-20'),
        isActive: true
      },
      {
        id: '5',
        categoryId: 'cat_5',
        categoryName: 'Gesundheit',
        categoryIcon: '🏥',
        categoryColor: '#00BCD4',
        targetAmount: 80.00,
        currentAmount: 25.50,
        remainingAmount: 54.50,
        percentageUsed: 31.88,
        transactionCount: 1,
        lastTransactionDate: new Date('2025-10-18'),
        month: this.selectedMonth,
        year: this.selectedYear,
        createdAt: new Date('2025-10-01'),
        updatedAt: new Date('2025-10-18'),
        isActive: true
      },
      {
        id: '6',
        categoryId: 'cat_6',
        categoryName: 'Bildung',
        categoryIcon: '📚',
        categoryColor: '#9C27B0',
        targetAmount: 60.00,
        currentAmount: 0.00,
        remainingAmount: 60.00,
        percentageUsed: 0.00,
        transactionCount: 0,
        lastTransactionDate: undefined,
        month: this.selectedMonth,
        year: this.selectedYear,
        createdAt: new Date('2025-10-01'),
        updatedAt: new Date('2025-10-01'),
        isActive: true
      }
    ];

    this.calculateMonthlyStats();
    this.checkEmptyState();
  }

  private calculateMonthlyStats() {
    if (this.budgets.length === 0) {
      this.monthlyStats = null;
      return;
    }

    const totalTarget = this.budgets.reduce((sum, budget) => sum + budget.targetAmount, 0);
    const totalSpent = this.budgets.reduce((sum, budget) => sum + budget.currentAmount, 0);
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
    if (budget.percentageUsed === 0) return 'info';
    if (budget.percentageUsed <= 50) return 'success';
    if (budget.percentageUsed <= 80) return 'info';
    if (budget.percentageUsed <= 100) return 'warning';
    return 'danger';
  }

  getBudgetStatusText(budget: BudgetWithStats): string {
    if (budget.percentageUsed === 0) return 'Nicht verwendet';
    if (budget.percentageUsed <= 50) return 'Auf Kurs';
    if (budget.percentageUsed <= 80) return 'Moderat';
    if (budget.percentageUsed <= 100) return 'Fast aufgebraucht';
    return 'Überschritten';
  }

  getSelectedMonthName(): string {
    return this.availableMonths.find(m => m.value === this.selectedMonth)?.label || '';
  }

  // Budget Actions
  createBudget(): void {
    const categories = this.getMockCategories();
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

  editBudget(budget: BudgetWithStats): void {
    const categories = this.getMockCategories();
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
      this.budgets = this.budgets.filter(b => b.id !== budget.id);
      this.calculateMonthlyStats();
      this.checkEmptyState();
      console.log('Budget deleted:', budget.categoryName);
    }
  }

  retry(): void {
    this.loadInitialData();
  }

  // Helper methods for dialog integration
  private getMockCategories(): Category[] {
    return [
      { id: 'cat_1', name: 'Lebensmittel', icon: '🛒', color: '#4CAF50', isActive: true },
      { id: 'cat_2', name: 'Transport', icon: '🚗', color: '#2196F3', isActive: true },
      { id: 'cat_3', name: 'Unterhaltung', icon: '🎬', color: '#FF9800', isActive: true },
      { id: 'cat_4', name: 'Kleidung', icon: '👕', color: '#E91E63', isActive: true },
      { id: 'cat_5', name: 'Gesundheit', icon: '🏥', color: '#00BCD4', isActive: true },
      { id: 'cat_6', name: 'Bildung', icon: '📚', color: '#9C27B0', isActive: true },
      { id: 'cat_7', name: 'Restaurants', icon: '🍽️', color: '#FF5722', isActive: true },
      { id: 'cat_8', name: 'Shopping', icon: '🛍️', color: '#673AB7', isActive: true },
      { id: 'cat_9', name: 'Reisen', icon: '✈️', color: '#00BCD4', isActive: true },
      { id: 'cat_10', name: 'Sonstiges', icon: '📦', color: '#607D8B', isActive: true }
    ];
  }

  private createBudgetFromDialog(budgetData: Partial<BudgetWithStats>): void {
    const categoryId = budgetData.categoryId || '';
    const categoryName = budgetData.categoryName || '';
    const targetAmount = budgetData.targetAmount || 0;
    const month = budgetData.month || this.selectedMonth;
    const year = budgetData.year || this.selectedYear;
    
    const newBudget: BudgetWithStats = {
      id: this.generateId(),
      categoryId,
      categoryName,
      categoryIcon: this.getCategoryIcon(categoryId),
      categoryColor: this.getCategoryColor(categoryId),
      targetAmount,
      currentAmount: 0,
      remainingAmount: targetAmount,
      percentageUsed: 0,
      transactionCount: 0,
      lastTransactionDate: undefined,
      month,
      year,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    this.budgets.unshift(newBudget);
    this.calculateMonthlyStats();
    this.checkEmptyState();
    
    console.log('Budget erstellt:', newBudget.categoryName);
  }

  private updateBudgetFromDialog(budgetId: string, budgetData: Partial<BudgetWithStats>): void {
    const index = this.budgets.findIndex(b => b.id === budgetId);
    if (index !== -1) {
      const currentAmount = this.budgets[index].currentAmount;
      const targetAmount = budgetData.targetAmount || 0;
      
      this.budgets[index] = {
        ...this.budgets[index],
        targetAmount,
        remainingAmount: targetAmount - currentAmount,
        percentageUsed: currentAmount > 0 ? (currentAmount / targetAmount) * 100 : 0,
        updatedAt: new Date()
      };
      
      this.calculateMonthlyStats();
      console.log('Budget aktualisiert:', this.budgets[index].categoryName);
    }
  }

  private getCategoryIcon(categoryId: string): string {
    const categories = this.getMockCategories();
    return categories.find(c => c.id === categoryId)?.icon || '📦';
  }

  private getCategoryColor(categoryId: string): string {
    const categories = this.getMockCategories();
    return categories.find(c => c.id === categoryId)?.color || '#607D8B';
  }

  private generateId(): string {
    return 'budget_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}
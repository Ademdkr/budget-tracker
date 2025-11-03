import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material imports
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';

// Chart.js imports
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

import { DashboardApiService, DashboardKPI, ChartData } from './dashboard-api.service';
import { AccountSelectionService } from '../shared/services/account-selection.service';
import { BaseComponent } from '../shared/components/base.component';
import { Subscription } from 'rxjs';

// Interfaces
export interface KPICard {
  title: string;
  value: number;
  icon: string;
  color: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}

export interface BudgetProgress {
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
  percentage: number;
  color: string;
  emoji: string;
}

export interface Transaction {
  date: Date;
  category: string;
  account: string;
  amount: number;
  note: string;
  type: 'income' | 'expense';
  categoryEmoji: string;
}

export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  net: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatChipsModule,
    BaseChartDirective,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent extends BaseComponent implements OnInit, OnDestroy {
  protected componentKey = 'dashboard';
  private dashboardApi = inject(DashboardApiService);
  private accountSelection = inject(AccountSelectionService);
  private cdr = inject(ChangeDetectorRef);

  // States
  isEmpty = false;

  // Data properties
  kpiCards: Array<
    DashboardKPI & { title: string; trend: { value: number; direction: 'up' | 'down' } }
  > = [];
  budgetProgress: Array<{
    budgetName: string;
    spent: number;
    limit: number;
    percentage: number;
    category: string;
    emoji: string;
    budgeted: number;
    remaining: number;
  }> = [];
  recentTransactions: Array<{
    id: string;
    date: Date;
    category: string;
    categoryEmoji: string;
    amount: number;
    note: string;
    type: 'income' | 'expense';
  }> = [];
  monthlyData: unknown[] = [];

  // Chart data
  pieChartData: ChartData = { labels: [], datasets: [] };
  lineChartData: ChartData = { labels: [], datasets: [] };

  // Chart options
  pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  lineChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Chart types - Fixed types for ng2-charts
  pieChartType = 'pie' as const;
  lineChartType = 'bar' as const;

  // Table columns
  transactionColumns: string[] = ['date', 'category', 'amount', 'note'];

  private initialLoadCompleted = false;
  private accountSubscription?: Subscription;

  ngOnInit() {
    // BaseComponent initialisieren
    this.initializeLoadingState();

    // Zuerst den AccountSelectionService initialisieren
    this.accountSelection.initialize();

    // Subscribe to account selection changes
    this.accountSubscription = this.accountSelection.selectedAccount$.subscribe(() => {
      // Nur neu laden wenn die initiale Ladung abgeschlossen ist
      if (this.initialLoadCompleted) {
        this.loadDashboardData();
      }
    });

    this.loadDashboardData();
  }

  loadDashboardData() {
    this.setLoading();

    const selectedAccountId = this.accountSelection.getSelectedAccountId();

    // Use the optimized getAllDashboardData method instead of multiple API calls
    this.dashboardApi
      .getAllDashboardData(selectedAccountId || undefined)
      .toPromise()
      .then((dashboardData) => {
        if (!dashboardData) return;

        // Map KPIs to include title and trend fields
        this.kpiCards = dashboardData.kpis.map((kpi) => ({
          ...kpi,
          title: kpi.label,
          trend: {
            value: kpi.change,
            direction: kpi.change >= 0 ? ('up' as const) : ('down' as const),
          },
        }));

        // Map budget progress to include missing fields
        this.budgetProgress = dashboardData.budgetProgress.map((budget) => ({
          ...budget,
          category: budget.budgetName,
          emoji: budget.icon || '💰',
          budgeted: budget.limit,
          remaining: budget.limit - budget.spent,
        }));

        // Set recent transactions
        this.recentTransactions = dashboardData.recentTransactions;

        // Set chart data
        this.pieChartData = dashboardData.statistics.categoryBreakdown;
        this.lineChartData = dashboardData.statistics.monthlyTrend;

        this.checkEmptyState();
        this.setSuccess(this.isEmpty);
        this.initialLoadCompleted = true;
        this.cdr.markForCheck();
      })
      .catch(() => {
        this.setError('Fehler beim Laden der Dashboard-Daten');
        this.initialLoadCompleted = true;
        this.cdr.markForCheck();
      });
  }

  private checkEmptyState() {
    this.isEmpty = this.recentTransactions.length === 0 && this.budgetProgress.length === 0;
  }

  retry() {
    this.loadDashboardData();
  }

  // TrackBy functions for performance optimization - using inherited methods
  trackByKPI = this.trackByUtils.trackByKPITitle.bind(this.trackByUtils);
  trackByBudget(
    index: number,
    budget: {
      budgetName: string;
      spent: number;
      limit: number;
      percentage: number;
      category: string;
      emoji: string;
      budgeted: number;
      remaining: number;
    },
  ): string {
    return budget.budgetName || index.toString();
  }
  trackByTransaction = this.trackByUtils.trackByTransactionId.bind(this.trackByUtils);

  formatCurrency(amount: number): string {
    return this.formatUtils.formatCurrency(Math.abs(amount)); // Immer positiv anzeigen
  }

  formatPercentage(percentage: number): string {
    return percentage.toFixed(1);
  }

  getProgressColor(percentage: number): string {
    if (percentage >= 90) return 'warn';
    if (percentage >= 70) return 'accent';
    return 'primary';
  }

  // Account Selection Methods
  getSelectedAccountName(): string {
    const selected = this.accountSelection.getSelectedAccount();
    return selected ? selected.name : '';
  }

  hasAccountSelection(): boolean {
    return this.accountSelection.hasSelection();
  }

  clearAccountFilter(): void {
    this.accountSelection.clearSelection().catch((err) => {
      console.error('Error clearing account filter:', err);
    });
  }

  ngOnDestroy() {
    // Cleanup subscriptions to prevent memory leaks and duplicate API calls during navigation
    if (this.accountSubscription) {
      this.accountSubscription.unsubscribe();
    }
  }
}

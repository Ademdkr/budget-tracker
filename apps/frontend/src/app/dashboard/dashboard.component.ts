import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material imports
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';

// Chart.js imports
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

import { DashboardApiService, DashboardKPI, ChartData } from './dashboard-api.service';

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
    MatTableModule,
    MatChipsModule,
    BaseChartDirective
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private dashboardApi = inject(DashboardApiService);

  // States
  isLoading = false;
  hasError = false;
  isEmpty = false;

  // Data properties
  kpiCards: Array<DashboardKPI & { title: string; trend: { value: number; direction: 'up' | 'down' } }> = [];
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
      }
    }
  };

  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  // Chart types - Fixed types for ng2-charts
  pieChartType = 'pie' as const;
  lineChartType = 'line' as const;

  // Table columns
  transactionColumns: string[] = ['date', 'category', 'amount', 'note'];

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isLoading = true;
    this.hasError = false;

    Promise.all([
      this.dashboardApi.getKPIs().toPromise(),
      this.dashboardApi.getBudgetProgress().toPromise(),
      this.dashboardApi.getStatistics().toPromise(),
      this.dashboardApi.getRecentTransactions(10).toPromise()
    ]).then(([kpis, budgetProgress, stats, transactions]) => {
      // Map KPIs to include title and trend fields
      this.kpiCards = (kpis ?? []).map(kpi => ({
        ...kpi,
        title: kpi.label,
        trend: {
          value: kpi.change,
          direction: kpi.change >= 0 ? 'up' as const : 'down' as const
        }
      }));

      // Map budget progress to include missing fields
      this.budgetProgress = (budgetProgress ?? []).map(budget => ({
        ...budget,
        category: budget.budgetName,
        emoji: budget.icon || '💰',
        budgeted: budget.limit,
        remaining: budget.limit - budget.spent
      }));

      // Set recent transactions
      this.recentTransactions = transactions ?? [];

      this.pieChartData = stats?.categoryBreakdown ?? { labels: [], datasets: [] };
      this.lineChartData = stats?.monthlyTrend ?? { labels: [], datasets: [] };
      this.checkEmptyState();
      this.isLoading = false;
    }).catch(() => {
      this.hasError = true;
      this.isLoading = false;
    });
  }


  private checkEmptyState() {
    this.isEmpty = this.recentTransactions.length === 0 && this.budgetProgress.length === 0;
  }

  retry() {
    this.loadDashboardData();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(Math.abs(amount)); // Immer positiv anzeigen
  }

  formatPercentage(percentage: number): string {
    return percentage.toFixed(1);
  }

  getProgressColor(percentage: number): string {
    if (percentage >= 90) return 'warn';
    if (percentage >= 70) return 'accent';
    return 'primary';
  }
}

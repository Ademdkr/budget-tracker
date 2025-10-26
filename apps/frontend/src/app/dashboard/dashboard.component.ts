import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';

// Angular Material imports
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';

// Chart.js imports
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

import { AuthService } from '../auth/auth.service';

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
  private authService = inject(AuthService);

  // States
  isLoading = false;
  hasError = false;
  isEmpty = false;

  // Data properties
  kpiCards: KPICard[] = [];
  budgetProgress: BudgetProgress[] = [];
  recentTransactions: Transaction[] = [];
  monthlyData: MonthlyData[] = [];

  // Chart data
  pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: []
  };
  
  lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };

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
  transactionColumns: string[] = ['date', 'category', 'account', 'amount', 'note'];

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isLoading = true;
    this.hasError = false;

    // Simulate API call
    setTimeout(() => {
      try {
        this.loadKPICards();
        this.loadBudgetProgress();
        this.loadRecentTransactions();
        this.loadChartData();
        this.checkEmptyState();
        
        this.isLoading = false;
      } catch {
        this.hasError = true;
        this.isLoading = false;
      }
    }, 1500);
  }

  private loadKPICards() {
    // Mock data - in real app, this would come from API
    this.kpiCards = [
      {
        title: 'Einnahmen (Monat)',
        value: 3500.00,
        icon: 'trending_up',
        color: 'success',
        trend: { value: 12.5, direction: 'up' }
      },
      {
        title: 'Ausgaben (Monat)',
        value: 2750.50,
        icon: 'trending_down',
        color: 'error',
        trend: { value: 8.2, direction: 'down' }
      },
      {
        title: 'Saldo (Monat)',
        value: 749.50,
        icon: 'account_balance',
        color: 'primary',
        trend: { value: 15.8, direction: 'up' }
      }
    ];
  }

  private loadBudgetProgress() {
    // Mock data
    this.budgetProgress = [
      {
        category: 'Lebensmittel',
        budgeted: 500,
        spent: 320,
        remaining: 180,
        percentage: 64,
        color: 'primary',
        emoji: '🍕'
      },
      {
        category: 'Transport',
        budgeted: 200,
        spent: 180,
        remaining: 20,
        percentage: 90,
        color: 'warn',
        emoji: '🚗'
      },
      {
        category: 'Unterhaltung',
        budgeted: 150,
        spent: 75,
        remaining: 75,
        percentage: 50,
        color: 'accent',
        emoji: '🎬'
      },
      {
        category: 'Gesundheit',
        budgeted: 100,
        spent: 45,
        remaining: 55,
        percentage: 45,
        color: 'primary',
        emoji: '💊'
      }
    ];
  }

  private loadRecentTransactions() {
    // Mock data
    this.recentTransactions = [
      {
        date: new Date('2025-10-25'),
        category: 'Lebensmittel',
        account: 'Sparkasse',
        amount: -45.50,
        note: 'Wocheneinkauf Rewe',
        type: 'expense',
        categoryEmoji: '🍕'
      },
      {
        date: new Date('2025-10-24'),
        category: 'Gehalt',
        account: 'Sparkasse',
        amount: 3500.00,
        note: 'Monatsgehalt Oktober',
        type: 'income',
        categoryEmoji: '💰'
      },
      {
        date: new Date('2025-10-23'),
        category: 'Transport',
        account: 'DKB',
        amount: -89.20,
        note: 'Tankstelle Shell',
        type: 'expense',
        categoryEmoji: '⛽'
      },
      {
        date: new Date('2025-10-22'),
        category: 'Unterhaltung',
        account: 'Sparkasse',
        amount: -25.00,
        note: 'Netflix Abo',
        type: 'expense',
        categoryEmoji: '🎬'
      },
      {
        date: new Date('2025-10-21'),
        category: 'Lebensmittel',
        account: 'Sparkasse',
        amount: -12.80,
        note: 'Bäckerei',
        type: 'expense',
        categoryEmoji: '🥖'
      }
    ];
  }

  private loadChartData() {
    // Pie chart data - expenses by category
    const expensesByCategory = this.budgetProgress.map(budget => ({
      label: budget.category,
      value: budget.spent
    }));

    this.pieChartData = {
      labels: expensesByCategory.map(item => item.label),
      datasets: [{
        data: expensesByCategory.map(item => item.value),
        backgroundColor: [
          '#1976d2',
          '#f44336',
          '#ff9800',
          '#4caf50',
          '#9c27b0',
          '#00bcd4'
        ]
      }]
    };

    // Line chart data - monthly trends
    this.monthlyData = [
      { month: 'Mai', income: 3200, expense: 2800, net: 400 },
      { month: 'Juni', income: 3300, expense: 2900, net: 400 },
      { month: 'Juli', income: 3100, expense: 2750, net: 350 },
      { month: 'August', income: 3400, expense: 2850, net: 550 },
      { month: 'September', income: 3350, expense: 2700, net: 650 },
      { month: 'Oktober', income: 3500, expense: 2750, net: 750 }
    ];

    this.lineChartData = {
      labels: this.monthlyData.map(data => data.month),
      datasets: [
        {
          label: 'Einnahmen',
          data: this.monthlyData.map(data => data.income),
          borderColor: '#4caf50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.1
        },
        {
          label: 'Ausgaben',
          data: this.monthlyData.map(data => data.expense),
          borderColor: '#f44336',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          tension: 0.1
        },
        {
          label: 'Saldo',
          data: this.monthlyData.map(data => data.net),
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          tension: 0.1
        }
      ]
    };
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
    }).format(amount);
  }

  getProgressColor(percentage: number): string {
    if (percentage >= 90) return 'warn';
    if (percentage >= 70) return 'accent';
    return 'primary';
  }
}

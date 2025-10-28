import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ApiService } from '../shared/services/api.service';
import { TransactionsApiService } from '../transactions/transactions-api.service';
import { CategoriesApiService, Category } from '../categories/categories-api.service';
import { BudgetsApiService } from '../budgets/budgets-api.service';
// import { AccountsApiService } from '../accounts/accounts-api.service';

export interface DashboardKPI {
  label: string;
  value: number;
  change: number;
  icon: string;
  color: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
  }[];
}

export interface DashboardStatistics {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savingsRate: number;
  transactionCount: number;
  categoryBreakdown: ChartData;
  monthlyTrend: ChartData;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardApiService {
  private api = inject(ApiService);
  private transactionsApi = inject(TransactionsApiService);
  private categoriesApi = inject(CategoriesApiService);
  private budgetsApi = inject(BudgetsApiService);
  // private accountsApi = inject(AccountsApiService);

  /**
   * Get dashboard KPIs
   */
  getKPIs(accountId?: string): Observable<DashboardKPI[]> {
    // TODO: Replace with dedicated backend endpoint
    const filters = accountId ? { accountId } : undefined;
    return this.transactionsApi.getAll(filters).pipe(
      map((transactions) => {
        // Beträge sind in DB als positive Zahlen gespeichert
        const income = transactions
          .filter(t => t.type === 'INCOME')
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const expenses = transactions
          .filter(t => t.type === 'EXPENSE')
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const balance = income - expenses;

        const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

        return [
          {
            label: 'Gesamteinnahmen',
            value: income,
            change: 12.5,
            icon: 'trending_up',
            color: 'success'
          },
          {
            label: 'Gesamtausgaben',
            value: expenses,
            change: -8.2,
            icon: 'trending_down',
            color: 'error'
          },
          {
            label: 'Bilanz',
            value: balance,
            change: 5.3,
            icon: 'account_balance',
            color: 'primary'
          },
          {
            label: 'Sparquote',
            value: savingsRate,
            change: 3.1,
            icon: 'savings',
            color: 'accent'
          }
        ];
      })
    );
  }

  /**
   * Get comprehensive dashboard statistics
   */
  getStatistics(startDate?: string, endDate?: string, accountId?: string): Observable<DashboardStatistics> {
    // TODO: Replace with dedicated backend endpoint
    const filters: { startDate?: string; endDate?: string; accountId?: string } = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (accountId) filters.accountId = accountId;

    return forkJoin({
      transactions: this.transactionsApi.getAll(filters),
      categories: this.categoriesApi.getAll()
    }).pipe(
      map(({ transactions, categories }) => {
        // Beträge sind in DB als positive Zahlen gespeichert
        const income = transactions
          .filter(t => t.type === 'INCOME')
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const expenses = transactions
          .filter(t => t.type === 'EXPENSE')
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const balance = income - expenses;
        const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

        // Category breakdown
        const categoryMap = new Map<string, number>();
        transactions
          .filter(t => t.categoryId !== undefined)
          .filter(t => t.type === 'EXPENSE')
          .forEach(t => {
            const current = categoryMap.get(t.categoryId!) || 0;
            categoryMap.set(t.categoryId!, current + Math.abs(t.amount));
          });

        const categoryBreakdown: ChartData = {
          labels: Array.from(categoryMap.keys()).map(id => {
            const cat = categories.find(c => c.id === id);
            return cat?.name || 'Unknown';
          }),
          datasets: [{
            label: 'Ausgaben nach Kategorie',
            data: Array.from(categoryMap.values()),
            backgroundColor: Array.from(categoryMap.keys()).map(id => {
              const cat = categories.find(c => c.id === id);
              return cat?.color || '#cccccc';
            })
          }]
        };

        // Monthly trend (simplified - needs proper month grouping)
        const monthlyTrend: ChartData = {
          labels: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun'],
          datasets: [
            {
              label: 'Einnahmen',
              data: [0, 0, 0, 0, 0, income],
              borderColor: '#4caf50',
              backgroundColor: 'rgba(76, 175, 80, 0.1)'
            },
            {
              label: 'Ausgaben',
              data: [0, 0, 0, 0, 0, expenses],
              borderColor: '#f44336',
              backgroundColor: 'rgba(244, 67, 54, 0.1)'
            }
          ]
        };

        return {
          totalIncome: income,
          totalExpenses: expenses,
          balance,
          savingsRate,
          transactionCount: transactions.length,
          categoryBreakdown,
          monthlyTrend
        };
      })
    );
  }

  /**
   * Get monthly comparison data
   * TODO: Implement with backend endpoint, currently returns mock data
   */
  getMonthlyComparison(accountId?: string): Observable<ChartData> {
    // TODO: Implement with backend endpoint
    const filters = accountId ? { accountId } : undefined;
    return this.transactionsApi.getAll(filters).pipe(
  map(() => ({
  labels: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun'],
  datasets: [
          {
            label: 'Einnahmen',
            data: [3200, 3500, 3100, 3800, 3600, 4000],
            borderColor: '#4caf50'
          },
          {
            label: 'Ausgaben',
            data: [2100, 2300, 2500, 2200, 2400, 2600],
            borderColor: '#f44336'
          }
        ]
      }))
    );
  }

  /**
   * Get budget progress overview
   * Shows spending progress for actual Budget entities created via /budgets
   */
  getBudgetProgress(accountId?: string): Observable<Array<{
    budgetName: string;
    spent: number;
    limit: number;
    percentage: number;
    icon: string;
  }>> {
    const filters = accountId ? { accountId } : undefined;
    return forkJoin({
      budgets: this.budgetsApi.getAll(),
      transactions: this.transactionsApi.getAll(filters),
      categories: this.categoriesApi.getAll()
    }).pipe(
      map(({ budgets, transactions, categories }) => {
        // Berechne Gesamtausgaben für Einnahmen-Budgets (analog zur Budget-Komponente)
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const periodStart = new Date(currentYear, currentMonth, 1);
        const periodEnd = new Date(currentYear, currentMonth + 1, 0);

        const totalExpensesInPeriod = transactions
          .filter(t =>
            t.type === 'EXPENSE' &&
            new Date(t.date) >= periodStart &&
            new Date(t.date) <= periodEnd
          )
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        return budgets.map(budget => {
          const budgetStart = new Date(budget.startDate);
          const budgetEnd = budget.endDate ? new Date(budget.endDate) : new Date(budgetStart.getFullYear(), budgetStart.getMonth() + 1, 0);

          // Prüfe, ob dieses Budget INCOME-Transaktionen hat
          const hasIncomeTransactions = transactions.some(t =>
            t.budgetId === budget.id &&
            t.type === 'INCOME' &&
            new Date(t.date) >= budgetStart &&
            new Date(t.date) <= budgetEnd
          );

          // Calculate budget-specific expenses
          const budgetExpenses = transactions
            .filter(t =>
              t.budgetId === budget.id &&
              t.type === 'EXPENSE' &&
              new Date(t.date) >= budgetStart &&
              new Date(t.date) <= budgetEnd
            )
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

          // Für Einnahmen-Budgets: Gesamtausgaben aller Budgets
          // Für Ausgaben-Budgets: Nur die Ausgaben dieses Budgets
          const spent = hasIncomeTransactions ? totalExpensesInPeriod : budgetExpenses;

          const limit = budget.totalAmount || 0;
          const percentage = limit > 0 ? (spent / limit) * 100 : 0;

          // Intelligente Icon-Zuordnung basierend auf Budget-Namen
          const matchingCategory = this.findCategoryByBudgetName(budget.name, categories);
          const icon = matchingCategory?.icon || matchingCategory?.emoji || '💰';

          return {
            budgetName: budget.name,
            spent,
            limit,
            percentage: Math.min(Math.round(percentage * 10) / 10, 100),
            icon
          };
        });
      })
    );
  }

  /**
   * Get recent transactions for dashboard
   */
  getRecentTransactions(limit: number = 10, accountId?: string): Observable<Array<{
    id: string;
    date: Date;
    category: string;
    categoryEmoji: string;
    amount: number;
    note: string;
    type: 'income' | 'expense';
  }>> {
    const filters = accountId ? { accountId } : undefined;
    return forkJoin({
      transactions: this.transactionsApi.getAll(filters),
      categories: this.categoriesApi.getAll()
    }).pipe(
      map(({ transactions, categories }) => {
        // Sort by date descending and take limit
        const sortedTransactions = transactions
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, limit);

        // Map with category information
        return sortedTransactions.map(transaction => {
          const category = categories.find(c => c.id === transaction.categoryId);
          return {
            id: transaction.id,
            date: new Date(transaction.date),
            category: category?.name || 'Unbekannt',
            categoryEmoji: category?.icon || category?.emoji || '📝',
            amount: transaction.amount,
            note: transaction.description || transaction.note || '',
            type: transaction.type.toLowerCase() as 'income' | 'expense'
          };
        });
      })
    );
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
}

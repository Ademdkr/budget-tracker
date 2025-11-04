import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of } from 'rxjs';
import { TransactionsApiService } from '../transactions/transactions-api.service';
import { CategoriesApiService } from '../categories/categories-api.service';
import { BudgetsApiService } from '../budgets/budgets-api.service';

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
  providedIn: 'root',
})
export class DashboardApiService {
  private transactionsApi = inject(TransactionsApiService);
  private categoriesApi = inject(CategoriesApiService);
  private budgetsApi = inject(BudgetsApiService);

  /**
   * Get all dashboard data with shared categories loading (optimized)
   * Only shows data for the current month
   */
  getAllDashboardData(accountId?: string): Observable<{
    kpis: DashboardKPI[];
    statistics: DashboardStatistics;
    budgetProgress: Array<{
      budgetName: string;
      spent: number;
      limit: number;
      percentage: number;
      icon: string;
    }>;
    recentTransactions: Array<{
      id: string;
      date: Date;
      category: string;
      categoryEmoji: string;
      amount: number;
      note: string;
      type: 'income' | 'expense';
    }>;
  }> {
    // Wenn kein Account ausgewählt ist, gebe leere Daten zurück
    if (!accountId) {
      return of({
        kpis: [],
        statistics: {
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0,
          savingsRate: 0,
          transactionCount: 0,
          categoryBreakdown: { labels: [], datasets: [] },
          monthlyTrend: { labels: [], datasets: [] },
        },
        budgetProgress: [],
        recentTransactions: [],
      });
    }

    const filters = accountId ? { accountId } : undefined;

    return forkJoin({
      transactions: this.transactionsApi.getAll(filters),
      categories: this.categoriesApi.getAll(accountId),
      budgets: this.budgetsApi.getAll(),
    }).pipe(
      map(({ transactions, categories, budgets }) => {
        // Filter transactions to current month only
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const monthStart = new Date(currentYear, currentMonth, 1);
        const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

        const currentMonthTransactions = transactions.filter((t) => {
          const tDate = new Date(t.date);
          return tDate >= monthStart && tDate <= monthEnd;
        });

        // Replace transactions with current month transactions for all calculations
        transactions = currentMonthTransactions;
        // Build category lookup maps once
        const catTypeById = new Map<string, 'INCOME' | 'EXPENSE'>();
        const catMetaById = new Map<
          string,
          { name?: string; color?: string; emoji?: string; icon?: string }
        >();
        categories.forEach((c) => {
          if (c.id) {
            catTypeById.set(String(c.id), c.transactionType || 'EXPENSE');
            catMetaById.set(String(c.id), {
              name: c.name,
              color: c.color,
              emoji: c.emoji,
              icon: c.icon,
            });
          }
        });

        // Calculate KPIs
        const totals = transactions.reduce(
          (acc, t) => {
            const cid = t.categoryId != null ? String(t.categoryId) : undefined;
            const tType = cid ? catTypeById.get(cid) : undefined;
            const amount = Math.abs(t.amount || 0);
            if (tType === 'INCOME') acc.income += amount;
            else if (tType === 'EXPENSE') acc.expenses += amount;
            return acc;
          },
          { income: 0, expenses: 0 },
        );

        const balance = totals.income - totals.expenses;
        const savingsRate =
          totals.income > 0 ? ((totals.income - totals.expenses) / totals.income) * 100 : 0;

        const kpis: DashboardKPI[] = [
          {
            label: 'Gesamteinnahmen',
            value: totals.income,
            change: 12.5,
            icon: 'trending_up',
            color: 'success',
          },
          {
            label: 'Gesamtausgaben',
            value: totals.expenses,
            change: -8.2,
            icon: 'trending_down',
            color: 'error',
          },
          {
            label: 'Bilanz',
            value: balance,
            change: 5.3,
            icon: 'account_balance',
            color: 'primary',
          },
          { label: 'Sparquote', value: savingsRate, change: 3.1, icon: 'savings', color: 'accent' },
        ];

        // Calculate statistics
        let income = 0;
        let expenses = 0;
        const categoryMap = new Map<string, number>();

        transactions.forEach((t) => {
          const cid = t.categoryId != null ? String(t.categoryId) : undefined;
          const tType = cid ? catTypeById.get(cid) : undefined;
          const amount = Math.abs(t.amount || 0);
          if (tType === 'INCOME') income += amount;
          else if (tType === 'EXPENSE') {
            expenses += amount;
            if (cid) categoryMap.set(cid, (categoryMap.get(cid) || 0) + amount);
          }
        });

        const categoryBreakdown: ChartData = {
          labels: Array.from(categoryMap.keys()).map(
            (id) => catMetaById.get(id)?.name || 'Unknown',
          ),
          datasets: [
            {
              label: 'Ausgaben nach Kategorie',
              data: Array.from(categoryMap.values()),
              backgroundColor: Array.from(categoryMap.keys()).map(
                (id) => catMetaById.get(id)?.color || '#cccccc',
              ),
            },
          ],
        };

        // Category spending breakdown as bar chart for current month
        const categorySpendingData = Array.from(categoryMap.entries())
          .sort((a, b) => b[1] - a[1]) // Sort by amount descending
          .slice(0, 10); // Top 10 categories

        const monthlyTrend: ChartData = {
          labels: categorySpendingData.map(([id]) => catMetaById.get(id)?.name || 'Unbekannt'),
          datasets: [
            {
              label: 'Ausgaben',
              data: categorySpendingData.map(([, amount]) => amount),
              borderColor: '#f44336',
              backgroundColor: categorySpendingData.map(
                ([id]) => catMetaById.get(id)?.color || '#f44336',
              ),
              borderWidth: 1,
            },
          ],
        };

        const statistics: DashboardStatistics = {
          totalIncome: income,
          totalExpenses: expenses,
          balance,
          savingsRate,
          transactionCount: transactions.length,
          categoryBreakdown,
          monthlyTrend,
        };

        // Calculate budget progress - using currentMonth/currentYear from above
        const budgetMonth = currentMonth + 1; // Convert from 0-based to 1-based
        const budgetYear = currentYear;
        const periodStart = new Date(budgetYear, budgetMonth - 1, 1);
        const periodEnd = new Date(budgetYear, budgetMonth, 0);
        const allowedCategoryIds = new Set((categories ?? []).map((c) => String(c.id)));

        const budgetProgress = budgets
          .filter((budget) => budget.month === budgetMonth && budget.year === budgetYear)
          .filter((budget) => !accountId || allowedCategoryIds.has(String(budget.categoryId)))
          .map((budget) => {
            const budgetStart = new Date(budget.year, budget.month - 1, 1);
            const budgetEnd = new Date(budget.year, budget.month, 0);

            const budgetCategoryId = budget.categoryId;
            const categoryTransactionsInMonth = transactions.filter(
              (t) =>
                String(t.categoryId) === String(budgetCategoryId) &&
                new Date(t.date) >= budgetStart &&
                new Date(t.date) <= budgetEnd,
            );

            const budgetExpenses = categoryTransactionsInMonth
              .filter((t) => {
                const cid = t.categoryId != null ? String(t.categoryId) : undefined;
                const tType = cid ? catTypeById.get(cid) : undefined;
                return tType === 'EXPENSE';
              })
              .reduce((sum, t) => sum + Math.abs(t.amount), 0);

            const hasIncomeTransactions = (() => {
              const cid = budgetCategoryId != null ? String(budgetCategoryId) : undefined;
              const tType = cid ? catTypeById.get(cid) : undefined;
              return tType === 'INCOME';
            })();

            const totalExpensesInPeriod = transactions
              .filter((t) => {
                const cid = t.categoryId != null ? String(t.categoryId) : undefined;
                const tType = cid ? catTypeById.get(cid) : undefined;
                return (
                  tType === 'EXPENSE' &&
                  new Date(t.date) >= periodStart &&
                  new Date(t.date) <= periodEnd
                );
              })
              .reduce((sum, t) => sum + Math.abs(t.amount), 0);

            const spent = hasIncomeTransactions ? totalExpensesInPeriod : budgetExpenses;
            const limit = Number(budget.totalAmount) || 0;
            const percentage = limit > 0 ? (spent / limit) * 100 : 0;

            const matchingCategoryId = String(budget.categoryId || budget.category?.id);
            const matchingMeta = catMetaById.get(matchingCategoryId) || {};
            const icon = matchingMeta.icon || matchingMeta.emoji || '??';

            return {
              budgetName: matchingMeta.name || `Budget ${budget.id}`,
              spent,
              limit,
              percentage: Math.min(Math.round(percentage * 10) / 10, 100),
              icon,
            };
          });

        // Calculate recent transactions
        const sortedTransactions = transactions
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10);

        const recentTransactions = sortedTransactions.map((transaction) => {
          const cid = transaction.categoryId != null ? String(transaction.categoryId) : undefined;
          const meta = cid ? catMetaById.get(cid) : undefined;
          const tType = cid ? catTypeById.get(cid) : undefined;
          return {
            id: transaction.id,
            date: new Date(transaction.date),
            category: meta?.name || 'Unbekannt',
            categoryEmoji: meta?.icon || meta?.emoji || '??',
            amount: transaction.amount,
            note: transaction.note || '',
            type: (tType === 'INCOME' ? 'income' : 'expense') as 'income' | 'expense',
          };
        });

        return {
          kpis,
          statistics,
          budgetProgress,
          recentTransactions,
        };
      }),
    );
  }

  /**
   * Get dashboard KPIs (deprecated - use getAllDashboardData instead)
   * @deprecated Use getAllDashboardData for better performance
   */
  getKPIs(accountId?: string): Observable<DashboardKPI[]> {
    return this.getAllDashboardData(accountId).pipe(map((data) => data.kpis));
  }

  /**
   * Get comprehensive dashboard statistics (deprecated - use getAllDashboardData instead)
   * @deprecated Use getAllDashboardData for better performance
   */
  getStatistics(
    startDate?: string,
    endDate?: string,
    accountId?: string,
  ): Observable<DashboardStatistics> {
    return this.getAllDashboardData(accountId).pipe(map((data) => data.statistics));
  }

  /**
   * Get monthly comparison data (mock)
   */
  getMonthlyComparison(accountId?: string): Observable<ChartData> {
    // Wenn kein Account ausgewählt ist, gebe leere Daten zurück
    if (!accountId) {
      return of({
        labels: [],
        datasets: [],
      });
    }

    const filters = accountId ? { accountId } : undefined;
    return this.transactionsApi.getAll(filters).pipe(
      map(() => ({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Einnahmen',
            data: [3200, 3500, 3100, 3800, 3600, 4000],
            borderColor: '#4caf50',
          },
          { label: 'Ausgaben', data: [2100, 2300, 2500, 2200, 2400, 2600], borderColor: '#f44336' },
        ],
      })),
    );
  }

  /**
   * Get budget progress overview (deprecated - use getAllDashboardData instead)
   * @deprecated Use getAllDashboardData for better performance
   */
  getBudgetProgress(accountId?: string): Observable<
    Array<{
      budgetName: string;
      spent: number;
      limit: number;
      percentage: number;
      icon: string;
    }>
  > {
    return this.getAllDashboardData(accountId).pipe(map((data) => data.budgetProgress));
  }

  /**
   * Get recent transactions for dashboard (deprecated - use getAllDashboardData instead)
   * @deprecated Use getAllDashboardData for better performance
   */
  getRecentTransactions(
    limit: number = 10,
    accountId?: string,
  ): Observable<
    Array<{
      id: string;
      date: Date;
      category: string;
      categoryEmoji: string;
      amount: number;
      note: string;
      type: 'income' | 'expense';
    }>
  > {
    return this.getAllDashboardData(accountId).pipe(
      map((data) => data.recentTransactions.slice(0, limit)),
    );
  }
}

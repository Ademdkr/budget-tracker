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

/**
 * KPI-Karte mit Trend-Information
 */
export interface KPICard {
  /** Titel des KPI */
  title: string;
  /** Numerischer Wert */
  value: number;
  /** Icon-Name */
  icon: string;
  /** Farbschema */
  color: string;
  /** Trend-Daten (optional) */
  trend?: {
    /** Prozentwert der Änderung */
    value: number;
    /** Richtung (auf/ab) */
    direction: 'up' | 'down';
  };
}

/**
 * Budget-Fortschritt für eine Kategorie
 */
export interface BudgetProgress {
  /** Kategoriename */
  category: string;
  /** Budgetierter Betrag */
  budgeted: number;
  /** Bereits ausgegebener Betrag */
  spent: number;
  /** Verbleibender Betrag */
  remaining: number;
  /** Prozentsatz des verbrauchten Budgets */
  percentage: number;
  /** Farbcode der Kategorie */
  color: string;
  /** Emoji/Icon der Kategorie */
  emoji: string;
}

/**
 * Transaktions-Daten für Dashboard-Tabelle
 */
export interface Transaction {
  /** Transaktionsdatum */
  date: Date;
  /** Kategoriename */
  category: string;
  /** Kontoname */
  account: string;
  /** Betrag */
  amount: number;
  /** Notiz/Beschreibung */
  note: string;
  /** Typ (Einnahme/Ausgabe) */
  type: 'income' | 'expense';
  /** Kategorie-Emoji */
  categoryEmoji: string;
}

/**
 * Monatliche Daten für Vergleichs-Charts
 */
export interface MonthlyData {
  /** Monatsname */
  month: string;
  /** Einnahmen */
  income: number;
  /** Ausgaben */
  expense: number;
  /** Netto (Einnahmen - Ausgaben) */
  net: number;
}

/**
 * Dashboard-Komponente mit Finanzübersicht
 *
 * Funktionalität:
 * - Zeigt KPI-Karten (Einnahmen, Ausgaben, Bilanz, Sparquote)
 * - Visualisiert Budget-Fortschritt pro Kategorie
 * - Listet letzte Transaktionen
 * - Zeigt Charts (Pie Chart für Kategorien, Bar Chart für Trends)
 * - Account-basierte Filterung
 * - Automatisches Neuladen bei Account-Wechsel
 *
 * Features:
 * - OnPush Change Detection für Performance
 * - Extends BaseComponent für Utility-Methoden
 * - Chart.js Integration mit ng2-charts
 * - Material Design Komponenten
 * - Empty State Handling
 * - Error State mit Retry-Funktion
 * - Loading State Management
 *
 * @example
 * ```typescript
 * // Wird durch Routing geladen
 * {
 *   path: 'dashboard',
 *   loadComponent: () => import('./dashboard.component').then(m => m.DashboardComponent)
 * }
 * ```
 */
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
  /** Component-Key für LoadingStateService */
  protected componentKey = 'dashboard';

  /** Dashboard-API Service */
  private dashboardApi = inject(DashboardApiService);
  /** Account-Selection Service */
  private accountSelection = inject(AccountSelectionService);
  /** ChangeDetectorRef für manuelle Change Detection */
  private cdr = inject(ChangeDetectorRef);

  /** Flag für Empty State */
  isEmpty = false;

  /**
   * KPI-Karten mit Trend-Informationen
   * Enthält Einnahmen, Ausgaben, Bilanz und Sparquote
   */
  kpiCards: Array<
    DashboardKPI & { title: string; trend: { value: number; direction: 'up' | 'down' } }
  > = [];

  /**
   * Budget-Fortschritt pro Kategorie
   * Zeigt ausgegeben vs. budgetiert
   */
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

  /**
   * Letzte Transaktionen für Dashboard-Tabelle
   */
  recentTransactions: Array<{
    id: string;
    date: Date;
    category: string;
    categoryEmoji: string;
    amount: number;
    note: string;
    type: 'income' | 'expense';
  }> = [];

  /**
   * Monatsdaten (aktuell nicht verwendet)
   */
  monthlyData: unknown[] = [];

  /**
   * Chart-Daten für Pie Chart (Kategorie-Breakdown)
   */
  pieChartData: ChartData = { labels: [], datasets: [] };

  /**
   * Chart-Daten für Bar Chart (Monatlicher Trend)
   */
  lineChartData: ChartData = { labels: [], datasets: [] };

  /**
   * Konfiguration für Pie Chart
   */
  pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  /**
   * Konfiguration für Bar Chart
   */
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

  /** Chart-Typ für Pie Chart */
  pieChartType = 'pie' as const;
  /** Chart-Typ für Bar Chart */
  lineChartType = 'bar' as const;

  /** Tabellen-Spalten für Transaktions-Tabelle */
  transactionColumns: string[] = ['date', 'category', 'amount', 'note'];

  /** Flag ob initiale Ladung abgeschlossen ist */
  private initialLoadCompleted = false;
  /** Subscription für Account-Änderungen */
  private accountSubscription?: Subscription;

  /**
   * Lifecycle-Hook: Initialisierung der Komponente
   * - Initialisiert LoadingState
   * - Initialisiert AccountSelectionService
   * - Abonniert Account-Änderungen
   * - Lädt Dashboard-Daten
   */
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

  /**
   * Lädt alle Dashboard-Daten vom API
   * - Ruft optimierte getAllDashboardData Methode auf
   * - Mappt Daten zu Component-Properties
   * - Behandelt Empty State
   * - Setzt Loading/Success/Error States
   */
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

  /**
   * Prüft ob Dashboard leer ist (keine Transaktionen und Budgets)
   * @private
   */
  private checkEmptyState() {
    this.isEmpty = this.recentTransactions.length === 0 && this.budgetProgress.length === 0;
  }

  /**
   * Retry-Methode zum erneuten Laden bei Fehler
   * Implementiert abstrakte Methode von BaseComponent
   */
  retry() {
    this.loadDashboardData();
  }

  /**
   * TrackBy-Funktion für KPI-Karten
   * Nutzt geerbte Methode von BaseComponent
   */
  trackByKPI = this.trackByUtils.trackByKPITitle.bind(this.trackByUtils);

  /**
   * TrackBy-Funktion für Budget-Fortschritt
   *
   * @param index - Array-Index
   * @param budget - Budget-Element
   * @returns Eindeutiger Identifier (budgetName oder Index)
   */
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

  /**
   * TrackBy-Funktion für Transaktionen
   * Nutzt geerbte Methode von BaseComponent
   */
  trackByTransaction = this.trackByUtils.trackByTransactionId.bind(this.trackByUtils);

  /**
   * Formatiert einen Betrag als Währung
   * Nutzt geerbte Methode von BaseComponent
   *
   * @param amount - Zu formatierender Betrag
   * @returns Formatierter Währungsstring (immer positiv)
   */
  formatCurrency(amount: number): string {
    return this.formatUtils.formatCurrency(Math.abs(amount)); // Immer positiv anzeigen
  }

  /**
   * Formatiert einen Prozentsatz
   *
   * @param percentage - Prozentsatz
   * @returns Formatierter String mit einer Dezimalstelle
   */
  formatPercentage(percentage: number): string {
    return percentage.toFixed(1);
  }

  /**
   * Bestimmt Fortschrittsbalken-Farbe basierend auf Prozentsatz
   *
   * @param percentage - Prozentsatz des Budget-Verbrauchs
   * @returns Material Color Theme (warn/accent/primary)
   */
  getProgressColor(percentage: number): string {
    if (percentage >= 90) return 'warn';
    if (percentage >= 70) return 'accent';
    return 'primary';
  }

  /**
   * Gibt den Namen des ausgewählten Accounts zurück
   *
   * @returns Account-Name oder leerer String
   */
  getSelectedAccountName(): string {
    const selected = this.accountSelection.getSelectedAccount();
    return selected ? selected.name : '';
  }

  /**
   * Prüft ob ein Account ausgewählt ist
   *
   * @returns true wenn Account ausgewählt
   */
  hasAccountSelection(): boolean {
    return this.accountSelection.hasSelection();
  }

  /**
   * Löscht den Account-Filter
   * Zeigt alle Accounts
   */
  clearAccountFilter(): void {
    this.accountSelection.clearSelection().catch((err) => {
      console.error('Error clearing account filter:', err);
    });
  }

  /**
   * Lifecycle-Hook: Cleanup beim Zerstören der Komponente
   * Verhindert Memory Leaks und doppelte API-Calls bei Navigation
   */
  ngOnDestroy() {
    // Cleanup subscriptions to prevent memory leaks and duplicate API calls during navigation
    if (this.accountSubscription) {
      this.accountSubscription.unsubscribe();
    }
  }
}

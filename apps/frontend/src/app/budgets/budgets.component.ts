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
/**
 * Budget mit Statistiken-Schnittstelle
 */
export interface BudgetWithStats {
  /** Budget-ID */
  id: string;
  /** Kategorie-ID */
  categoryId: string;
  /** Kategoriename */
  categoryName: string;
  /** Kategorie-Icon */
  categoryIcon: string;
  /** Kategorie-Farbe */
  categoryColor: string;
  /** Zielbetrag */
  targetAmount: number;
  /** Aktueller ausgegebener Betrag */
  currentAmount: number;
  /** Verbleibender Betrag */
  remainingAmount: number;
  /** Prozentsatz der Verwendung */
  percentageUsed: number;
  /** Anzahl der Transaktionen */
  transactionCount: number;
  /** Datum der letzten Transaktion */
  lastTransactionDate?: Date;
  /** Monat */
  month: number;
  /** Jahr */
  year: number;
  /** Erstellungsdatum */
  createdAt: Date;
  /** Aktualisierungsdatum */
  updatedAt: Date;
  /** Gibt an, ob Budget aktiv ist */
  isActive: boolean;
}

/**
 * Monatliche Budget-Zusammenfassung
 */
/**
 * Monatliche Budget-Zusammenfassung
 */
export interface MonthlyBudgetSummary {
  /** Monat */
  month: number;
  /** Jahr */
  year: number;
  /** Gesamtes Zielbudget */
  totalTarget: number;
  /** Gesamte Ausgaben */
  totalSpent: number;
  /** Gesamt verbleibend */
  totalRemaining: number;
  /** Anzahl der Budgets */
  budgetCount: number;
  /** Anzahl überschrittener Budgets */
  overBudgetCount: number;
  /** Anzahl erreichter Budgets */
  achievedCount: number;
}

/**
 * Budgets-Verwaltungs-Komponente
 *
 * Verwaltet die Anzeige, Erstellung und Bearbeitung von Budgets.
 * Zeigt monatliche Zusammenfassungen, Fortschrittsbalken und ermöglicht
 * Filterung nach Monat/Jahr mit Kontoauswahl-Integration.
 *
 * @example
 * ```html
 * <app-budgets></app-budgets>
 * ```
 */
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
  /** Eindeutiger Komponenten-Schlüssel für BaseComponent */
  protected componentKey = 'budgets';

  /** Dialog-Service für Budget-Formulare */
  private dialog = inject(MatDialog);
  /** Service zur Konto-Auswahl */
  private accountSelection = inject(AccountSelectionService);
  /** ChangeDetectorRef für manuelle Change Detection */
  private cdr = inject(ChangeDetectorRef);

  // Data properties
  /** Budgets mit Statistiken */
  budgets: BudgetWithStats[] = [];
  /** Monatliche Zusammenfassungsstatistiken */
  monthlyStats: MonthlyBudgetSummary | null = null;
  /** Verfügbare Kategorien für Budget-Erstellung */
  private availableCategories: Category[] = [];
  /** Subscription für Konto-Änderungen */
  private accountSubscription?: Subscription;

  /** Math-Objekt für Template-Zugriff */
  Math = Math;

  // UI states
  /** Gibt an, ob keine Budgets vorhanden sind */
  isEmpty = false;
  /** Gibt an, ob der initiale Ladevorgang abgeschlossen ist */
  private initialLoadCompleted = false;

  // Date selection
  /** Ausgewählter Monat (0-11) */
  selectedMonth = new Date().getMonth();
  /** Ausgewähltes Jahr */
  selectedYear = new Date().getFullYear();
  /** FormControl für Monatsauswahl */
  monthControl = new FormControl(this.selectedMonth);
  /** FormControl für Jahresauswahl */
  yearControl = new FormControl(this.selectedYear);

  // Available options
  /** Verfügbare Monate für Dropdown */
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

  /** Verfügbare Jahre für Dropdown */
  availableYears: number[] = [];

  // Table columns
  /** Angezeigte Tabellenspalten */
  displayedColumns: string[] = [
    'category',
    'target',
    'current',
    'progress',
    'remaining',
    'actions',
  ];

  /** API-Service für Budgets */
  private budgetsApi = inject(BudgetsApiService);
  /** API-Service für Kategorien */
  private categoriesApi = inject(CategoriesApiService);
  /** API-Service für Transaktionen */
  private transactionsApi = inject(TransactionsApiService);

  /**
   * Initialisiert Komponente und lädt Budgets
   *
   * Setzt Loading-State, initialisiert Jahre und FormControl-Subscriptions,
   * und lädt Budgets nach Konto-Service-Initialisierung.
   */
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

  /**
   * Initialisiert AccountSelectionService und lädt anschließend Budgets
   *
   * @private
   */
  private async initializeAndLoadData() {
    // Warte auf die Initialisierung des AccountSelectionService
    await this.accountSelection.initialize();

    // Dann Initial load
    this.loadBudgetsForPeriod();
  }

  /**
   * Initialisiert verfügbare Jahre für Dropdown
   *
   * Erstellt Array mit Jahren von 2020 bis nächstes Jahr.
   *
   * @private
   */
  private initializeYears() {
    const currentYear = new Date().getFullYear();
    this.availableYears = [];

    // Add years from 2020 to next year
    for (let year = 2020; year <= currentYear + 1; year++) {
      this.availableYears.push(year);
    }
  }

  /**
   * Richtet FormControl-Subscriptions für Monat/Jahr-Auswahl ein
   *
   * Lädt Budgets neu bei Änderung von Monat oder Jahr.
   *
   * @private
   */
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

  /**
   * Lädt Budgets für ausgewählten Zeitraum
   *
   * Ruft Budgets mit Statistiken vom API-Service ab und lädt
   * verfügbare Kategorien. Prüft ob Konto ausgewählt ist.
   *
   * @private
   */
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

  /**
   * Berechnet monatliche Zusammenfassungsstatistiken
   *
   * Aggregiert alle Budgets und berechnet Gesamt-Ziel, -Ausgaben,
   * -Verbleibend und Anzahl überschrittener/erreichter Budgets.
   *
   * @private
   */
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

  /**
   * Prüft Empty-State
   *
   * Setzt isEmpty-Flag basierend auf vorhandenen Budgets.
   *
   * @private
   */
  private checkEmptyState() {
    this.isEmpty = this.budgets.length === 0;
  }

  // UI Helper Methods
  /**
   * Formatiert Betrag als Währung
   *
   * @param amount - Zu formatierender Betrag
   * @returns Formatierter Währungsstring
   */
  formatCurrency(amount: number): string {
    return this.formatUtils.formatCurrency(amount);
  }

  /**
   * Formatiert Datum in deutschem Format
   *
   * @param date - Zu formatierendes Datum
   * @returns Formatierter Datum-String oder 'Keine Aktivität'
   */
  formatDate(date: Date | undefined): string {
    if (!date) return 'Keine Aktivität';
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  /**
   * Gibt Farbe für Fortschrittsbalken zurück
   *
   * @param percentage - Prozentsatz der Budget-Nutzung
   * @returns Material Design Color ('primary', 'accent', 'warn')
   */
  getProgressBarColor(percentage: number): string {
    if (percentage <= 50) return 'primary'; // Blue
    if (percentage <= 80) return 'accent'; // Orange
    if (percentage <= 100) return 'primary'; // Blue
    return 'warn'; // Red for over budget
  }

  /**
   * Gibt Budget-Status zurück
   *
   * @param budget - Budget zur Statusermittlung
   * @returns Status ('success', 'warning', 'danger', 'info')
   */
  getBudgetStatus(budget: BudgetWithStats): 'success' | 'warning' | 'danger' | 'info' {
    if (!budget.isActive) return 'info';
    if (budget.percentageUsed > 100) return 'danger';
    if (budget.percentageUsed >= 90) return 'success'; // Im Ziel
    if (budget.percentageUsed >= 80) return 'warning'; // Fast aufgebraucht
    if (budget.percentageUsed >= 50) return 'info'; // Moderat
    if (budget.percentageUsed > 0) return 'success'; // Auf Kurs
    return 'info'; // Nicht verwendet
  }

  /**
   * Gibt Budget-Statustext zurück
   *
   * @param budget - Budget zur Textermittlung
   * @returns Deutscher Statustext
   */
  getBudgetStatusText(budget: BudgetWithStats): string {
    if (!budget.isActive) return 'Inaktiv';
    if (budget.percentageUsed === 0) return 'Nicht verwendet';
    if (budget.percentageUsed > 100) return 'Überschritten';
    if (budget.percentageUsed >= 90) return 'Im Ziel';
    if (budget.percentageUsed >= 80) return 'Fast aufgebraucht';
    if (budget.percentageUsed >= 50) return 'Moderat';
    return 'Auf Kurs';
  }

  /**
   * Gibt Namen des ausgewählten Monats zurück
   *
   * @returns Deutscher Monatsname
   */
  getSelectedMonthName(): string {
    return this.availableMonths.find((m) => m.value === this.selectedMonth)?.label || '';
  }

  // Budget Actions
  /**
   * Öffnet Dialog zum Erstellen eines neuen Budgets
   *
   * Prüft ob Konto ausgewählt und Kategorien verfügbar sind.
   * Öffnet BudgetFormComponent im Dialog-Modus.
   */
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

  /**
   * Öffnet Dialog zum Bearbeiten eines Budgets
   *
   * Lädt Kategorien und zeigt BudgetFormComponent im Edit-Modus.
   *
   * @param budget - Zu bearbeitendes Budget
   */
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

  /**
   * Löscht Budget nach Bestätigung
   *
   * Zeigt Bestätigungs-Dialog und löscht Budget über API.
   * Lädt Budgets neu nach erfolgreicher Löschung.
   *
   * @param budget - Zu löschendes Budget
   */
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

  /**
   * Lädt Budgets erneut
   *
   * Wird vom Error-Template aufgerufen bei Fehler-Zustand.
   */
  retry(): void {
    this.loadBudgetsForPeriod();
  }

  // Helper methods for dialog integration
  /**
   * Lädt Kategorien für Dialog
   *
   * Verwendet bereits geladene Kategorien oder lädt sie neu.
   * Filtert nur Ausgabe-Kategorien für Budget-Erstellung.
   *
   * @private
   * @returns Promise mit Array von Kategorien
   */
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

  /**
   * Erstellt Budget aus Dialog-Daten
   *
   * Validiert Eingaben, prüft auf Einnahme-Kategorien und erstellt
   * Budget über API-Service. Lädt Budgets neu nach erfolgreicher Erstellung.
   *
   * @private
   * @param budgetData - Budget-Daten aus Dialog
   */
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

  /**
   * Aktualisiert ein bestehendes Budget über den Dialog.
   *
   * Diese private Methode wird von editBudget() aufgerufen, nachdem der Benutzer
   * Änderungen im Dialog bestätigt hat. Sie extrahiert den Zielbetrag aus den
   * Dialog-Daten und sendet ein Update an die API. Nach erfolgreicher Aktualisierung
   * wird die Budget-Liste neu geladen.
   *
   * @private
   * @param {string} budgetId - Die eindeutige ID des zu aktualisierenden Budgets
   * @param {Partial<BudgetWithStats>} budgetData - Die aktualisierten Budget-Daten aus dem Dialog
   * @returns {void}
   */
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
  /**
   * Prüft, ob derzeit ein Konto ausgewählt ist.
   *
   * @returns {boolean} True, wenn ein Konto ausgewählt ist, sonst false
   */
  hasAccountSelection(): boolean {
    return !!this.accountSelection.getSelectedAccountId();
  }

  /**
   * Gibt den Namen des aktuell ausgewählten Kontos zurück.
   *
   * @returns {string} Der Name des ausgewählten Kontos oder ein leerer String
   */
  getSelectedAccountName(): string {
    const account = this.accountSelection.getSelectedAccount();
    return account?.name || '';
  }

  /**
   * Entfernt den aktuellen Kontofilter.
   *
   * Setzt die Kontoauswahl zurück und lädt alle Budgets ohne Kontofilter.
   *
   * @returns {void}
   */
  clearAccountFilter(): void {
    this.accountSelection.clearSelection().catch((err) => {
      console.error('Error clearing account filter:', err);
    });
  }

  /**
   * TrackBy-Funktionen für Performance-Optimierung.
   *
   * Diese Funktionen werden von Angular's *ngFor verwendet, um DOM-Updates zu minimieren.
   * Sie nutzen die geerbten Methoden aus TrackByUtilsService.
   */
  trackByBudget = this.trackByUtils.trackById.bind(this.trackByUtils);
  trackByCategory = this.trackByUtils.trackByCategoryId.bind(this.trackByUtils);

  /**
   * Generiert eine eindeutige ID für neue Budgets (Legacy).
   *
   * Diese Methode wird nicht mehr verwendet, da IDs jetzt von der Datenbank generiert werden.
   * Bleibt aus Kompatibilitätsgründen erhalten.
   *
   * @protected
   * @returns {string} Eine eindeutige ID im Format 'budget_timestamp_random'
   */
  protected generateId(): string {
    return 'budget_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Angular Lifecycle Hook - wird beim Zerstören der Komponente aufgerufen.
   *
   * Führt Aufräumarbeiten durch, um Memory Leaks und doppelte API-Aufrufe zu verhindern.
   * Beendet insbesondere das Konto-Auswahl-Subscription.
   *
   * @returns {void}
   */
  ngOnDestroy() {
    // Cleanup subscriptions to prevent memory leaks and duplicate API calls during navigation
    if (this.accountSubscription) {
      this.accountSubscription.unsubscribe();
    }
  }
}

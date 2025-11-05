// UI-Filter Interface für die Filter-Form
/**
 * UI-spezifisches Filter-Interface für Transaktions-Filter-Formular
 */
interface UiTransactionFilter {
  /** Startdatum für Zeitraumfilter */
  dateFrom?: Date | null;
  /** Enddatum für Zeitraumfilter */
  dateTo?: Date | null;
  /** Ausgewählte Kategorie-IDs */
  categories?: string[];
  /** Suchtext für Textfilterung */
  searchText?: string;
  /** Transaktionstyp-Filter */
  type?: 'INCOME' | 'EXPENSE' | 'all';
}
import {
  Component,
  OnInit,
  AfterViewInit,
  inject,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { TransactionsApiService, Transaction } from './transactions-api.service';
import { CategoriesApiService, Category } from '../categories/categories-api.service';
import { AccountSelectionService } from '../shared/services/account-selection.service';
import { BaseComponent } from '../shared/components/base.component';
import { CommonModule } from '@angular/common';
import {
  Observable,
  combineLatest,
  switchMap,
  map,
  startWith,
  of,
  debounceTime,
  distinctUntilChanged,
  tap,
} from 'rxjs';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MaterialModule } from '../shared/material.module';

// ...Interfaces entfernt, stattdessen API-Typen verwenden

/**
 * Transaktions-Verwaltungs-Komponente
 *
 * Verwaltet die Anzeige, Filterung und Manipulation von Transaktionen.
 * Unterstützt Tabellen- und Virtual-Scrolling-Ansicht, reaktive Filter
 * und Kontoauswahl-Integration.
 *
 * @example
 * ```html
 * <app-transactions></app-transactions>
 * ```
 */
@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    RouterModule,
    ScrollingModule,
  ],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionsComponent extends BaseComponent implements OnInit, AfterViewInit {
  /** Eindeutiger Komponenten-Schlüssel für BaseComponent */
  protected componentKey = 'transactions';

  /** FormBuilder zur Filter-Formular-Erstellung */
  private fb = inject(FormBuilder);
  /** Dialog-Service für Transaktions-Formulare */
  private dialog = inject(MatDialog);
  /** ChangeDetectorRef für manuelle Change Detection */
  private cdr = inject(ChangeDetectorRef);

  /** Paginator-Referenz für Tabellen-Pagination */
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  /** Sort-Referenz für Tabellen-Sortierung */
  @ViewChild(MatSort) sort!: MatSort;

  // Data properties
  /** Material Table DataSource für Transaktionen */
  dataSource = new MatTableDataSource<Transaction>([]);
  /** Alle geladenen Transaktionen */
  transactions: Transaction[] = [];
  /** Verfügbare Kategorien für Filter */
  categories: Category[] = [];

  // Observable streams
  /** Observable für gefilterte Transaktionen */
  filteredTransactions$!: Observable<Transaction[]>;
  /** Observable für gefilterte Kategorien */
  filteredCategories$!: Observable<Category[]>;

  // Filter form
  /** Reaktives Filter-Formular */
  filterForm: FormGroup;

  // UI states
  /** Gibt an, ob keine Transaktionen vorhanden sind */
  isEmpty = false;
  /** Gibt an, ob kein Konto ausgewählt ist */
  noAccountSelected = false;

  // Table configuration
  /** Angezeigte Tabellenspalten */
  displayedColumns: string[] = ['date', 'category', 'amount', 'note', 'actions'];

  // Pagination
  /** Gesamtanzahl der Transaktionen */
  totalTransactions = 0;
  /** Seitengröße für Pagination */
  pageSize = 10;
  /** Verfügbare Seitengrößen-Optionen */
  pageSizeOptions = [5, 10, 25, 50];

  // Virtual scrolling threshold
  /** Schwellenwert für Virtual Scrolling */
  readonly VIRTUAL_SCROLL_THRESHOLD = 100;
  /** Gibt an, ob Virtual Scrolling verwendet werden soll */
  get useVirtualScrolling(): boolean {
    return this.transactions.length > this.VIRTUAL_SCROLL_THRESHOLD;
  }

  /** API-Service für Transaktionen */
  private transactionsApi = inject(TransactionsApiService);
  /** API-Service für Kategorien */
  private categoriesApi = inject(CategoriesApiService);
  /** Service zur Konto-Auswahl */
  private accountSelection = inject(AccountSelectionService);

  constructor() {
    super();
    this.filterForm = this.fb.group({
      dateFrom: [null],
      dateTo: [null],
      categories: [[]],
      // accounts: [[]],
      searchText: [''],
      type: ['all'],
    });
  }

  /** Gibt an, ob der initiale Ladevorgang abgeschlossen ist */
  private initialLoadCompleted = false;

  /**
   * Initialisiert Komponente und lädt Transaktionen
   *
   * Setzt Observable Streams auf, initialisiert Filter-Subscription
   * und lädt initiale Daten nach Konto-Service-Initialisierung.
   */
  ngOnInit() {
    // BaseComponent initialisieren
    this.initializeLoadingState();

    // Observable-based streams setup
    this.setupObservableStreams();

    // Observable streams handle account changes automatically, no manual subscription needed
    this.setupFilterSubscription();

    // Account Selection Service initialisieren und dann Daten laden
    this.initializeAndLoadData();
  }

  /**
   * Initialisiert AccountSelectionService und lädt anschließend Daten
   *
   * @private
   */
  private async initializeAndLoadData() {
    // Warte auf die Initialisierung des AccountSelectionService
    await this.accountSelection.initialize();

    // Dann Initial data laden
    this.loadInitialData();
  }

  /**
   * Initialisiert View-Komponenten nach Rendering
   *
   * Setzt Paginator und Sort für DataSource und richtet Workaround
   * für Sort-Instanz nach Filteränderungen ein.
   */
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Workaround: Sort-Instanz nach jedem Filtervorgang neu setzen
    this.filterForm.valueChanges.subscribe(() => {
      setTimeout(() => {
        this.dataSource.sort = this.sort;
      });
    });
  }

  /**
   * Lädt initiale Daten (Kategorien und Transaktionen)
   *
   * Prüft ob Konto ausgewählt ist und lädt zuerst Kategorien,
   * dann Transaktionen für das ausgewählte Konto.
   *
   * @private
   */
  private loadInitialData() {
    const selectedAccountId = this.accountSelection.getSelectedAccountId();

    // Lade Kategorien zuerst
    if (selectedAccountId) {
      this.categoriesApi
        .getAll(selectedAccountId)
        .toPromise()
        .then((categories) => {
          this.categories = categories ?? [];
          // Dann Transaktionen laden
          this.loadTransactions();
        })
        .catch(() => {
          this.categories = [];
          this.loadTransactions();
        });
    } else {
      this.categories = [];
      this.loadTransactions();
    }
  }

  /**
   * Lädt Transaktionen für das ausgewählte Konto
   *
   * Ruft Transaktionen vom API-Service ab, aktualisiert DataSource
   * und prüft Empty-State. Zeigt leere Liste wenn kein Konto ausgewählt.
   *
   * @private
   */
  private loadTransactions() {
    const selectedAccountId = this.accountSelection.getSelectedAccountId();

    // Zeige keine Transaktionen an, wenn kein Konto ausgewählt ist
    if (!selectedAccountId) {
      console.log('🚫 No account selected, not loading transactions');
      this.transactions = [];
      this.dataSource = new MatTableDataSource<Transaction>([]);
      this.totalTransactions = 0;
      this.checkEmptyState();
      this.setSuccess(this.transactions.length === 0);
      this.initialLoadCompleted = true;
      this.cdr.markForCheck();
      return;
    }

    const filters = { accountId: selectedAccountId };

    this.transactionsApi
      .getAll(filters)
      .toPromise()
      .then((transactions) => {
        // Map transactions with category information
        this.transactions = (transactions ?? []).map((transaction) => {
          const category = this.categories.find((c) => c.id === transaction.categoryId);
          return {
            ...transaction,
            category: category?.name || 'Unbekannt',
            categoryEmoji: category?.icon || category?.emoji || '📝',
            note: transaction.description || transaction.note || '',
            type: category?.transactionType || transaction.type || 'EXPENSE', // Derive type from category
          };
        });

        this.totalTransactions = this.transactions.length;

        // Debug: Log transaction types
        const typeDistribution = this.transactions.reduce(
          (acc, t) => {
            acc[t.type] = (acc[t.type] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );
        console.log('📊 Transaction type distribution:', typeDistribution);

        // DataSource direkt initialisieren und Sort/Paginator binden
        this.dataSource = new MatTableDataSource<Transaction>(this.transactions);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.applyFilters();
        this.checkEmptyState();
        this.setSuccess(this.transactions.length === 0);
        this.initialLoadCompleted = true;
        this.cdr.markForCheck();
      })
      .catch(() => {
        this.setError('Fehler beim Laden der Transaktionen');
        this.initialLoadCompleted = true;
        this.cdr.markForCheck();
      });
  }

  /**
   * Richtet Filter-Subscription ein
   *
   * Beobachtet Änderungen am Filter-Formular und wendet Filter auf
   * Transaktionen an bei jeder Formular-Änderung.
   *
   * @private
   */
  private setupFilterSubscription() {
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  /**
   * Wendet aktuelle Filter auf Transaktionen an
   *
   * Filtert Transaktionen nach Datum, Kategorie, Typ und Suchtext.
   * Aktualisiert DataSource mit gefiltertem Ergebnis.
   *
   * @private
   */
  private applyFilters() {
    const filters = this.filterForm.value as UiTransactionFilter;
    let filteredTransactions = [...this.transactions];

    // Date range filter
    if (filters.dateFrom) {
      filteredTransactions = filteredTransactions.filter((t) => {
        const transactionDate = new Date(t.date);
        const fromDate = new Date(filters.dateFrom!);
        fromDate.setHours(0, 0, 0, 0); // Start of day
        return transactionDate >= fromDate;
      });
    }
    if (filters.dateTo) {
      filteredTransactions = filteredTransactions.filter((t) => {
        const transactionDate = new Date(t.date);
        const toDate = new Date(filters.dateTo!);
        toDate.setHours(23, 59, 59, 999); // End of day
        return transactionDate <= toDate;
      });
    }

    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      filteredTransactions = filteredTransactions.filter(
        (t) => t.category && filters.categories!.includes(t.category),
      );
    }

    // Account filter - Temporarily disabled (no Account table in schema)
    // if (filters.accounts && filters.accounts.length > 0) {
    //   filteredTransactions = filteredTransactions.filter(t =>
    //     filters.accounts!.includes(t.account)
    //   );
    // }

    // Type filter
    if (filters.type && filters.type !== 'all') {
      console.log('🔍 Filtering by type:', filters.type);
      const beforeFilter = filteredTransactions.length;
      filteredTransactions = filteredTransactions.filter((t) => {
        const matches = t.type === filters.type;
        if (!matches) {
          console.log(
            '❌ Transaction type mismatch:',
            t.type,
            'vs',
            filters.type,
            'for transaction:',
            t.id,
          );
        }
        return matches;
      });
      console.log('📊 Type filter results:', beforeFilter, '→', filteredTransactions.length);
    }

    // Text search
    if (filters.searchText && filters.searchText.trim()) {
      const searchTerm = filters.searchText.toLowerCase().trim();
      filteredTransactions = filteredTransactions.filter(
        (t) =>
          (t.category && t.category.toLowerCase().includes(searchTerm)) ||
          // t.account.toLowerCase().includes(searchTerm) ||
          (t.note && t.note.toLowerCase().includes(searchTerm)),
      );
    }

    // DataSource nicht neu erzeugen, sondern nur die Daten setzen
    this.dataSource.data = filteredTransactions;
    this.totalTransactions = filteredTransactions.length;
    // Sort/Paginator nach jedem Filter neu binden
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  /**
   * Setzt alle Filter zurück
   *
   * Setzt Filter-Formular auf Standardwerte zurück.
   */
  clearFilters() {
    this.filterForm.reset({
      dateFrom: null,
      dateTo: null,
      categories: [],
      searchText: '',
      type: 'all',
    });
  }

  /**
   * Prüft Empty-State und No-Account-Selected-State
   *
   * Setzt Flags für UI-Darstellung basierend auf Kontoauswahl
   * und vorhandenen Transaktionen.
   *
   * @private
   */
  private checkEmptyState() {
    const selectedAccount = this.accountSelection.getSelectedAccount();
    this.noAccountSelected = !selectedAccount;
    this.isEmpty = this.transactions.length === 0 && !!selectedAccount;
  }

  /**
   * Filtert Kategorien nach ausgewähltem Konto
   *
   * @private
   * @param categories - Alle verfügbaren Kategorien
   * @returns Gefilterte Kategorien für das ausgewählte Konto
   */
  private filterCategoriesByAccount(categories: Category[]): Category[] {
    const selectedAccount = this.accountSelection.getSelectedAccount();
    if (!selectedAccount) {
      console.log('🔍 No account selected, showing all categories');
      return categories;
    }

    console.log(
      '🔍 Filtering categories for account:',
      selectedAccount.name,
      'ID:',
      selectedAccount.id,
    );
    const filtered = categories.filter((cat) => {
      const accountId = cat.account?.id || cat.accountId;
      const matches = accountId === selectedAccount.id;
      if (matches) {
        console.log('✅ Category belongs to account:', cat.name);
      }
      return matches;
    });

    console.log('🔍 Filtered categories:', filtered.length, 'of', categories.length);
    return filtered;
  }

  // Public methods
  /**
   * Öffnet Dialog zum Erstellen einer neuen Transaktion
   *
   * Öffnet TransactionFormComponent im Dialog-Modus und lädt
   * Transaktionen neu nach erfolgreicher Erstellung.
   */
  addTransaction() {
    import('./transaction-form/transaction-form.component').then(({ TransactionFormComponent }) => {
      const dialogRef = this.dialog.open(TransactionFormComponent, {
        width: '600px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        data: {
          mode: 'create',
          categories: this.categories,
          // accounts: this.accounts
        },
        disableClose: true,
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          // Lade die Transaktionen neu
          this.loadTransactions();
        }
      });
    });
  }

  /**
   * Öffnet Dialog zum Bearbeiten einer Transaktion
   *
   * Zeigt TransactionFormComponent im Edit-Modus mit vorausgefüllten Daten.
   * Lädt Transaktionen neu nach erfolgreicher Aktualisierung.
   *
   * @param transaction - Zu bearbeitende Transaktion
   */
  editTransaction(transaction: Transaction) {
    import('./transaction-form/transaction-form.component').then(({ TransactionFormComponent }) => {
      const dialogRef = this.dialog.open(TransactionFormComponent, {
        width: '600px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        data: {
          mode: 'edit',
          transaction: transaction,
          categories: this.categories,
          // accounts: this.accounts
        },
        disableClose: true,
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          // Lade die Transaktionen neu
          this.loadTransactions();
        }
      });
    });
  }

  /**
   * Löscht Transaktion nach Bestätigung
   *
   * Zeigt Bestätigungs-Dialog und löscht Transaktion über API.
   * Lädt Transaktionen neu nach erfolgreicher Löschung.
   *
   * @param transaction - Zu löschende Transaktion
   */
  deleteTransaction(transaction: Transaction) {
    // Simple confirm dialog for now - could be enhanced with custom dialog
    const confirmed = window.confirm(
      `Möchten Sie die Transaktion "${transaction.note || transaction.category}" wirklich löschen?`,
    );

    if (confirmed) {
      this.transactionsApi.delete(transaction.id).subscribe({
        next: () => {
          // Lade die Transaktionen neu
          this.loadTransactions();
        },
        error: (error) => {
          console.error('Fehler beim Löschen:', error);
          alert('Fehler beim Löschen der Transaktion');
        },
      });
    }
  }

  /**
   * Exportiert Transaktionen (Platzhalter)
   *
   * Wird zukünftig Export-Funktionalität implementieren.
   */
  exportTransactions() {
    // Will implement export functionality
    console.log('Export transactions');
  }

  /**
   * Formatiert Betrag als Währung
   *
   * @param amount - Zu formatierender Betrag
   * @returns Formatierter Währungsstring (immer positiv)
   */
  formatCurrency(amount: number): string {
    return this.formatUtils.formatCurrency(Math.abs(amount)); // Immer positiv anzeigen, Vorzeichen wird über Icon/Farbe dargestellt
  }

  /**
   * Gibt CSS-Klasse für Transaktionsbetrag zurück
   *
   * Verwendet Transaktionstyp statt Vorzeichen für Klassifizierung.
   *
   * @param transaction - Transaktion zur Klassifizierung
   * @returns 'income' oder 'expense'
   */
  getAmountClass(transaction: Transaction): string {
    // Use type field instead of amount sign
    return transaction.type === 'INCOME' ? 'income' : 'expense';
  }

  /**
   * Gibt Farbe für Kategorie zurück
   *
   * @param categoryName - Name der Kategorie
   * @returns HEX-Farbcode oder Standardfarbe #666
   */
  getCategoryColor(categoryName: string): string {
    const category = this.categories.find((c) => c.name === categoryName);
    return category?.color || '#666';
  }

  /**
   * Lädt Daten erneut
   *
   * Wird vom Error-Template aufgerufen bei Fehler-Zustand.
   */
  retry() {
    this.loadInitialData();
  }

  // Account Selection Methods
  /**
   * Gibt Namen des ausgewählten Kontos zurück
   *
   * @returns Name des ausgewählten Kontos oder leerer String
   */
  getSelectedAccountName(): string {
    const selected = this.accountSelection.getSelectedAccount();
    return selected ? selected.name : '';
  }

  /**
   * Prüft ob ein Konto ausgewählt ist
   *
   * @returns true wenn Konto ausgewählt, sonst false
   */
  hasAccountSelection(): boolean {
    return this.accountSelection.hasSelection();
  }

  /**
   * Entfernt Kontofilter
   *
   * Löscht die aktuelle Kontoauswahl über den AccountSelectionService.
   */
  clearAccountFilter(): void {
    this.accountSelection.clearSelection().catch((err) => {
      console.error('Error clearing account filter:', err);
    });
  }

  // TrackBy functions for performance optimization - using inherited methods
  /** TrackBy-Funktion für Performance-Optimierung bei Transaktions-Listen */
  trackByTransaction = this.trackByUtils.trackByTransactionId.bind(this.trackByUtils);
  /** TrackBy-Funktion für Performance-Optimierung bei Kategorie-Listen */
  trackByCategory = this.trackByUtils.trackByCategoryId.bind(this.trackByUtils);

  /**
   * Richtet Observable Streams für reaktive Datenfilterung ein
   *
   * Erstellt Observables für gefilterte Kategorien und Transaktionen
   * basierend auf Kontoauswahl und Filterformular mit Debouncing.
   *
   * @private
   */
  private setupObservableStreams() {
    // Observable stream für gefilterte Kategorien
    this.filteredCategories$ = this.accountSelection.selectedAccount$.pipe(
      switchMap((account) => {
        if (!account) return of([]);
        return this.categoriesApi.getAll(account.id);
      }),
      tap((categories) => {
        // Categories auch in die Component-Property setzen für andere Verwendungen
        this.categories = categories;
      }),
    );

    // Observable stream für gefilterte Transaktionen mit Debounce für Search
    const searchControl = this.filterForm.get('searchText');
    const debouncedSearch$ = searchControl
      ? searchControl.valueChanges.pipe(
          debounceTime(300),
          distinctUntilChanged(),
          startWith(searchControl.value),
        )
      : of('');

    const otherFilters$ = this.filterForm.valueChanges.pipe(
      map((form) => ({ ...form, searchText: undefined })),
      startWith({ ...this.filterForm.value, searchText: undefined }),
    );

    this.filteredTransactions$ = combineLatest([
      this.accountSelection.selectedAccount$,
      otherFilters$,
      debouncedSearch$,
      this.filteredCategories$, // Categories als Dependency hinzufügen
    ]).pipe(
      switchMap(([account, filters, searchText, categories]) => {
        if (!account) return of([]);
        return this.transactionsApi.getAll({ accountId: account.id }).pipe(
          map((transactions) => {
            const enrichedTransactions = (transactions ?? []).map((transaction) => {
              const category = categories.find((c) => c.id === transaction.categoryId);
              return {
                ...transaction,
                category: category?.name || 'Unbekannt',
                categoryEmoji: category?.icon || category?.emoji || '📝',
                note: transaction.description || transaction.note || '',
                type: category?.transactionType || transaction.type || 'EXPENSE',
              };
            });
            const filtersWithSearch = { ...filters, searchText };
            return this.applyFiltersToTransactions(enrichedTransactions, filtersWithSearch);
          }),
        );
      }),
    );
  }

  /**
   * Wendet Filter auf Transaktionen an (Helper für Observable Stream)
   *
   * Filtert Transaktionen nach Datum, Kategorie, Typ und Suchtext.
   * Wird von setupObservableStreams verwendet.
   *
   * @private
   * @param transactions - Zu filternde Transaktionen
   * @param filters - Anzuwendende Filter
   * @returns Gefilterte Transaktionen
   */
  private applyFiltersToTransactions(
    transactions: Transaction[],
    filters: UiTransactionFilter,
  ): Transaction[] {
    let filtered = [...transactions];

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter((t) => {
        const transactionDate = new Date(t.date);
        const fromDate = new Date(filters.dateFrom!);
        fromDate.setHours(0, 0, 0, 0);
        return transactionDate >= fromDate;
      });
    }

    if (filters.dateTo) {
      filtered = filtered.filter((t) => {
        const transactionDate = new Date(t.date);
        const toDate = new Date(filters.dateTo!);
        toDate.setHours(23, 59, 59, 999);
        return transactionDate <= toDate;
      });
    }

    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter((t) => filters.categories!.includes(t.category || ''));
    }

    // Type filter
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter((t) => t.type === filters.type);
    }

    // Search text filter
    if (filters.searchText) {
      const searchTerm = filters.searchText.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.note?.toLowerCase().includes(searchTerm) ||
          t.category?.toLowerCase().includes(searchTerm),
      );
    }

    return filtered;
  }
}

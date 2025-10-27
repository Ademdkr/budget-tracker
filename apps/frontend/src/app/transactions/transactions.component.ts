// UI-Filter Interface für die Filter-Form
interface UiTransactionFilter {
  dateFrom?: Date | null;
  dateTo?: Date | null;
  categories?: string[];
  // accounts?: string[];
  searchText?: string;
  type?: 'INCOME' | 'EXPENSE' | 'all';
}
import { Component, OnInit, AfterViewInit, inject, ViewChild } from '@angular/core';
import { TransactionsApiService, Transaction } from './transactions-api.service';
import { CategoriesApiService, Category } from '../categories/categories-api.service';
// import { AccountsApiService, Account } from '../accounts/accounts-api.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// ...Interfaces entfernt, stattdessen API-Typen verwenden

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Data properties
  dataSource = new MatTableDataSource<Transaction>([]);
  transactions: Transaction[] = [];
  categories: Category[] = [];
  // accounts: Account[] = [];

  // Filter form
  filterForm: FormGroup;

  // UI states
  isLoading = true;
  hasError = false;
  isEmpty = false;

  // Table configuration
  displayedColumns: string[] = ['date', 'category', 'amount', 'note', 'actions'];

  // Pagination
  totalTransactions = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];

  private transactionsApi = inject(TransactionsApiService);
  private categoriesApi = inject(CategoriesApiService);
  // private accountsApi = inject(AccountsApiService);

  constructor() {
    this.filterForm = this.fb.group({
      dateFrom: [null],
      dateTo: [null],
      categories: [[]],
      // accounts: [[]],
      searchText: [''],
      type: ['all']
    });
  }

  ngOnInit() {
    this.loadInitialData();
    this.setupFilterSubscription();
  }

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

  private loadInitialData() {
    this.isLoading = true;
    this.hasError = false;

    // Lade Kategorien und Transaktionen parallel
    Promise.all([
      this.categoriesApi.getAll().toPromise(),
      this.transactionsApi.getAll().toPromise()
    ]).then(([categories, transactions]) => {
      this.categories = categories ?? [];

      // Map transactions with category information
      this.transactions = (transactions ?? []).map(transaction => {
        const category = categories?.find(c => c.id === transaction.categoryId);
        return {
          ...transaction,
          category: category?.name || 'Unbekannt',
          categoryEmoji: category?.icon || category?.emoji || '📝',
          note: transaction.description || transaction.note || '',
          account: '' // No account field in schema
        };
      });

      this.totalTransactions = this.transactions.length;
      // DataSource direkt initialisieren und Sort/Paginator binden
      this.dataSource = new MatTableDataSource<Transaction>(this.transactions);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.applyFilters();
      this.checkEmptyState();
      this.isLoading = false;
    }).catch(() => {
      this.hasError = true;
      this.isLoading = false;
    });
  }


  private setupFilterSubscription() {
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  private applyFilters() {
    const filters = this.filterForm.value as UiTransactionFilter;
    let filteredTransactions = [...this.transactions];

    // Date range filter
    if (filters.dateFrom) {
      filteredTransactions = filteredTransactions.filter(t => t.date >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      filteredTransactions = filteredTransactions.filter(t => t.date <= filters.dateTo!);
    }

    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      filteredTransactions = filteredTransactions.filter(t =>
        t.category && filters.categories!.includes(t.category)
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
      filteredTransactions = filteredTransactions.filter(t => t.type === filters.type);
    }

    // Text search
    if (filters.searchText && filters.searchText.trim()) {
      const searchTerm = filters.searchText.toLowerCase().trim();
      filteredTransactions = filteredTransactions.filter(t =>
        (t.category && t.category.toLowerCase().includes(searchTerm)) ||
        // t.account.toLowerCase().includes(searchTerm) ||
        (t.note && t.note.toLowerCase().includes(searchTerm))
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

  clearFilters() {
    this.filterForm.reset({
      dateFrom: null,
      dateTo: null,
      categories: [],
      accounts: [],
      searchText: '',
      type: 'all'
    });
  }

  private checkEmptyState() {
    this.isEmpty = this.transactions.length === 0;
  }

  // Public methods
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
        disableClose: true
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          // Lade die Daten neu, um die aktualisierte Transaktion aus der DB zu bekommen
          this.loadInitialData();
        }
      });
    });
  }

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
        disableClose: true
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          // Lade die Daten neu, um die aktualisierte Transaktion aus der DB zu bekommen
          this.loadInitialData();
        }
      });
    });
  }

  deleteTransaction(transaction: Transaction) {
    // Simple confirm dialog for now - could be enhanced with custom dialog
    const confirmed = window.confirm(
      `Möchten Sie die Transaktion "${transaction.note || transaction.category}" wirklich löschen?`
    );

    if (confirmed) {
      this.transactionsApi.delete(transaction.id).subscribe({
        next: () => {
          // Lade die Daten neu
          this.loadInitialData();
        },
        error: (error) => {
          console.error('Fehler beim Löschen:', error);
          alert('Fehler beim Löschen der Transaktion');
        }
      });
    }
  }

  exportTransactions() {
    // Will implement export functionality
    console.log('Export transactions');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(Math.abs(amount)); // Immer positiv anzeigen, Vorzeichen wird über Icon/Farbe dargestellt
  }

  getAmountClass(transaction: Transaction): string {
    // Use type field instead of amount sign
    return transaction.type === 'INCOME' ? 'income' : 'expense';
  }

  getCategoryColor(categoryName: string): string {
    const category = this.categories.find(c => c.name === categoryName);
    return category?.color || '#666';
  }

  retry() {
    this.loadInitialData();
  }
}

import { Component, OnInit, AfterViewInit, inject, ViewChild } from '@angular/core';
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

// Interfaces
export interface Transaction {
  id: string;
  date: Date;
  category: string;
  categoryEmoji: string;
  account: string;
  amount: number;
  note?: string;
  type: 'income' | 'expense';
}

export interface TransactionFilter {
  dateFrom?: Date;
  dateTo?: Date;
  categories?: string[];
  accounts?: string[];
  searchText?: string;
  type?: 'income' | 'expense' | 'all';
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  type: 'income' | 'expense' | 'both';
}

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
}

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
  accounts: Account[] = [];
  
  // Filter form
  filterForm: FormGroup;
  
  // UI states
  isLoading = true;
  hasError = false;
  isEmpty = false;
  
  // Table configuration
  displayedColumns: string[] = ['date', 'category', 'account', 'amount', 'note', 'actions'];
  
  // Pagination
  totalTransactions = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];

  constructor() {
    this.filterForm = this.fb.group({
      dateFrom: [null],
      dateTo: [null],
      categories: [[]],
      accounts: [[]],
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
  }

  private loadInitialData() {
    this.isLoading = true;
    this.hasError = false;

    // Simulate API call
    setTimeout(() => {
      try {
        this.loadCategories();
        this.loadAccounts();
        this.loadTransactions();
        this.checkEmptyState();
        
        this.isLoading = false;
      } catch {
        this.hasError = true;
        this.isLoading = false;
      }
    }, 1000);
  }

  private loadCategories() {
    this.categories = [
      { id: '1', name: 'Gehalt', emoji: '💰', color: '#4caf50', type: 'income' },
      { id: '2', name: 'Freelancing', emoji: '💻', color: '#2196f3', type: 'income' },
      { id: '3', name: 'Investitionen', emoji: '📈', color: '#9c27b0', type: 'income' },
      { id: '4', name: 'Lebensmittel', emoji: '🍕', color: '#ff9800', type: 'expense' },
      { id: '5', name: 'Transport', emoji: '🚗', color: '#f44336', type: 'expense' },
      { id: '6', name: 'Unterhaltung', emoji: '🎬', color: '#e91e63', type: 'expense' },
      { id: '7', name: 'Gesundheit', emoji: '💊', color: '#03dac6', type: 'expense' },
      { id: '8', name: 'Shopping', emoji: '🛍️', color: '#ff5722', type: 'expense' },
      { id: '9', name: 'Bildung', emoji: '📚', color: '#673ab7', type: 'expense' },
      { id: '10', name: 'Wohnen', emoji: '🏠', color: '#795548', type: 'expense' }
    ];
  }

  private loadAccounts() {
    this.accounts = [
      { id: '1', name: 'Sparkasse Giro', type: 'checking', balance: 2450.75 },
      { id: '2', name: 'DKB Visa', type: 'credit', balance: -180.25 },
      { id: '3', name: 'ING Tagesgeld', type: 'savings', balance: 15000.00 },
      { id: '4', name: 'Bargeld', type: 'cash', balance: 120.50 }
    ];
  }

  private loadTransactions() {
    // Generate mock transactions
    this.transactions = this.generateMockTransactions(50);
    this.totalTransactions = this.transactions.length;
    this.applyFilters();
  }

  private generateMockTransactions(count: number): Transaction[] {
    const transactions: Transaction[] = [];
    const today = new Date();
    
    for (let i = 0; i < count; i++) {
      const isIncome = Math.random() < 0.3; // 30% chance of income
      const category = isIncome 
        ? this.categories.filter(c => c.type === 'income')[Math.floor(Math.random() * 3)]
        : this.categories.filter(c => c.type === 'expense')[Math.floor(Math.random() * 7)];
      
      const account = this.accounts[Math.floor(Math.random() * this.accounts.length)];
      
      const transaction: Transaction = {
        id: `tx_${i + 1}`,
        date: new Date(today.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Last 90 days
        category: category.name,
        categoryEmoji: category.emoji,
        account: account.name,
        amount: isIncome 
          ? +(Math.random() * 4000 + 1000).toFixed(2) // Income: 1000-5000
          : +(-(Math.random() * 300 + 10)).toFixed(2), // Expense: -10 to -310
        note: this.generateRandomNote(category.name, isIncome),
        type: isIncome ? 'income' : 'expense'
      };
      
      transactions.push(transaction);
    }
    
    return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  private generateRandomNote(category: string, isIncome: boolean): string {
    const incomeNotes = {
      'Gehalt': ['Monatsgehalt', 'Gehalt November', 'Lohn Oktober'],
      'Freelancing': ['Projekt ABC', 'Website Entwicklung', 'Beratung Kunde XYZ'],
      'Investitionen': ['Dividende ETF', 'Aktienverkauf', 'Zinsen Tagesgeld']
    };
    
    const expenseNotes = {
      'Lebensmittel': ['Rewe Wocheneinkauf', 'Edeka', 'Bäckerei Müller', 'Lieferando'],
      'Transport': ['Tankstelle Shell', 'DB Ticket', 'Uber Fahrt', 'Parkgebühr'],
      'Unterhaltung': ['Netflix Abo', 'Kino Tickets', 'Spotify Premium', 'Amazon Prime'],
      'Gesundheit': ['Apotheke', 'Arztbesuch', 'Fitness Studio', 'Vitamin D'],
      'Shopping': ['Amazon Bestellung', 'Kleidung H&M', 'Elektronik MediaMarkt'],
      'Bildung': ['Udemy Kurs', 'Buch Amazon', 'Online Seminar'],
      'Wohnen': ['Miete November', 'Strom Rechnung', 'Internet Telekom', 'Hausrat Versicherung']
    };
    
    const notes = isIncome ? incomeNotes[category as keyof typeof incomeNotes] : expenseNotes[category as keyof typeof expenseNotes];
    return notes ? notes[Math.floor(Math.random() * notes.length)] : '';
  }

  private setupFilterSubscription() {
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  private applyFilters() {
    const filters = this.filterForm.value as TransactionFilter;
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
        filters.categories!.includes(t.category)
      );
    }

    // Account filter
    if (filters.accounts && filters.accounts.length > 0) {
      filteredTransactions = filteredTransactions.filter(t => 
        filters.accounts!.includes(t.account)
      );
    }

    // Type filter
    if (filters.type && filters.type !== 'all') {
      filteredTransactions = filteredTransactions.filter(t => t.type === filters.type);
    }

    // Text search
    if (filters.searchText && filters.searchText.trim()) {
      const searchTerm = filters.searchText.toLowerCase().trim();
      filteredTransactions = filteredTransactions.filter(t => 
        t.category.toLowerCase().includes(searchTerm) ||
        t.account.toLowerCase().includes(searchTerm) ||
        (t.note && t.note.toLowerCase().includes(searchTerm))
      );
    }

    this.dataSource.data = filteredTransactions;
    this.totalTransactions = filteredTransactions.length;
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
          accounts: this.accounts
        },
        disableClose: true
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          // Add new transaction to the list
          const newTransaction: Transaction = {
            ...result,
            id: `tx_${Date.now()}`,
            date: new Date(result.date)
          };
          
          this.transactions.unshift(newTransaction);
          this.applyFilters();
          
          // Show success message (could use MatSnackBar)
          console.log('Transaction added:', newTransaction);
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
          accounts: this.accounts
        },
        disableClose: true
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          // Update transaction in the list
          const index = this.transactions.findIndex(t => t.id === transaction.id);
          if (index !== -1) {
            this.transactions[index] = {
              ...result,
              id: transaction.id,
              date: new Date(result.date)
            };
            this.applyFilters();
            
            console.log('Transaction updated:', result);
          }
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
      const index = this.transactions.findIndex(t => t.id === transaction.id);
      if (index !== -1) {
        this.transactions.splice(index, 1);
        this.applyFilters();
        
        console.log('Transaction deleted:', transaction);
      }
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
    }).format(amount);
  }

  getAmountClass(amount: number): string {
    return amount >= 0 ? 'income' : 'expense';
  }

  getCategoryColor(categoryName: string): string {
    const category = this.categories.find(c => c.name === categoryName);
    return category?.color || '#666';
  }

  retry() {
    this.loadInitialData();
  }
}

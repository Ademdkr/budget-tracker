import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { AccountFormComponent, AccountDialogData } from './account-form/account-form.component';
import { CategoryAssignmentDialogData } from './category-assignment/category-assignment.component';
import { AccountsApiService, Account, AccountWithCalculatedBalance } from './accounts-api.service';
import { AccountSelectionService, SelectedAccount } from '../shared/services/account-selection.service';
import { finalize } from 'rxjs/operators';

// Enhanced Account interface with statistics
export interface AccountWithStats {
  id: string;
  name: string;
  type: string;
  currentBalance: number;
  note?: string;
  transactionCount: number;
  lastTransactionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface AccountType {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTableModule,
    MatBadgeModule,
    MatDividerModule
  ],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.scss'
})
export class AccountsComponent implements OnInit {
  private dialog = inject(MatDialog);
  private accountsApi = inject(AccountsApiService);
  private accountSelection = inject(AccountSelectionService);

  // Data properties
  accounts: AccountWithStats[] = [];
  accountTypes: AccountType[] = [];
  selectedAccountId: string | null = null;

  // Helper for template
  Object = Object;

  // UI states
  isLoading = true;
  hasError = false;
  isEmpty = false;

  // View settings
  viewMode: 'cards' | 'table' = 'cards';

  // Statistics
  stats = {
    totalAccounts: 0,
    totalBalance: 0,
    totalTransactions: 0
  };

  // Table columns
  displayedColumns: string[] = ['name', 'type', 'balance', 'transactions', 'lastActivity', 'actions'];

  ngOnInit() {
    // Initialize account selection service
    this.accountSelection.initialize();

    // Subscribe to selected account changes
    this.accountSelection.selectedAccount$.subscribe(account => {
      this.selectedAccountId = account?.id || null;
    });

    this.loadInitialData();
  }

  private loadInitialData() {
    this.isLoading = true;
    this.hasError = false;

    this.loadAccountTypes();

    // Verwende die neue API mit berechneten Salden
    this.accountsApi.getAccountsWithCalculatedBalances()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (accounts) => {
          this.accounts = this.mapCalculatedAccountsToAccountWithStats(accounts);
          this.checkEmptyState();
          this.calculateStats();
        },
        error: (error) => {
          console.error('Error loading accounts:', error);
          this.hasError = true;
        }
      });
  }

  private loadAccountTypes() {
    this.accountTypes = [
      {
        id: 'checking',
        name: 'Girokonto',
        icon: 'account_balance',
        description: 'Hauptkonto für tägliche Transaktionen',
        color: '#2196f3'
      },
      {
        id: 'savings',
        name: 'Sparkonto',
        icon: 'savings',
        description: 'Langfristige Ersparnisse',
        color: '#4caf50'
      },
      {
        id: 'credit',
        name: 'Kreditkarte',
        icon: 'credit_card',
        description: 'Kreditkarten-Konto',
        color: '#ff9800'
      },
      {
        id: 'investment',
        name: 'Investmentkonto',
        icon: 'trending_up',
        description: 'Aktien, ETFs und andere Investments',
        color: '#9c27b0'
      },
      {
        id: 'cash',
        name: 'Bargeld',
        icon: 'payments',
        description: 'Bargeld und Münzen',
        color: '#795548'
      },
      {
        id: 'business',
        name: 'Geschäftskonto',
        icon: 'business',
        description: 'Geschäftliche Transaktionen',
        color: '#607d8b'
      }
    ];
  }

  private mapAccountsToAccountWithStats(accounts: Account[]): AccountWithStats[] {
    return accounts.map(account => ({
      id: account.id,
      name: account.name,
      type: this.mapAccountType(account.type),
      currentBalance: account.balance,
      note: account.note,
      transactionCount: 0, // TODO: Get from backend when available
      lastTransactionDate: undefined, // TODO: Get from backend when available
      createdAt: new Date(account.createdAt || Date.now()),
      updatedAt: new Date(account.updatedAt || Date.now()),
      isActive: account.isActive
    }));
  }

  private mapCalculatedAccountsToAccountWithStats(accounts: AccountWithCalculatedBalance[]): AccountWithStats[] {
    return accounts.map(account => ({
      id: account.id,
      name: account.name,
      type: this.mapAccountType(account.type),
      currentBalance: account.calculatedBalance, // Verwende den berechneten Saldo
      note: account.note,
      transactionCount: account.transactionCount,
      lastTransactionDate: account.lastTransactionDate ? new Date(account.lastTransactionDate) : undefined,
      createdAt: new Date(account.createdAt || Date.now()),
      updatedAt: new Date(account.updatedAt || Date.now()),
      isActive: account.isActive
    }));
  }

  private mapAccountType(backendType: Account['type']): string {
    const typeMap: { [key in Account['type']]: string } = {
      'CHECKING': 'checking',
      'SAVINGS': 'savings',
      'CREDIT_CARD': 'credit',
      'CASH': 'cash',
      'INVESTMENT': 'investment',
      'OTHER': 'business'
    };
    return typeMap[backendType] || 'checking';
  }

  private checkEmptyState() {
    this.isEmpty = this.accounts.length === 0;
  }

  // Public methods
  toggleViewMode() {
    this.viewMode = this.viewMode === 'cards' ? 'table' : 'cards';
  }

  addAccount() {
    import('./account-form/account-form.component').then(({ AccountFormComponent }) => {
      const dialogRef = this.dialog.open(AccountFormComponent, {
        width: '500px',
        maxWidth: '90vw',
        data: {
          mode: 'create',
          accountTypes: this.accountTypes,
          existingNames: this.accounts.map(a => a.name.toLowerCase())
        },
        disableClose: true
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          const newAccount: AccountWithStats = {
            ...result,
            id: `acc_${Date.now()}`,
            currentBalance: 0,
            transactionCount: 0,
            lastTransactionDate: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true
          };

          this.accounts.push(newAccount);
          console.log('Account added:', newAccount);
        }
      });
    });
  }

  editAccount(account: AccountWithStats) {
    import('./account-form/account-form.component').then(({ AccountFormComponent }) => {
      const dialogRef = this.dialog.open(AccountFormComponent, {
        width: '500px',
        maxWidth: '90vw',
        data: {
          mode: 'edit',
          account: account,
          accountTypes: this.accountTypes,
          existingNames: this.accounts
            .filter(a => a.id !== account.id)
            .map(a => a.name.toLowerCase())
        },
        disableClose: true
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          const index = this.accounts.findIndex(a => a.id === account.id);
          if (index !== -1) {
            this.accounts[index] = {
              ...account,
              ...result,
              updatedAt: new Date()
            };

            console.log('Account updated:', result);
          }
        }
      });
    });
  }

  manageCategoriesForAccount(account: AccountWithStats) {
    import('./category-assignment/category-assignment.component').then(({ CategoryAssignmentComponent }) => {
      const dialogRef = this.dialog.open(CategoryAssignmentComponent, {
        width: '600px',
        maxWidth: '90vw',
        maxHeight: '80vh',
        data: {
          account: {
            id: account.id,
            name: account.name,
            type: account.type,
            icon: this.getAccountTypeInfo(account.type)?.icon,
            color: this.getAccountTypeInfo(account.type)?.color
          }
        } as CategoryAssignmentDialogData,
        disableClose: false
      });

      dialogRef.afterClosed().subscribe(() => {
        // No specific action needed after closing
        console.log('Category assignment dialog closed');
      });
    });
  }



  getAccountTypeInfo(typeId: string): AccountType | undefined {
    return this.accountTypes.find(t => t.id === typeId);
  }

  getBalanceClass(balance: number): string {
    if (balance > 0) return 'positive';
    if (balance < 0) return 'negative';
    return 'neutral';
  }

  getTotalBalance(): number {
    return this.accounts
      .filter(account => account.isActive)
      .reduce((sum, account) => sum + account.currentBalance, 0);
  }

  getActiveAccountsCount(): number {
    return this.accounts.filter(account => account.isActive).length;
  }

  getActiveAccounts(): AccountWithStats[] {
    return this.accounts.filter(account => account.isActive);
  }

  getAccountsByType(): { [key: string]: AccountWithStats[] } {
    const grouped: { [key: string]: AccountWithStats[] } = {};

    this.accounts
      .filter(account => account.isActive)
      .forEach(account => {
        if (!grouped[account.type]) {
          grouped[account.type] = [];
        }
        grouped[account.type].push(account);
      });

    return grouped;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'Nie';
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  }

  getTimeSinceLastTransaction(date: Date | undefined): string {
    if (!date) return 'Keine Aktivität';

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Gestern';
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    if (diffDays < 30) return `vor ${Math.ceil(diffDays / 7)} Wochen`;
    if (diffDays < 365) return `vor ${Math.ceil(diffDays / 30)} Monaten`;
    return `vor ${Math.ceil(diffDays / 365)} Jahren`;
  }

  retry() {
    this.loadInitialData();
  }

  recalculateBalances() {
    this.isLoading = true;
    this.accountsApi.recalculateAccountBalances()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          console.log('Account balances recalculated successfully');
          this.loadInitialData(); // Lade die Daten neu
        },
        error: (error) => {
          console.error('Error recalculating balances:', error);
        }
      });
  }

  // Account Selection Methods
  selectAccount(account: AccountWithStats): void {
    const selectedAccount: SelectedAccount = {
      id: account.id,
      name: account.name,
      type: this.getAccountTypeInfo(account.type)?.name || account.type,
      balance: account.currentBalance,
      icon: this.getAccountTypeInfo(account.type)?.icon,
      color: this.getAccountTypeInfo(account.type)?.color
    };

    this.accountSelection.selectAccount(selectedAccount);
    console.log('✅ Account selected:', selectedAccount.name);
    console.log('🏦 Selected account details:', selectedAccount);
  }

  clearAccountSelection(): void {
    this.accountSelection.clearSelection();
    console.log('Account selection cleared');
  }

  isAccountSelected(accountId: string): boolean {
    return this.selectedAccountId === accountId;
  }

  hasAccountSelection(): boolean {
    return this.accountSelection.hasSelection();
  }

  getSelectedAccountName(): string {
    const selected = this.accountSelection.getSelectedAccount();
    return selected ? selected.name : '';
  }

  // Account CRUD Operations
  openCreateAccountDialog(): void {
    const dialogRef = this.dialog.open(AccountFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        isEdit: false
      } as AccountDialogData,
      disableClose: true,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'create') {
        this.createAccount(result.account);
      }
    });
  }

  openEditAccountDialog(account: AccountWithStats): void {
    const dialogRef = this.dialog.open(AccountFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        account: {
          id: account.id,
          name: account.name,
          type: account.type as 'CHECKING' | 'SAVINGS' | 'CREDIT_CARD' | 'INVESTMENT' | 'CASH' | 'OTHER',
          balance: account.currentBalance,
          note: account.note,
          isActive: account.isActive,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt
        },
        isEdit: true
      } as AccountDialogData,
      disableClose: true,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'edit') {
        this.updateAccount(account.id, result.account);
      }
    });
  }

  createAccount(accountData: Partial<AccountWithStats>): void {
    const createDto = {
      name: accountData.name || '',
      type: this.mapFrontendTypeToBackend(accountData.type || 'checking'),
      balance: accountData.currentBalance || 0,
      currency: 'EUR',
      note: accountData.note,
      isActive: true
    };

    this.accountsApi.create(createDto).subscribe({
      next: (account) => {
        const newAccount = this.mapAccountsToAccountWithStats([account])[0];
        this.accounts.unshift(newAccount);
        this.calculateStats();
        console.log('Konto erstellt:', account.name);
      },
      error: (error) => {
        console.error('Error creating account:', error);
      }
    });
  }

  private mapFrontendTypeToBackend(frontendType: string): Account['type'] {
    const typeMap: { [key: string]: Account['type'] } = {
      'checking': 'CHECKING',
      'savings': 'SAVINGS',
      'credit': 'CREDIT_CARD',
      'cash': 'CASH',
      'investment': 'INVESTMENT',
      'business': 'OTHER'
    };
    return typeMap[frontendType] || 'CHECKING';
  }

  updateAccount(accountId: string, accountData: Partial<AccountWithStats>): void {
    const updateDto = {
      name: accountData.name,
      type: accountData.type ? this.mapFrontendTypeToBackend(accountData.type) : undefined,
      balance: accountData.currentBalance,
      note: accountData.note,
      isActive: accountData.isActive
    };

    this.accountsApi.update(accountId, updateDto).subscribe({
      next: (account) => {
        const index = this.accounts.findIndex(a => a.id === accountId);
        if (index !== -1) {
          this.accounts[index] = this.mapAccountsToAccountWithStats([account])[0];
          this.calculateStats();
          console.log('Konto aktualisiert:', account.name);
        }
      },
      error: (error) => {
        console.error('Error updating account:', error);
      }
    });
  }

  deleteAccount(account: AccountWithStats): void {
    const hasTransactions = account.transactionCount > 0;

    let confirmMessage = `Möchten Sie das Konto "${account.name}" wirklich löschen?`;
    if (hasTransactions) {
      confirmMessage += `\n\nHinweis: Dieses Konto hat ${account.transactionCount} Transaktionen. Das Konto wird deaktiviert und bleibt in Filtern verfügbar.`;
    }

    const confirmed = confirm(confirmMessage);
    if (confirmed) {
      this.accountsApi.delete(account.id).subscribe({
        next: () => {
          this.accounts = this.accounts.filter(a => a.id !== account.id);
          this.calculateStats();
          console.log('Konto gelöscht:', account.name);
        },
        error: (error) => {
          console.error('Error deleting account:', error);
          // If delete failed, try to refresh the list to see current state
          this.loadInitialData();
        }
      });
    }
  }

  private generateId(): string {
    return 'acc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private calculateStats(): void {
    const activeAccounts = this.accounts.filter(a => a.isActive);

    this.stats = {
      totalAccounts: activeAccounts.length,
      totalBalance: activeAccounts.reduce((sum, account) => sum + account.currentBalance, 0),
      totalTransactions: activeAccounts.reduce((sum, account) => sum + account.transactionCount, 0)
    };
  }
}

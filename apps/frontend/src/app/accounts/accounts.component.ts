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
import { AccountFormComponent, AccountDialogData } from './account-form/account-form.component';

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
    MatBadgeModule
  ],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.scss'
})
export class AccountsComponent implements OnInit {
  private dialog = inject(MatDialog);

  // Data properties
  accounts: AccountWithStats[] = [];
  accountTypes: AccountType[] = [];
  
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
    this.loadInitialData();
  }

  private loadInitialData() {
    this.isLoading = true;
    this.hasError = false;

    // Simulate API call
    setTimeout(() => {
      try {
        this.loadAccountTypes();
        this.loadAccounts();
        this.checkEmptyState();
        
        this.isLoading = false;
      } catch {
        this.hasError = true;
        this.isLoading = false;
      }
    }, 1000);
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

  private loadAccounts() {
    // Generate mock accounts with realistic data
    this.accounts = [
      {
        id: '1',
        name: 'Sparkasse Hauptkonto',
        type: 'checking',
        currentBalance: 2847.35,
        note: 'Hauptkonto für Gehalt und tägliche Ausgaben',
        transactionCount: 89,
        lastTransactionDate: new Date('2025-10-25'),
        createdAt: new Date('2020-01-15'),
        updatedAt: new Date('2025-10-25'),
        isActive: true
      },
      {
        id: '2',
        name: 'ING Tagesgeld',
        type: 'savings',
        currentBalance: 15240.80,
        note: 'Notgroschen und kurzfristige Ersparnisse',
        transactionCount: 24,
        lastTransactionDate: new Date('2025-10-20'),
        createdAt: new Date('2021-03-10'),
        updatedAt: new Date('2025-10-20'),
        isActive: true
      },
      {
        id: '3',
        name: 'DKB Visa Card',
        type: 'credit',
        currentBalance: -542.15,
        note: 'Kreditkarte für Online-Einkäufe und Reisen',
        transactionCount: 34,
        lastTransactionDate: new Date('2025-10-24'),
        createdAt: new Date('2022-06-01'),
        updatedAt: new Date('2025-10-24'),
        isActive: true
      },
      {
        id: '4',
        name: 'Trade Republic',
        type: 'investment',
        currentBalance: 8950.42,
        note: 'ETF-Sparplan und Einzelaktien',
        transactionCount: 12,
        lastTransactionDate: new Date('2025-10-15'),
        createdAt: new Date('2023-02-01'),
        updatedAt: new Date('2025-10-15'),
        isActive: true
      },
      {
        id: '5',
        name: 'Bargeld',
        type: 'cash',
        currentBalance: 127.50,
        note: 'Portemonnaie und Spardose',
        transactionCount: 45,
        lastTransactionDate: new Date('2025-10-23'),
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date('2025-10-23'),
        isActive: true
      },
      {
        id: '6',
        name: 'Freelancer Konto',
        type: 'business',
        currentBalance: 3240.00,
        note: 'Separates Konto für freiberufliche Tätigkeiten',
        transactionCount: 18,
        lastTransactionDate: new Date('2025-10-22'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2025-10-22'),
        isActive: true
      }
    ];
    
    this.calculateStats();
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
    const newAccount: AccountWithStats = {
      id: this.generateId(),
      name: accountData.name || '',
      type: accountData.type || 'CHECKING',
      currentBalance: accountData.currentBalance || 0,
      note: accountData.note,
      transactionCount: 0,
      lastTransactionDate: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    this.accounts.unshift(newAccount);
    this.calculateStats();
    
    // Show success message
    console.log('Konto erstellt:', newAccount.name);
  }

  updateAccount(accountId: string, accountData: Partial<AccountWithStats>): void {
    const index = this.accounts.findIndex(a => a.id === accountId);
    if (index !== -1) {
      this.accounts[index] = {
        ...this.accounts[index],
        ...accountData,
        updatedAt: new Date()
      };
      this.calculateStats();
      
      // Show success message
      console.log('Konto aktualisiert:', this.accounts[index].name);
    }
  }

  deleteAccount(account: AccountWithStats): void {
    const hasTransactions = account.transactionCount > 0;
    
    let confirmMessage = `Möchten Sie das Konto "${account.name}" wirklich löschen?`;
    if (hasTransactions) {
      confirmMessage += `\n\nHinweis: Dieses Konto hat ${account.transactionCount} Transaktionen. Das Konto wird deaktiviert und bleibt in Filtern verfügbar.`;
    }
    
    const confirmed = confirm(confirmMessage);
    if (confirmed) {
      if (hasTransactions) {
        // Deactivate account instead of deleting
        const index = this.accounts.findIndex(a => a.id === account.id);
        if (index !== -1) {
          this.accounts[index].isActive = false;
          this.accounts[index].updatedAt = new Date();
          this.calculateStats();
          console.log('Konto deaktiviert:', account.name);
        }
      } else {
        // Actually delete the account
        this.accounts = this.accounts.filter(a => a.id !== account.id);
        this.calculateStats();
        console.log('Konto gelöscht:', account.name);
      }
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
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { BaseComponent } from '../shared/components/base.component';
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
import {
  AccountsApiService,
  Account,
  AccountWithCalculatedBalance,
  UpdateAccountDto,
} from './accounts-api.service';
import {
  AccountSelectionService,
  SelectedAccount,
} from '../shared/services/account-selection.service';
import { finalize } from 'rxjs/operators';

/**
 * Konto mit erweiterten Statistiken
 */
/**
 * Konto mit erweiterten Statistiken
 */
export interface AccountWithStats {
  /** Eindeutige Konto-ID */
  id: string;
  /** Name des Kontos */
  name: string;
  /** Kontotyp (Frontend-Format) */
  type: string;
  /** Aktueller Saldo */
  currentBalance: number;
  /** Notiz (optional) */
  note?: string;
  /** Anzahl Transaktionen */
  transactionCount: number;
  /** Datum der letzten Transaktion (optional) */
  lastTransactionDate?: Date;
  /** Erstellungsdatum */
  createdAt: Date;
  /** Letzte Änderung */
  updatedAt: Date;
  /** Ob Konto aktiv ist */
  isActive: boolean;
}

/**
 * Kontotyp mit Darstellungs-Informationen
 */
export interface AccountType {
  /** Eindeutige Typ-ID */
  id: string;
  /** Anzeigename */
  name: string;
  /** Material Icon Name */
  icon: string;
  /** Beschreibung */
  description: string;
  /** Farbe (Hex) */
  color: string;
}

/**
 * Accounts Component - Übersicht und Verwaltung aller Konten
 *
 * Features:
 * - Listet alle Konten des Benutzers (Cards oder Table View)
 * - Erstellen, Bearbeiten, Löschen von Konten
 * - Kategorie-Zuordnung für Konten
 * - Kontenauswahl für globalen Filter
 * - Anzeige von Statistiken (Gesamt-Saldo, Anzahl Transaktionen)
 * - Berechnung von Salden basierend auf Transaktionen
 * - Gruppierung nach Kontotyp
 * - Auto-Selection des ersten Kontos
 *
 * Verwendet BaseComponent für Loading/Error States.
 *
 * @example
 * ```typescript
 * // In app.routes.ts
 * {
 *   path: 'accounts',
 *   component: AccountsComponent
 * }
 * ```
 */
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
    MatDividerModule,
  ],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.scss',
})
export class AccountsComponent extends BaseComponent implements OnInit {
  protected componentKey = 'accounts';
  private dialog = inject(MatDialog);
  private accountsApi = inject(AccountsApiService);
  private accountSelection = inject(AccountSelectionService);
  private cdr = inject(ChangeDetectorRef);

  /** Liste aller Konten mit Statistiken */
  accounts: AccountWithStats[] = [];
  /** Verfügbare Kontotypen mit Icons und Farben */
  accountTypes: AccountType[] = [];
  /** ID des aktuell ausgewählten Kontos */
  selectedAccountId: string | null = null;

  /** Helper für Template-Zugriff auf Object.keys */
  Object = Object;

  /** Ob Liste leer ist */
  isEmpty = false;

  /** Ansichtsmodus: Cards oder Tabelle */
  viewMode: 'cards' | 'table' = 'cards';

  /** Gesamtstatistiken über alle Konten */
  stats = {
    totalAccounts: 0,
    totalBalance: 0,
    totalTransactions: 0,
  };

  /** Tabellenspalten für Table View */
  displayedColumns: string[] = [
    'name',
    'type',
    'balance',
    'transactions',
    'lastActivity',
    'actions',
  ];

  /**
   * Angular Lifecycle Hook - Initialisierung
   */
  ngOnInit() {
    // BaseComponent initialisieren
    this.initializeLoadingState();

    // Initialize account selection service
    this.accountSelection.initialize();

    // Subscribe to selected account changes
    this.accountSelection.selectedAccount$.subscribe((account) => {
      this.selectedAccountId = account?.id || null;
    });

    this.loadInitialData();
  }

  /**
   * Lädt initiale Daten (Konten mit berechneten Salden)
   *
   * @private
   */
  private loadInitialData() {
    this.setLoading();

    this.loadAccountTypes();

    // Verwende die neue API mit berechneten Salden
    this.accountsApi
      .getAccountsWithCalculatedBalances()
      .pipe(finalize(() => this.setSuccess(this.isEmpty)))
      .subscribe({
        next: (accounts) => {
          console.log('📊 Received accounts from API:', accounts.length);
          console.log(
            '📊 Account names:',
            accounts.map((a) => a.name),
          );
          this.accounts = this.mapCalculatedAccountsToAccountWithStats(accounts);
          console.log('📊 Mapped accounts:', this.accounts.length);

          // Cache neu aufbauen da neue accounts geladen wurden
          this.rebuildAccountsByType();

          this.checkEmptyState();
          this.calculateStats();

          // Auto-select first account if none is selected
          this.autoSelectFirstAccountIfNeeded();
        },
        error: (error) => {
          console.error('Error loading accounts:', error);
          this.setError('Fehler beim Laden der Konten');
        },
      });
  }

  /**
   * Lädt Kontotyp-Definitionen mit Icons und Farben
   *
   * @private
   */
  private loadAccountTypes() {
    this.accountTypes = [
      {
        id: 'checking',
        name: 'Girokonto',
        icon: 'account_balance',
        description: 'Hauptkonto für tägliche Transaktionen',
        color: '#2196f3',
      },
      {
        id: 'savings',
        name: 'Sparkonto',
        icon: 'savings',
        description: 'Langfristige Ersparnisse',
        color: '#4caf50',
      },
      {
        id: 'credit',
        name: 'Kreditkarte',
        icon: 'credit_card',
        description: 'Kreditkarten-Konto',
        color: '#ff9800',
      },
      {
        id: 'investment',
        name: 'Investmentkonto',
        icon: 'trending_up',
        description: 'Aktien, ETFs und andere Investments',
        color: '#9c27b0',
      },
      {
        id: 'cash',
        name: 'Bargeld',
        icon: 'payments',
        description: 'Bargeld und Münzen',
        color: '#795548',
      },
      {
        id: 'business',
        name: 'Geschäftskonto',
        icon: 'business',
        description: 'Geschäftliche Transaktionen',
        color: '#607d8b',
      },
    ];
  }

  /**
   * Mapped einfache Accounts zu AccountWithStats
   *
   * @private
   * @param accounts - Einfache Account-Liste
   * @returns AccountWithStats Array
   */
  private mapAccountsToAccountWithStats(accounts: Account[]): AccountWithStats[] {
    return accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: this.mapAccountType(account.type),
      currentBalance: account.balance,
      note: account.note,
      transactionCount: 0, // TODO: Get from backend when available
      lastTransactionDate: undefined, // TODO: Get from backend when available
      createdAt: new Date(account.createdAt || Date.now()),
      updatedAt: new Date(account.updatedAt || Date.now()),
      isActive: account.isActive,
    }));
  }

  /**
   * Mapped Accounts mit berechneten Salden zu AccountWithStats
   *
   * @private
   * @param accounts - AccountWithCalculatedBalance Array
   * @returns AccountWithStats Array
   */
  private mapCalculatedAccountsToAccountWithStats(
    accounts: AccountWithCalculatedBalance[],
  ): AccountWithStats[] {
    return accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: this.mapAccountType(account.type),
      currentBalance: account.calculatedBalance, // Verwende den berechneten Saldo
      note: account.note,
      transactionCount: account.transactionCount,
      lastTransactionDate: account.lastTransactionDate
        ? new Date(account.lastTransactionDate)
        : undefined,
      createdAt: new Date(account.createdAt || Date.now()),
      updatedAt: new Date(account.updatedAt || Date.now()),
      isActive: account.isActive,
    }));
  }

  /**
   * Mapped Backend-Kontotyp zu Frontend-Typ
   *
   * @private
   * @param backendType - Backend AccountType
   * @returns Frontend Typ-String
   */
  private mapAccountType(backendType: Account['type']): string {
    const typeMap: { [key in Account['type']]: string } = {
      CHECKING: 'checking',
      SAVINGS: 'savings',
      CREDIT_CARD: 'credit',
      CASH: 'cash',
      INVESTMENT: 'investment',
      OTHER: 'business',
    };
    const result = typeMap[backendType] || 'checking';
    console.log('🔄 mapAccountType:', backendType, '->', result);
    return result;
  }

  /**
   * Prüft ob Konten-Liste leer ist
   *
   * @private
   */
  private checkEmptyState() {
    this.isEmpty = this.accounts.length === 0;
  }

  /**
   * Wechselt zwischen Cards und Table View
   */
  toggleViewMode() {
    this.viewMode = this.viewMode === 'cards' ? 'table' : 'cards';
  }

  /**
   * Öffnet Kategorie-Zuordnungs-Dialog für Konto
   *
   * @param account - Konto für Kategorie-Verwaltung
   */
  manageCategoriesForAccount(account: AccountWithStats) {
    import('./category-assignment/category-assignment.component').then(
      ({ CategoryAssignmentComponent }) => {
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
              color: this.getAccountTypeInfo(account.type)?.color,
            },
          } as CategoryAssignmentDialogData,
          disableClose: false,
        });

        dialogRef.afterClosed().subscribe(() => {
          // No specific action needed after closing
          console.log('Category assignment dialog closed');
        });
      },
    );
  }

  /**
   * Ruft AccountType-Informationen anhand ID ab
   *
   * @param typeId - Typ-ID
   * @returns AccountType oder undefined
   */
  getAccountTypeInfo(typeId: string): AccountType | undefined {
    return this.accountTypes.find((t) => t.id === typeId);
  }

  /**
   * Gibt CSS-Klasse für Saldo-Anzeige zurück
   *
   * @param balance - Saldo-Betrag
   * @returns CSS-Klasse (positive/negative/neutral)
   */
  getBalanceClass(balance: number): string {
    if (balance > 0) return 'positive';
    if (balance < 0) return 'negative';
    return 'neutral';
  }

  /**
   * Berechnet Gesamt-Saldo über alle Konten
   *
   * @returns Summe aller Kontensalden
   */
  getTotalBalance(): number {
    return this.accounts.reduce((sum, account) => sum + account.currentBalance, 0); // Summe aller Konten
  }

  /**
   * Gibt Anzahl aller Konten zurück
   *
   * @returns Anzahl Konten
   */
  getActiveAccountsCount(): number {
    return this.accounts.length; // Alle Konten des Users
  }

  /**
   * Gibt alle Konten zurück
   *
   * @returns Array aller Konten
   */
  getActiveAccounts(): AccountWithStats[] {
    return this.accounts; // Alle Konten des Users
  }

  /**
   * Gibt aktuell ausgewähltes Konto zurück
   *
   * @returns Aktives Konto oder undefined
   */
  getCurrentlySelectedAccount(): AccountWithStats | undefined {
    return this.accounts.find((account) => account.isActive);
  }

  /**
   * Prüft ob ein Konto ausgewählt ist
   *
   * @returns true wenn Konto ausgewählt
   */
  hasSelectedAccount(): boolean {
    return this.accounts.some((account) => account.isActive);
  }

  /** Cache für Konten gruppiert nach Typ */
  accountsByType: { [key: string]: AccountWithStats[] } = {};
  /** Array der Typ-Keys für Iteration */
  accountTypeKeys: string[] = [];

  /**
   * Baut Cache für Konten-Gruppierung nach Typ neu auf
   *
   * @private
   */
  private rebuildAccountsByType(): void {
    console.log('🔧 Rebuilding accounts by type cache');
    console.log(
      '🔧 Current accounts before grouping:',
      this.accounts.map((a) => ({ id: a.id, name: a.name, type: a.type })),
    );

    // Neu gruppieren
    const grouped: { [key: string]: AccountWithStats[] } = {};

    this.accounts.forEach((account) => {
      if (!grouped[account.type]) {
        grouped[account.type] = [];
      }
      grouped[account.type].push(account);
    });

    console.log(
      '🔧 Grouped accounts:',
      Object.keys(grouped).map((type) => ({
        type,
        count: grouped[type].length,
        accounts: grouped[type].map((a) => ({ id: a.id, name: a.name, type: a.type })),
      })),
    );

    // Prüfe auf Duplikat-IDs
    const allAccountIds = this.accounts.map((a) => a.id);
    const uniqueAccountIds = [...new Set(allAccountIds)];
    if (allAccountIds.length !== uniqueAccountIds.length) {
      console.error('🚨 DUPLICATE ACCOUNT IDs DETECTED:', allAccountIds);
    }

    // Prüfe auf identische Objektreferenzen
    const seenObjects = new Set();
    this.accounts.forEach((account, index) => {
      if (seenObjects.has(account)) {
        console.error('🚨 SAME OBJECT REFERENCE DETECTED at index:', index, 'Account:', account);
      }
      seenObjects.add(account);
    });

    // Properties aktualisieren (nur einmalig!)
    this.accountsByType = grouped;
    this.accountTypeKeys = Object.keys(grouped);
    console.log('✅ Cache updated - accountsByType and accountTypeKeys set');
  }

  /** TrackBy-Funktion für Accounts (Performance-Optimierung) */
  trackByAccountId = this.trackByUtils.trackByAccountId.bind(this.trackByUtils);
  /** TrackBy-Funktion für Typ-Keys */
  trackByTypeId = this.trackByUtils.trackByString.bind(this.trackByUtils);

  /**
   * Formatiert Betrag als Währung
   *
   * @param amount - Betrag
   * @returns Formatierter String
   */
  formatCurrency(amount: number): string {
    return this.formatUtils.formatCurrency(amount);
  }

  /**
   * Formatiert Datum im deutschen Format
   *
   * @param date - Datum oder undefined
   * @returns Formatierter String oder 'Nie'
   */
  formatDate(date: Date | undefined): string {
    if (!date) return 'Nie';
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  /**
   * Berechnet menschenlesbare Zeit seit letzter Transaktion
   *
   * @param date - Datum der letzten Transaktion
   * @returns Relativer Zeit-String (z.B. "vor 3 Tagen")
   */
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

  /**
   * Wiederholt das Laden der Daten (Error Recovery)
   */
  retry() {
    this.loadInitialData();
  }

  /**
   * Berechnet alle Konto-Salden neu
   *
   * Nützlich nach CSV-Import oder manuellen Änderungen.
   */
  recalculateBalances() {
    this.setLoading();
    this.accountsApi
      .recalculateAccountBalances()
      .pipe(finalize(() => this.setSuccess(this.isEmpty)))
      .subscribe({
        next: () => {
          console.log('Account balances recalculated successfully');
          this.loadInitialData(); // Lade die Daten neu
        },
        error: (error) => {
          console.error('Error recalculating balances:', error);
        },
      });
  }

  /**
   * Wählt Konto für globalen Filter aus
   *
   * Setzt Konto als aktiv und aktualisiert AccountSelectionService.
   *
   * @param account - Auszuwählendes Konto
   */
  async selectAccount(account: AccountWithStats): Promise<void> {
    const selectedAccount: SelectedAccount = {
      id: account.id,
      name: account.name,
      type: this.getAccountTypeInfo(account.type)?.name || account.type,
      balance: account.currentBalance,
      icon: this.getAccountTypeInfo(account.type)?.icon,
      color: this.getAccountTypeInfo(account.type)?.color,
    };

    try {
      await this.accountSelection.selectAccount(selectedAccount);
      console.log('✅ Account selected and set as active in database:', selectedAccount.name);
      console.log('🏦 Selected account details:', selectedAccount);
    } catch (error) {
      console.error('❌ Error selecting account:', error);
      alert('Fehler beim Auswählen des Kontos. Bitte versuchen Sie es erneut.');
    }
  }

  /**
   * Hebt Kontenauswahl auf
   *
   * Deaktiviert alle Konten im Backend.
   */
  async clearAccountSelection(): Promise<void> {
    try {
      await this.accountSelection.clearSelection();
      console.log('✅ Account selection cleared and deactivated in database');
    } catch (error) {
      console.error('❌ Error clearing account selection:', error);
    }
  }

  /**
   * Prüft ob Konto ausgewählt ist
   *
   * @param accountId - Konto-ID
   * @returns true wenn Konto ausgewählt
   */
  isAccountSelected(accountId: string): boolean {
    return this.selectedAccountId === accountId;
  }

  /**
   * Prüft ob überhaupt ein Konto ausgewählt ist
   *
   * @returns true wenn Auswahl existiert
   */
  hasAccountSelection(): boolean {
    return this.accountSelection.hasSelection();
  }

  /**
   * Gibt Name des ausgewählten Kontos zurück
   *
   * @returns Kontoname oder leerer String
   */
  getSelectedAccountName(): string {
    const selected = this.accountSelection.getSelectedAccount();
    return selected ? selected.name : '';
  }

  /**
   * Öffnet Dialog zum Erstellen eines neuen Kontos
   */
  openCreateAccountDialog(): void {
    const dialogRef = this.dialog.open(AccountFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        isEdit: false,
      } as AccountDialogData,
      disableClose: true,
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('🚪 Dialog closed with result:', result);
      if (result && result.action === 'create') {
        console.log('✅ Create action detected, calling createAccount');
        this.createAccount(result.account);
      } else {
        console.log('❌ No create action or result is null');
      }
    });
  }

  /**
   * Öffnet Dialog zum Bearbeiten eines Kontos
   *
   * @param account - Zu bearbeitendes Konto
   */
  openEditAccountDialog(account: AccountWithStats): void {
    const dialogRef = this.dialog.open(AccountFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        account: {
          id: account.id,
          name: account.name,
          type: this.mapFrontendTypeToBackend(account.type),
          balance: account.currentBalance,
          currency: 'EUR',
          note: account.note,
          isActive: account.isActive,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
        },
        isEdit: true,
      } as AccountDialogData,
      disableClose: true,
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.action === 'edit') {
        this.updateAccount(account.id, result.account);
      }
    });
  }

  /**
   * Fügt neues Konto zur UI hinzu
   *
   * Konto wurde bereits vom Dialog erstellt, wird nur zur Liste hinzugefügt.
   *
   * @param accountData - Erstelltes Konto vom Backend
   */
  createAccount(accountData: Account): void {
    console.log('🏦 AccountsComponent.createAccount called with:', accountData);
    console.log('📝 Account already created by form, adding to UI list');

    // Das Konto wurde bereits von der Account-Form erstellt
    // Wir fügen es nur zur UI-Liste hinzu
    const newAccountWithStats: AccountWithStats = {
      id: accountData.id,
      name: accountData.name,
      type: this.mapAccountType(accountData.type),
      currentBalance: accountData.balance || 0,
      note: accountData.note,
      transactionCount: 0,
      lastTransactionDate: undefined,
      createdAt: new Date(accountData.createdAt || Date.now()),
      updatedAt: new Date(accountData.updatedAt || Date.now()),
      isActive: accountData.isActive,
    };

    // Wenn das neue Konto aktiv ist, deaktiviere alle anderen
    if (accountData.isActive) {
      this.accounts.forEach((acc) => (acc.isActive = false));
    }

    // Füge das neue Konto am Anfang der Liste hinzu
    this.accounts.unshift(newAccountWithStats);

    console.log('📊 Updated accounts list, total:', this.accounts.length);

    // Cache neu aufbauen da sich accounts geändert haben
    this.rebuildAccountsByType();

    this.checkEmptyState();
    this.calculateStats();

    // Wenn das neue Konto aktiv ist, setze es als ausgewähltes Konto
    if (accountData.isActive) {
      const selectedAccount: SelectedAccount = {
        id: newAccountWithStats.id,
        name: newAccountWithStats.name,
        type: this.getAccountTypeInfo(newAccountWithStats.type)?.name || newAccountWithStats.type,
        balance: newAccountWithStats.currentBalance,
        icon: this.getAccountTypeInfo(newAccountWithStats.type)?.icon,
        color: this.getAccountTypeInfo(newAccountWithStats.type)?.color,
      };

      // Aktualisiere den AccountSelectionService (das Konto wurde bereits im Backend als aktiv gesetzt)
      this.accountSelection.selectAccount(selectedAccount).catch((err) => {
        console.error('Error updating selected account:', err);
      });
    }

    // Trigger Change Detection um die View zu aktualisieren
    this.cdr.detectChanges();
  }

  /**
   * Mapped Frontend-Typ zu Backend-AccountType
   *
   * @private
   * @param frontendType - Frontend Typ-String
   * @returns Backend AccountType
   */
  private mapFrontendTypeToBackend(frontendType: string): Account['type'] {
    const typeMap: { [key: string]: Account['type'] } = {
      checking: 'CHECKING',
      savings: 'SAVINGS',
      credit: 'CREDIT_CARD',
      cash: 'CASH',
      investment: 'INVESTMENT',
      business: 'OTHER',
    };
    return typeMap[frontendType] || 'CHECKING';
  }

  /**
   * Aktualisiert bestehendes Konto
   *
   * Sendet Update an Backend und aktualisiert lokale Liste.
   *
   * @param accountId - Konto-ID
   * @param accountData - Aktualisierte Konto-Daten
   */
  updateAccount(accountId: string, accountData: Account): void {
    console.log('🔄 updateAccount called with ID:', accountId, 'Data:', accountData);

    const updateDto: UpdateAccountDto = {
      name: accountData.name,
      type: accountData.type,
      balance: accountData.balance,
      note: accountData.note,
      isActive: accountData.isActive,
    };

    console.log('📤 Sending update DTO:', updateDto);

    this.accountsApi.update(accountId, updateDto).subscribe({
      next: (account) => {
        console.log('✅ Account updated successfully:', account);
        console.log(
          '📋 Current accounts before update:',
          this.accounts.map((a) => ({ id: a.id, name: a.name, type: a.type })),
        );

        // Finde das zu aktualisierende Konto in der lokalen Liste
        const accountIndex = this.accounts.findIndex((a) => a.id === accountId);
        if (accountIndex !== -1) {
          console.log('🔍 Found account to update at index:', accountIndex, 'ID:', accountId);

          // Wenn das aktualisierte Konto aktiv gesetzt wird, deaktiviere alle anderen
          if (account.isActive) {
            console.log('🔄 Setting other accounts to inactive');
            this.accounts.forEach((acc, idx) => {
              if (idx !== accountIndex) {
                acc.isActive = false;
              }
            });
          }

          // Erstelle ein komplett neues Account-Objekt statt das bestehende zu modifizieren
          const existingAccount = this.accounts[accountIndex];
          console.log(
            '📝 Updating account properties for:',
            existingAccount.name,
            'ID:',
            existingAccount.id,
          );

          console.log('🔄 BEFORE update:', {
            id: existingAccount.id,
            name: existingAccount.name,
            type: existingAccount.type,
            balance: existingAccount.currentBalance,
          });

          // Erstelle ein komplett neues Objekt mit allen Eigenschaften
          const updatedAccount: AccountWithStats = {
            id: account.id,
            name: account.name,
            type: this.mapAccountType(account.type),
            currentBalance: account.balance,
            note: account.note,
            transactionCount: existingAccount.transactionCount, // Behalte existierende Werte
            lastTransactionDate: existingAccount.lastTransactionDate,
            createdAt: existingAccount.createdAt,
            updatedAt: new Date(account.updatedAt || Date.now()),
            isActive: account.isActive,
          };

          // Ersetze das Konto in der Liste
          this.accounts[accountIndex] = updatedAccount;

          console.log('🔄 AFTER update:', {
            id: updatedAccount.id,
            name: updatedAccount.name,
            type: updatedAccount.type,
            balance: updatedAccount.currentBalance,
          });

          console.log(
            '📋 All accounts after update:',
            this.accounts.map((a) => ({ id: a.id, name: a.name, type: a.type })),
          );

          // Detailliertes Logging: Welche Konten haben sich geändert?
          this.accounts.forEach((acc, idx) => {
            if (idx === accountIndex) {
              console.log(
                `✅ UPDATED account at index ${idx}: ${acc.name} (${acc.id}) -> type: ${acc.type}`,
              );
            } else {
              console.log(
                `ℹ️ UNCHANGED account at index ${idx}: ${acc.name} (${acc.id}) -> type: ${acc.type}`,
              );
            }
          });

          // Cache neu aufbauen da sich account geändert hat
          this.rebuildAccountsByType();

          // Statistiken neu berechnen
          this.calculateStats();

          // Account Selection Service aktualisieren falls nötig
          if (account.isActive) {
            this.accountSelection
              .selectAccount({
                id: account.id,
                name: account.name,
                type: account.type,
                balance: account.balance,
              })
              .catch((err) => {
                console.error('Error updating selected account:', err);
              });
          }
        } else {
          console.warn('⚠️ Account not found in local list, reloading all data');
          this.loadInitialData(); // Fallback: Lade alle Daten neu
        }
      },
      error: (error) => {
        console.error('❌ Error updating account:', error);
      },
    });
  }

  /**
   * Löscht Konto
   *
   * Konten mit Transaktionen werden deaktiviert statt gelöscht.
   * Fragt Benutzer nach Bestätigung.
   *
   * @param account - Zu löschendes Konto
   */
  deleteAccount(account: AccountWithStats): void {
    console.log('🗑️ Attempting to delete account:', account.name, 'ID:', account.id);

    const hasTransactions = account.transactionCount > 0;

    let confirmMessage = `Möchten Sie das Konto "${account.name}" wirklich löschen?`;
    if (hasTransactions) {
      confirmMessage += `\n\nHinweis: Dieses Konto hat ${account.transactionCount} Transaktionen. Das Konto wird deaktiviert und bleibt in Filtern verfügbar.`;
    }

    const confirmed = confirm(confirmMessage);
    console.log('🤔 User confirmed deletion:', confirmed);

    if (confirmed) {
      console.log('📤 Sending delete request for account ID:', account.id);

      // Prüfe ob das zu löschende Konto das aktuell ausgewählte ist
      const isSelectedAccount = this.isAccountSelected(account.id);

      this.accountsApi.delete(account.id).subscribe({
        next: (response) => {
          console.log('✅ Account delete response:', response);
          this.accounts = this.accounts.filter((a) => a.id !== account.id);

          // Cache neu aufbauen da sich accounts geändert haben
          this.rebuildAccountsByType();

          this.calculateStats();
          console.log('✅ Account removed from UI list. Remaining accounts:', this.accounts.length);

          // Wenn das gelöschte Konto das ausgewählte war, hebe die Auswahl auf
          if (isSelectedAccount) {
            console.log('🔄 Deleted account was selected, clearing selection');
            this.accountSelection.clearSelection().catch((err) => {
              console.error('Error clearing account selection:', err);
            });
          }

          // Trigger Change Detection
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('❌ Error deleting account:', error);
          // If delete failed, try to refresh the list to see current state
          this.loadInitialData();
        },
      });
    }
  }

  /**
   * Generiert eindeutige ID
   *
   * @protected
   * @returns Generierte ID
   */
  protected generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Wählt automatisch erstes Konto aus wenn keines ausgewählt
   *
   * Wird bei Initialisierung aufgerufen.
   *
   * @private
   */
  private autoSelectFirstAccountIfNeeded(): void {
    // Check if an account is already selected
    if (this.accountSelection.hasSelection()) {
      console.log('👥 Account already selected, skipping auto-select');
      return;
    }

    // Check if we have accounts to select from
    if (this.accounts.length === 0) {
      console.log('📭 No accounts available for auto-select');
      return;
    }

    // Wichtig: Prüfe ob es ein aktives Konto in der Datenbank gibt
    // Wenn KEIN Konto isActive=true hat, bedeutet das, der User hat die Auswahl aufgehoben
    const hasAnyActiveAccount = this.accounts.some((account) => account.isActive);

    if (!hasAnyActiveAccount) {
      console.log('ℹ️ No active accounts found - user has cleared selection, skipping auto-select');
      return;
    }

    // Select the first active account
    const firstActiveAccount = this.accounts.find((account) => account.isActive);
    if (firstActiveAccount) {
      console.log('🎯 Auto-selecting first active account:', firstActiveAccount.name);
      this.selectAccount(firstActiveAccount);
    }
  }

  /**
   * Berechnet Statistiken über alle Konten
   *
   * @private
   */
  private calculateStats(): void {
    // Statistiken für alle Konten des Users berechnen
    this.stats = {
      totalAccounts: this.accounts.length,
      totalBalance: this.accounts.reduce((sum, account) => sum + account.currentBalance, 0),
      totalTransactions: this.accounts.reduce((sum, account) => sum + account.transactionCount, 0),
    };
  }

  /**
   * Hebt Konto-Filter auf
   */
  clearAccountFilter(): void {
    this.accountSelection.clearSelection().catch((err) => {
      console.error('Error clearing account filter:', err);
    });
  }
}

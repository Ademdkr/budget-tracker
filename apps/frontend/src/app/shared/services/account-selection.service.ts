import { Injectable, inject, Injector } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { AuthService } from '../../auth/auth.service';

export interface SelectedAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  icon?: string;
  color?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AccountSelectionService {
  private authService = inject(AuthService);
  private injector = inject(Injector);

  private selectedAccountSubject = new BehaviorSubject<SelectedAccount | null>(null);
  public selectedAccount$ = this.selectedAccountSubject.asObservable();

  private currentUserId: string | null = null;
  private isInitialized = false; // Flag um mehrfache Initialisierung zu verhindern
  private initializationPromise: Promise<void> | null = null; // Promise um parallele Aufrufe zu synchronisieren
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private accountsApi: any; // Lazy inject to avoid circular dependency

  constructor() {
    // Entferne alte globale selectedAccount (Migration)
    const oldAccount = localStorage.getItem('selectedAccount');
    if (oldAccount) {
      console.log('🔄 Migrating old account selection to database-driven approach');
      localStorage.removeItem('selectedAccount');
    }

    // Entferne alle benutzerspezifischen localStorage-Einträge (nicht mehr benötigt)
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('selectedAccount_')) {
        console.log('🔄 Removing old localStorage key:', key);
        localStorage.removeItem(key);
      }
    });

    // Beobachte Benutzer-Änderungen und lösche die Auswahl beim Benutzerwechsel
    this.authService.currentUser$.subscribe((user) => {
      const newUserId = user?.id || null;

      // Wenn sich der Benutzer geändert hat, lade das aktive Konto aus der DB
      if (this.currentUserId !== newUserId) {
        console.log('👤 User changed from', this.currentUserId, 'to', newUserId);
        const previousUserId = this.currentUserId;
        this.currentUserId = newUserId;
        this.isInitialized = false; // Reset flag bei User-Wechsel

        if (newUserId) {
          // Lade das aktive Konto aus der Datenbank
          // Aber nur wenn es wirklich ein User-WECHSEL ist (nicht beim ersten Load)
          if (previousUserId !== null) {
            console.log('🔄 Loading active account from database for new user');
            this.loadActiveAccountFromDatabase();
          }
        } else {
          // User ausgeloggt - lösche die Auswahl
          console.log('👋 User logged out - clearing account selection');
          this.selectedAccountSubject.next(null);
        }
      }
    });

    // Initial load für bereits eingeloggte Benutzer
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      console.log('🚀 Initial load: User already logged in, loading active account');
      this.currentUserId = currentUser.id;
      // Lade direkt (ohne setTimeout) um Race Conditions zu vermeiden
      this.loadActiveAccountFromDatabase();
    }
  }

  /**
   * Lazy inject AccountsApiService to avoid circular dependency
   */
  private async getAccountsApi() {
    if (!this.accountsApi) {
      const module = await import('../../accounts/accounts-api.service');
      this.accountsApi = this.injector.get(module.AccountsApiService);
    }
    return this.accountsApi;
  }

  /**
   * Load active account from database
   */
  private async loadActiveAccountFromDatabase() {
    // Verhindere mehrfache parallele Aufrufe
    if (this.initializationPromise) {
      console.log('⏳ Already loading active account, waiting for existing request...');
      return this.initializationPromise;
    }

    // Setze das Promise für parallele Aufrufe
    this.initializationPromise = this._loadActiveAccountFromDatabase();

    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }
  }

  private async _loadActiveAccountFromDatabase() {
    try {
      const api = await this.getAccountsApi();
      const activeAccount = await firstValueFrom(api.getActiveAccount());

      if (activeAccount && typeof activeAccount === 'object' && 'id' in activeAccount) {
        const account = activeAccount as {
          id: string;
          name: string;
          type: string;
          balance: number;
          icon?: string;
          color?: string;
        };

        console.log('✅ Loaded active account from database:', account.name);
        this.selectedAccountSubject.next({
          id: account.id,
          name: account.name,
          type: account.type,
          balance: account.balance,
          icon: account.icon,
          color: account.color,
        });
        this.isInitialized = true;
      } else {
        console.log('ℹ️ No active account found in database');
        this.selectedAccountSubject.next(null);
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('❌ Error loading active account from database:', error);
      this.selectedAccountSubject.next(null);
      this.isInitialized = true;
    }
  }

  /**
   * Set the currently selected account and persist to database
   */
  async selectAccount(account: SelectedAccount | null): Promise<void> {
    if (!account) {
      // Wenn kein Account ausgewählt wird, einfach die lokale Auswahl löschen
      this.selectedAccountSubject.next(null);
      return;
    }

    try {
      const api = await this.getAccountsApi();

      // Setze das Konto in der Datenbank als aktiv (Backend deaktiviert alle anderen automatisch)
      await firstValueFrom(api.setActiveAccount(account.id));

      console.log('✅ Account set as active in database:', account.name);
      this.selectedAccountSubject.next(account);
    } catch (error) {
      console.error('❌ Error setting active account in database:', error);
      throw error;
    }
  }

  /**
   * Get the currently selected account
   */
  getSelectedAccount(): SelectedAccount | null {
    return this.selectedAccountSubject.value;
  }

  /**
   * Clear the selected account and set isActive=false in database
   */
  async clearSelection(): Promise<void> {
    const currentAccount = this.selectedAccountSubject.value;

    // Zuerst die lokale Auswahl löschen
    this.selectedAccountSubject.next(null);

    // Dann in der Datenbank auf isActive=false setzen
    if (currentAccount) {
      try {
        const api = await this.getAccountsApi();
        await firstValueFrom(api.update(currentAccount.id, { isActive: false }));
        console.log('✅ Account deactivated in database:', currentAccount.name);
      } catch (error) {
        console.error('❌ Error deactivating account in database:', error);
        // Fehler nicht werfen, da die lokale Auswahl bereits gelöscht wurde
      }
    }
  }

  /**
   * Initialize service - load active account from database
   * Note: This is now automatically called in constructor when user is logged in.
   * This method is kept for backward compatibility and manual refresh.
   */
  async initialize(): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.log('ℹ️ No user logged in, skipping account initialization');
      return;
    }

    // Wenn bereits initialisiert, nicht erneut laden (außer bei explizitem forceRefresh)
    if (this.isInitialized && this.currentUserId === currentUser.id) {
      console.log('✓ Account selection already initialized, skipping reload');
      return;
    }

    console.log('🔄 Manual initialize() called - reloading active account from database');
    this.currentUserId = currentUser.id;
    await this.loadActiveAccountFromDatabase();
  }

  /**
   * Force refresh - reload active account from database even if already initialized
   */
  async forceRefresh(): Promise<void> {
    console.log('🔃 Force refresh requested - reloading active account from database');
    this.isInitialized = false; // Reset flag
    await this.loadActiveAccountFromDatabase();
  }

  /**
   * Check if an account is currently selected
   */
  hasSelection(): boolean {
    return this.selectedAccountSubject.value !== null;
  }

  /**
   * Get the selected account ID
   */
  getSelectedAccountId(): string | null {
    const account = this.selectedAccountSubject.value;
    return account ? account.id : null;
  }
}

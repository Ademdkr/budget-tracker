import { Injectable, inject, Injector } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { AuthService } from '../../auth/auth.service';

/**
 * Interface für ein ausgewähltes Konto.
 *
 * Repräsentiert die minimalen Informationen, die benötigt werden,
 * um ein ausgewähltes Konto in der Anwendung zu verwalten.
 */
export interface SelectedAccount {
  /** Eindeutige Konto-ID */
  id: string;

  /** Name des Kontos */
  name: string;

  /** Typ des Kontos (z.B. 'checking', 'savings') */
  type: string;

  /** Aktueller Kontostand in EUR */
  balance: number;

  /** Optionales Icon für die Anzeige */
  icon?: string;

  /** Optionale Farbe für die Anzeige */
  color?: string;
}

/**
 * Service zur Verwaltung der globalen Kontoauswahl.
 *
 * Dieser Service verwaltet die Auswahl eines aktiven Kontos für die gesamte Anwendung.
 * Die Auswahl wird in der Datenbank persistiert und automatisch geladen, wenn sich
 * ein Benutzer anmeldet. Der Service verhindert zirkuläre Abhängigkeiten durch
 * Lazy Loading des AccountsApiService.
 *
 * Features:
 * - Persistierung der Kontoauswahl in der Datenbank
 * - Automatisches Laden beim Login
 * - Löschen der Auswahl beim Logout/User-Wechsel
 * - Observable für reaktive Updates
 * - Verhindert Race Conditions durch Synchronisation
 * - Migration von altem localStorage-Ansatz
 *
 * @example
 * // Konto auswählen
 * await this.accountSelection.selectAccount({
 *   id: 'account-1',
 *   name: 'Girokonto',
 *   type: 'checking',
 *   balance: 1500.00
 * });
 *
 * // Aktuelles Konto beobachten
 * this.accountSelection.selectedAccount$.subscribe(account => {
 *   console.log('Ausgewähltes Konto:', account?.name);
 * });
 */
@Injectable({
  providedIn: 'root',
})
export class AccountSelectionService {
  /** AuthService für Benutzer-Informationen */
  private authService = inject(AuthService);

  /** Injector für Lazy Loading des AccountsApiService */
  private injector = inject(Injector);

  /** BehaviorSubject für das aktuell ausgewählte Konto */
  private selectedAccountSubject = new BehaviorSubject<SelectedAccount | null>(null);

  /** Observable für das aktuell ausgewählte Konto */
  public selectedAccount$ = this.selectedAccountSubject.asObservable();

  /** ID des aktuellen Benutzers */
  private currentUserId: string | null = null;

  /** Flag um mehrfache Initialisierung zu verhindern */
  private isInitialized = false;

  /** Promise um parallele Aufrufe zu synchronisieren */
  private initializationPromise: Promise<void> | null = null;

  /** Lazy injected AccountsApiService (verhindert zirkuläre Abhängigkeit) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private accountsApi: any;

  /**
   * Konstruktor initialisiert den Service und beobachtet Benutzer-Änderungen.
   *
   * Führt automatisch Migration von alten localStorage-Einträgen durch und
   * lädt das aktive Konto aus der Datenbank, wenn ein Benutzer bereits
   * eingeloggt ist. Beobachtet User-Wechsel und lädt entsprechend neue
   * Kontoauswahl oder löscht sie beim Logout.
   */
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
   * Lädt den AccountsApiService per Lazy Loading.
   *
   * Diese Methode verhindert zirkuläre Abhängigkeiten, indem der
   * AccountsApiService erst bei Bedarf geladen wird.
   *
   * @private
   * @returns {Promise} Promise, das den AccountsApiService zurückgibt
   */
  private async getAccountsApi() {
    if (!this.accountsApi) {
      const module = await import('../../accounts/accounts-api.service');
      this.accountsApi = this.injector.get(module.AccountsApiService);
    }
    return this.accountsApi;
  }

  /**
   * Lädt das aktive Konto aus der Datenbank.
   *
   * Diese Methode verhindert parallele Aufrufe durch ein Promise-basiertes
   * Locking-Mechanismus. Wenn bereits ein Ladevorgang läuft, wartet die
   * Methode auf dessen Abschluss.
   *
   * @private
   * @returns {Promise<void>} Promise, das nach dem Laden aufgelöst wird
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

  /**
   * Interne Methode zum Laden des aktiven Kontos aus der Datenbank.
   *
   * Ruft die API auf, validiert die Antwort und aktualisiert das
   * selectedAccountSubject. Setzt den isInitialized-Flag nach Abschluss.
   *
   * @private
   * @returns {Promise<void>} Promise, das nach dem Laden aufgelöst wird
   */
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
   * Setzt das aktuell ausgewählte Konto und persistiert es in der Datenbank.
   *
   * Wenn ein Konto übergeben wird, wird es in der Datenbank als aktiv markiert
   * (alle anderen Konten werden automatisch deaktiviert). Wenn null übergeben
   * wird, wird nur die lokale Auswahl gelöscht.
   *
   * @param {SelectedAccount | null} account - Das zu selektierende Konto oder null
   * @returns {Promise<void>} Promise, das nach dem Setzen aufgelöst wird
   * @throws {Error} Wenn das Setzen in der Datenbank fehlschlägt
   *
   * @example
   * await this.accountSelection.selectAccount({
   *   id: 'account-1',
   *   name: 'Hauptkonto',
   *   type: 'checking',
   *   balance: 2500.00
   * });
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
   * Gibt das aktuell ausgewählte Konto zurück.
   *
   * @returns {SelectedAccount | null} Das aktuell ausgewählte Konto oder null
   *
   * @example
   * const account = this.accountSelection.getSelectedAccount();
   * if (account) {
   *   console.log('Aktives Konto:', account.name);
   * }
   */
  getSelectedAccount(): SelectedAccount | null {
    return this.selectedAccountSubject.value;
  }

  /**
   * Löscht die Kontoauswahl und setzt isActive=false in der Datenbank.
   *
   * Löscht zuerst die lokale Auswahl und deaktiviert dann das Konto in
   * der Datenbank. Fehler bei der Datenbank-Deaktivierung werden geloggt,
   * werfen aber keinen Fehler, da die lokale Auswahl bereits gelöscht wurde.
   *
   * @returns {Promise<void>} Promise, das nach dem Löschen aufgelöst wird
   *
   * @example
   * await this.accountSelection.clearSelection();
   * console.log('Kontoauswahl gelöscht');
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
   * Initialisiert den Service - lädt das aktive Konto aus der Datenbank.
   *
   * Diese Methode wird automatisch im Konstruktor aufgerufen, wenn ein
   * Benutzer eingeloggt ist. Sie kann auch manuell aufgerufen werden,
   * um einen Refresh zu erzwingen. Überprüft, ob bereits initialisiert,
   * um unnötige API-Aufrufe zu vermeiden.
   *
   * @returns {Promise<void>} Promise, das nach der Initialisierung aufgelöst wird
   *
   * @example
   * // Manueller Refresh der Kontoauswahl
   * await this.accountSelection.initialize();
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
   * Erzwingt einen Refresh - lädt das aktive Konto aus der Datenbank neu.
   *
   * Im Gegensatz zu initialize() lädt diese Methode die Daten immer neu,
   * auch wenn der Service bereits initialisiert wurde.
   *
   * @returns {Promise<void>} Promise, das nach dem Refresh aufgelöst wird
   *
   * @example
   * // Nach Konto-Update in einer anderen Komponente
   * await this.accountSelection.forceRefresh();
   */
  async forceRefresh(): Promise<void> {
    console.log('🔃 Force refresh requested - reloading active account from database');
    this.isInitialized = false; // Reset flag
    await this.loadActiveAccountFromDatabase();
  }

  /**
   * Prüft, ob derzeit ein Konto ausgewählt ist.
   *
   * @returns {boolean} True, wenn ein Konto ausgewählt ist, sonst false
   *
   * @example
   * if (this.accountSelection.hasSelection()) {
   *   console.log('Ein Konto ist ausgewählt');
   * }
   */
  hasSelection(): boolean {
    return this.selectedAccountSubject.value !== null;
  }

  /**
   * Gibt die ID des ausgewählten Kontos zurück.
   *
   * @returns {string | null} Die Konto-ID oder null, wenn kein Konto ausgewählt ist
   *
   * @example
   * const accountId = this.accountSelection.getSelectedAccountId();
   * if (accountId) {
   *   this.loadTransactionsForAccount(accountId);
   * }
   */
  getSelectedAccountId(): string | null {
    const account = this.selectedAccountSubject.value;
    return account ? account.id : null;
  }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface SelectedAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  icon?: string;
  color?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccountSelectionService {
  private selectedAccountSubject = new BehaviorSubject<SelectedAccount | null>(null);
  public selectedAccount$ = this.selectedAccountSubject.asObservable();

  /**
   * Set the currently selected account
   */
  selectAccount(account: SelectedAccount | null): void {
    this.selectedAccountSubject.next(account);

    // Store in localStorage for persistence
    if (account) {
      localStorage.setItem('selectedAccount', JSON.stringify(account));
    } else {
      localStorage.removeItem('selectedAccount');
    }
  }

  /**
   * Get the currently selected account
   */
  getSelectedAccount(): SelectedAccount | null {
    return this.selectedAccountSubject.value;
  }

  /**
   * Clear the selected account
   */
  clearSelection(): void {
    this.selectAccount(null);
  }

  /**
   * Initialize service - restore from localStorage if available
   */
  initialize(): void {
    const stored = localStorage.getItem('selectedAccount');
    if (stored) {
      try {
        const account = JSON.parse(stored);
        this.selectedAccountSubject.next(account);
      } catch (error) {
        console.warn('Failed to restore selected account from localStorage:', error);
        localStorage.removeItem('selectedAccount');
      }
    }
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

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

// Angular Material imports
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatNativeDateModule } from '@angular/material/core';

import { AuthService } from '../auth/auth.service';
import { LoadingService } from '../shared/services/loading.service';

/**
 * Navigationselement für die Sidebar
 */
export interface NavigationItem {
  /** Material Icon Name */
  icon: string;
  /** Anzeigetext */
  label: string;
  /** Router-Pfad */
  route: string;
  /** Aktiv-Status (optional, wird dynamisch gesetzt) */
  active?: boolean;
}

/**
 * Datumsfilter für Transaktionen und Berichte
 */
export interface DateFilter {
  /** Filtertyp: Einzelner Monat oder Datumsbereich */
  type: 'month' | 'range';
  /** Start-Datum */
  startDate: Date;
  /** End-Datum (nur bei type='range') */
  endDate?: Date;
}

/**
 * Layout-Komponente mit Navigation und Header
 *
 * Funktionalität:
 * - Sidebar mit Navigation zu allen Hauptbereichen
 * - Top-Bar mit Benutzermenü und Logout
 * - Globaler Loading-Indikator
 * - Datum-Filter (aktuell auskommentiert)
 * - Responsive Design mit Material Sidenav
 *
 * Features:
 * - Reactive Forms für Datumsfilter
 * - RxJS Observables für User und Loading State
 * - Material Design Komponenten
 * - Router-Integration für aktive Route-Hervorhebung
 *
 * @example
 * ```typescript
 * // Wird automatisch durch Routing geladen
 * {
 *   path: '',
 *   loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
 *   canActivate: [authGuard],
 *   children: [...]
 * }
 * ```
 */
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    ReactiveFormsModule,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatProgressBarModule,
    MatNativeDateModule,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  /** Service für Authentifizierung und User-Daten */
  private authService = inject(AuthService);
  /** Router für Navigation */
  private router = inject(Router);
  /** Service für globalen Loading-State */
  private loadingService = inject(LoadingService);

  /** Observable des aktuell eingeloggten Benutzers */
  currentUser$ = this.authService.currentUser$;
  /** Observable des globalen Loading-States */
  isLoading$ = this.loadingService.loading$;

  /**
   * Navigation items für die Sidebar
   * Enthält alle Hauptbereiche der Anwendung mit Icons und Routen
   */
  navigationItems: NavigationItem[] = [
    { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
    { icon: 'account_balance_wallet', label: 'Transaktionen', route: '/transactions' },
    { icon: 'savings', label: 'Budgets', route: '/budgets' },
    { icon: 'category', label: 'Kategorien', route: '/categories' },
    { icon: 'account_balance', label: 'Konten', route: '/accounts' },
    { icon: 'upload_file', label: 'Import', route: '/import' },
  ];

  /**
   * FormControl für Filtertyp (Monat oder Datumsbereich)
   * Aktuell nicht aktiv verwendet
   */
  filterTypeControl = new FormControl<'month' | 'range'>('month');

  /**
   * FormControl für Monatsauswahl
   * Standard: Aktueller Monat
   */
  monthControl = new FormControl<Date>(new Date());

  /**
   * FormControl für Start-Datum bei Datumsbereich
   */
  startDateControl = new FormControl<Date>(new Date());

  /**
   * FormControl für End-Datum bei Datumsbereich
   */
  endDateControl = new FormControl<Date>(new Date());

  constructor() {
    // Set initial month to current month
    const now = new Date();
    this.monthControl.setValue(new Date(now.getFullYear(), now.getMonth(), 1));

    // Set default date range (current month)
    this.startDateControl.setValue(new Date(now.getFullYear(), now.getMonth(), 1));
    this.endDateControl.setValue(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  }

  /**
   * Loggt den aktuellen Benutzer aus
   * Leitet zur Login-Seite weiter
   */
  logout() {
    this.authService.logout();
  }

  /**
   * Navigiert zu einer bestimmten Route
   *
   * @param route - Ziel-Route (z.B. '/dashboard')
   */
  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  /* onFilterTypeChange() {
    // TODO: Emit filter change event or update service
    console.log('Filter type changed:', this.filterTypeControl.value);
  }

  onMonthChange() {
    // TODO: Emit month change event
    console.log('Month changed:', this.monthControl.value);
  }

  onDateRangeChange() {
    // TODO: Emit date range change event
    console.log('Date range changed:', {
      start: this.startDateControl.value,
      end: this.endDateControl.value
    });
  } */

  /**
   * Gibt den aktuellen Datumsfilter zurück
   * Basierend auf ausgewähltem Filtertyp (Monat oder Bereich)
   *
   * @returns DateFilter mit Start- und End-Datum
   */
  getCurrentFilter(): DateFilter {
    const filterType = this.filterTypeControl.value || 'month';

    if (filterType === 'month') {
      const selectedMonth = this.monthControl.value || new Date();
      return {
        type: 'month',
        startDate: new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1),
        endDate: new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0),
      };
    } else {
      return {
        type: 'range',
        startDate: this.startDateControl.value || new Date(),
        endDate: this.endDateControl.value || new Date(),
      };
    }
  }

  /**
   * Prüft ob eine Route aktuell aktiv ist
   * Wird für visuelle Hervorhebung in der Navigation verwendet
   *
   * @param route - Zu prüfende Route
   * @returns true wenn Route aktiv ist
   */
  isActiveRoute(route: string): boolean {
    return this.router.url === route;
  }
}

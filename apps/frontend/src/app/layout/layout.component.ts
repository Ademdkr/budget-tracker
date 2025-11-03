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

export interface NavigationItem {
  icon: string;
  label: string;
  route: string;
  active?: boolean;
}

export interface DateFilter {
  type: 'month' | 'range';
  startDate: Date;
  endDate?: Date;
}

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
  private authService = inject(AuthService);
  private router = inject(Router);
  private loadingService = inject(LoadingService);

  currentUser$ = this.authService.currentUser$;
  isLoading$ = this.loadingService.loading$;

  // Navigation items
  navigationItems: NavigationItem[] = [
    { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
    { icon: 'account_balance_wallet', label: 'Transaktionen', route: '/transactions' },
    { icon: 'savings', label: 'Budgets', route: '/budgets' },
    { icon: 'category', label: 'Kategorien', route: '/categories' },
    { icon: 'account_balance', label: 'Konten', route: '/accounts' },
    { icon: 'upload_file', label: 'Import', route: '/import' },
  ];

  // Date filter controls
  filterTypeControl = new FormControl<'month' | 'range'>('month');
  monthControl = new FormControl<Date>(new Date());
  startDateControl = new FormControl<Date>(new Date());
  endDateControl = new FormControl<Date>(new Date());

  constructor() {
    // Set initial month to current month
    const now = new Date();
    this.monthControl.setValue(new Date(now.getFullYear(), now.getMonth(), 1));

    // Set default date range (current month)
    this.startDateControl.setValue(new Date(now.getFullYear(), now.getMonth(), 1));
    this.endDateControl.setValue(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  }

  logout() {
    this.authService.logout();
  }

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

  isActiveRoute(route: string): boolean {
    return this.router.url === route;
  }
}

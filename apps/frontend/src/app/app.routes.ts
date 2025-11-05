import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './shared/guards/auth.guard';

/**
 * Haupt-Routing-Konfiguration der Anwendung
 *
 * Struktur:
 * - Öffentliche Routen (login, register) mit guestGuard
 * - Geschützte Routen mit authGuard und Lazy Loading
 * - Layout-basierte Navigation mit Child-Routes
 * - Wildcard-Route für ungültige URLs
 *
 * Features:
 * - Lazy Loading aller Module für optimale Performance
 * - Guard-basierte Zugriffskontrolle
 * - Nested Routes mit Layout-Komponente
 * - Automatische Umleitung zu Dashboard nach Login
 *
 * @example
 * ```typescript
 * // In app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideRouter(routes)
 *   ]
 * };
 * ```
 */
export const routes: Routes = [
  /**
   * Login-Route
   * - Nur für nicht-authentifizierte Benutzer zugänglich (guestGuard)
   * - Lazy Loading der Login-Komponente
   */
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  /**
   * Registrierungs-Route
   * - Nur für nicht-authentifizierte Benutzer zugänglich (guestGuard)
   * - Lazy Loading der Register-Komponente
   */
  {
    path: 'register',
    loadComponent: () =>
      import('./auth/register/register.component').then((m) => m.RegisterComponent),
    canActivate: [guestGuard],
  },
  /**
   * Haupt-Layout mit Child-Routes
   * - Nur für authentifizierte Benutzer zugänglich (authGuard)
   * - Alle Kind-Routen werden innerhalb des Layouts angezeigt
   * - Bietet Navigation, Header, Sidebar
   */
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then((m) => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      /**
       * Standard-Umleitung zum Dashboard
       */
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      /**
       * Dashboard-Route
       * - Übersicht über Finanzen, KPIs, Charts
       */
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      /**
       * Transaktionen-Route
       * - Verwaltung aller Transaktionen
       */
      {
        path: 'transactions',
        loadComponent: () =>
          import('./transactions/transactions.component').then((m) => m.TransactionsComponent),
      },
      /**
       * Budgets-Route
       * - Verwaltung von Budgets und Limits
       */
      {
        path: 'budgets',
        loadComponent: () => import('./budgets/budgets.component').then((m) => m.BudgetsComponent),
      },
      /**
       * Kategorien-Route
       * - Verwaltung von Einnahmen- und Ausgaben-Kategorien
       */
      {
        path: 'categories',
        loadComponent: () =>
          import('./categories/categories.component').then((m) => m.CategoriesComponent),
      },
      /**
       * Konten-Route
       * - Verwaltung von Bankkonten und Zahlungsmethoden
       */
      {
        path: 'accounts',
        loadComponent: () =>
          import('./accounts/accounts.component').then((m) => m.AccountsComponent),
      },
      /**
       * Import-Route
       * - CSV-Import von Transaktionen
       */
      {
        path: 'import',
        loadComponent: () => import('./import/import.component').then((m) => m.ImportComponent),
      },
    ],
  },
  /**
   * Wildcard-Route für ungültige URLs
   * - Umleitung zum Login
   */
  {
    path: '**',
    redirectTo: '/login',
  },
];

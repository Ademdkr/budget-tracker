import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

/**
 * Auth Guard - Schützt Routen, die Authentifizierung erfordern
 *
 * Prüft ob Benutzer angemeldet ist und leitet zu Login weiter falls nicht.
 * Verwendet Angular's funktionale Guard-Syntax (CanActivateFn).
 *
 * @returns true wenn authentifiziert, sonst UrlTree zu /login
 *
 * @example
 * ```typescript
 * // In app.routes.ts
 * const routes: Routes = [
 *   {
 *     path: 'dashboard',
 *     component: DashboardComponent,
 *     canActivate: [authGuard]
 *   }
 * ];
 * ```
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirect to login page
  return router.createUrlTree(['/login']);
};

/**
 * Guest Guard - Schützt Routen für nicht-authentifizierte Benutzer
 *
 * Verhindert Zugriff auf Login/Register für bereits angemeldete Benutzer.
 * Leitet zu Dashboard weiter wenn bereits authentifiziert.
 *
 * @returns true wenn nicht authentifiziert, sonst UrlTree zu /dashboard
 *
 * @example
 * ```typescript
 * // In app.routes.ts
 * const routes: Routes = [
 *   {
 *     path: 'login',
 *     component: LoginComponent,
 *     canActivate: [guestGuard]
 *   }
 * ];
 * ```
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // Redirect to dashboard if already logged in
  return router.createUrlTree(['/dashboard']);
};

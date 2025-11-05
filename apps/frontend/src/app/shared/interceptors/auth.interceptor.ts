import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthApiService } from '../../auth/auth-api.service';

/**
 * HTTP Interceptor für JWT-Token Authentifizierung
 *
 * Funktionen:
 * - Fügt Authorization-Header mit JWT-Token zu allen Requests hinzu
 * - Fügt X-User-Id Header für User-spezifische Requests hinzu
 * - Überspringt Auth-Header für Login/Register/Refresh Endpoints
 * - Behandelt 401 Errors mit automatischem Token-Refresh
 * - Leitet zu Login bei fehlgeschlagenem Refresh
 *
 * @param req - HTTP Request
 * @param next - Next Handler in Interceptor-Chain
 * @returns Observable mit HTTP Response
 *
 * @example
 * ```typescript
 * // In app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideHttpClient(withInterceptors([authInterceptor]))
 *   ]
 * };
 * ```
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthApiService);
  const router = inject(Router);

  // Skip auth header for login/register endpoints
  if (
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/refresh')
  ) {
    return next(req);
  }

  // Get access token
  const token = authService.getAccessToken();

  // Clone request and add authorization header + user ID
  let authReq = req;
  if (token) {
    const user = authService.getStoredUser();
    const headers: { [key: string]: string } = {
      Authorization: `Bearer ${token}`,
    };

    // Add user ID to headers if available
    if (user?.id) {
      headers['X-User-Id'] = user.id;
    }

    authReq = req.clone({
      setHeaders: headers,
    });
  }

  // Handle response
  return next(authReq).pipe(
    catchError((error) => {
      // If 401 Unauthorized, try to refresh token
      if (error.status === 401 && !req.url.includes('/auth/refresh')) {
        const refreshToken = authService.getRefreshToken();

        if (refreshToken) {
          // Try to refresh the token
          return authService.refreshToken(refreshToken).pipe(
            switchMap(() => {
              // Retry the original request with new token
              const newToken = authService.getAccessToken();
              const user = authService.getStoredUser();
              const retryHeaders: { [key: string]: string } = {
                Authorization: `Bearer ${newToken}`,
              };

              // Add user ID to retry headers if available
              if (user?.id) {
                retryHeaders['X-User-Id'] = user.id;
              }

              const retryReq = req.clone({
                setHeaders: retryHeaders,
              });
              return next(retryReq);
            }),
            catchError((refreshError) => {
              // Refresh failed, redirect to login
              console.error('Token refresh failed:', refreshError);
              void router.navigate(['/auth/login']);
              return throwError(() => refreshError);
            }),
          );
        } else {
          // No refresh token, redirect to login
          void router.navigate(['/auth/login']);
          return throwError(() => error);
        }
      }

      // For other errors, just pass them through
      return throwError(() => error);
    }),
  );
};

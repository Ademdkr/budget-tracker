import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthApiService } from '../../auth/auth-api.service';

/**
 * HTTP Interceptor for JWT token authentication
 * Adds Authorization header with token to all requests
 * Handles 401 errors with automatic token refresh
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthApiService);
  const router = inject(Router);

  // Skip auth header for login/register endpoints
  if (req.url.includes('/auth/login') || req.url.includes('/auth/register') || req.url.includes('/auth/refresh')) {
    return next(req);
  }

  // Get access token
  const token = authService.getAccessToken();

  // Clone request and add authorization header
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Handle response
  return next(authReq).pipe(
    catchError(error => {
      // If 401 Unauthorized, try to refresh token
      if (error.status === 401 && !req.url.includes('/auth/refresh')) {
        const refreshToken = authService.getRefreshToken();

        if (refreshToken) {
          // Try to refresh the token
          return authService.refreshToken(refreshToken).pipe(
            switchMap(() => {
              // Retry the original request with new token
              const newToken = authService.getAccessToken();
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`
                }
              });
              return next(retryReq);
            }),
            catchError(refreshError => {
              // Refresh failed, redirect to login
              console.error('Token refresh failed:', refreshError);
              void router.navigate(['/auth/login']);
              return throwError(() => refreshError);
            })
          );
        } else {
          // No refresh token, redirect to login
          void router.navigate(['/auth/login']);
          return throwError(() => error);
        }
      }

      // For other errors, just pass them through
      return throwError(() => error);
    })
  );
};

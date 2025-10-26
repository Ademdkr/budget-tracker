import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  } else {
    // Store the attempted URL for redirecting after login
    const returnUrl = state.url;
    router.navigate(['/login'], { queryParams: { returnUrl } });
    return false;
  }
};

// Guard for protecting auth routes (login/register) when already authenticated
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  } else {
    // Redirect to dashboard if already authenticated
    router.navigate(['/dashboard']);
    return false;
  }
};

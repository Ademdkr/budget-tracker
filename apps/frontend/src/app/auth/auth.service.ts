import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    surname: string;
    email: string;
  };
}

export interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly TOKEN_KEY = 'budget_tracker_token';
  private readonly REFRESH_TOKEN_KEY = 'budget_tracker_refresh_token';
  private readonly USER_KEY = 'budget_tracker_user';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {
    // Check if token is expired on service initialization
    this.checkTokenValidity();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    const apiUrl = `${environment.apiBaseUrl}/auth/login`;

    return this.http.post<AuthResponse>(apiUrl, credentials).pipe(
      tap(response => this.handleAuthSuccess(response)),
      catchError(error => {
        console.error('Login error:', error);
        const errorMessage = error?.error?.message || 'Login fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten.';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    const apiUrl = `${environment.apiBaseUrl}/auth/register`;

    return this.http.post<AuthResponse>(apiUrl, userData).pipe(
      tap(response => this.handleAuthSuccess(response)),
      catchError(error => {
        console.error('Registration error:', error);
        return throwError(() => new Error('Registrierung fehlgeschlagen. Versuchen Sie es später erneut.'));
      })
    );
  }

  logout(): void {
    this.clearTokens();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('Keine Refresh-Token gefunden'));
    }

    // TODO: Replace with actual API endpoint
    const apiUrl = '/api/auth/refresh';

    return this.http.post<AuthResponse>(apiUrl, { refreshToken }).pipe(
      tap(response => this.handleAuthSuccess(response)),
      catchError(error => {
        console.error('Token refresh error:', error);
        this.logout();
        return throwError(() => new Error('Token-Erneuerung fehlgeschlagen'));
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  private handleAuthSuccess(response: AuthResponse): void {
    // Store tokens
    localStorage.setItem(this.TOKEN_KEY, response.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));

    // Update subjects
    this.currentUserSubject.next(response.user);
    this.isAuthenticatedSubject.next(true);
  }

  private clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch {
        // If JSON is invalid, clear storage
        this.clearTokens();
        return null;
      }
    }
    return null;
  }

  private hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Decode JWT token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      // If token is invalid, clear it
      this.clearTokens();
      return false;
    }
  }

  private checkTokenValidity(): void {
    if (!this.hasValidToken()) {
      this.clearTokens();
      this.currentUserSubject.next(null);
      this.isAuthenticatedSubject.next(false);
    }
  }

  // Method for testing purposes - simulate login without API
  simulateLogin(email: string, password: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email === 'test@example.com' && password === 'password') {
          const mockResponse: AuthResponse = {
            accessToken: this.generateMockToken(email),
            refreshToken: 'mock-refresh-token',
            user: {
              id: '1',
              name: 'Test',
              surname: 'User',
              email: email
            }
          };
          this.handleAuthSuccess(mockResponse);
          resolve(true);
        } else {
          reject(new Error('Ungültige E-Mail oder Passwort'));
        }
      }, 1000);
    });
  }

  // Method for testing purposes - simulate registration without API
  simulateRegister(email: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockResponse: AuthResponse = {
          accessToken: this.generateMockToken(email),
          refreshToken: 'mock-refresh-token',
          user: {
            id: Date.now().toString(),
            name: 'New',
            surname: 'User',
            email: email
          }
        };
        this.handleAuthSuccess(mockResponse);
        resolve(true);
      }, 1500);
    });
  }

  private generateMockToken(email: string): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: '1',
      email: email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }));
    const signature = 'mock-signature';
    return `${header}.${payload}.${signature}`;
  }
}

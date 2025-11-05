import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Request-Daten für Login
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Request-Daten für Registrierung
 */
export interface RegisterRequest {
  email: string;
  password: string;
}

/**
 * Response-Daten nach erfolgreicher Authentifizierung
 */
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

/**
 * Benutzer-Daten
 */
export interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
}

/**
 * Service für Authentifizierung und Benutzerverwaltung
 *
 * Verwaltet Login, Logout, Token-Speicherung und Authentifizierungs-Status.
 * Nutzt LocalStorage für Token-Persistenz und RxJS Subjects für reaktive Updates.
 *
 * @example
 * ```typescript
 * constructor(private authService: AuthService) {}
 *
 * login() {
 *   this.authService.login({ email: 'user@example.com', password: 'pass' })
 *     .subscribe({
 *       next: () => this.router.navigate(['/dashboard']),
 *       error: (err) => console.error(err)
 *     });
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  /** LocalStorage-Key für Access-Token */
  private readonly TOKEN_KEY = 'budget_tracker_token';
  /** LocalStorage-Key für Refresh-Token */
  private readonly REFRESH_TOKEN_KEY = 'budget_tracker_refresh_token';
  /** LocalStorage-Key für Benutzer-Daten */
  private readonly USER_KEY = 'budget_tracker_user';

  /** Subject für aktuellen Benutzer */
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  /** Observable für aktuellen Benutzer (für Template-Binding) */
  public currentUser$ = this.currentUserSubject.asObservable();

  /** Subject für Authentifizierungs-Status */
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  /** Observable für Authentifizierungs-Status (für Guards und Template) */
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {
    // Check if token is expired on service initialization
    this.checkTokenValidity();
  }

  /**
   * Meldet einen Benutzer an
   *
   * Sendet Login-Credentials an das Backend und speichert bei Erfolg
   * die Tokens und Benutzer-Daten im LocalStorage.
   *
   * @param credentials - Email und Passwort
   * @returns Observable mit Auth-Response (Token + User-Daten)
   *
   * @example
   * ```typescript
   * this.authService.login({ email: 'user@test.com', password: 'pass123' })
   *   .subscribe({
   *     next: (response) => console.log('Logged in:', response.user),
   *     error: (err) => console.error('Login failed:', err.message)
   *   });
   * ```
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    const apiUrl = `${environment.apiBaseUrl}/auth/login`;

    return this.http.post<AuthResponse>(apiUrl, credentials).pipe(
      tap((response) => this.handleAuthSuccess(response)),
      catchError((error) => {
        console.error('Login error:', error);
        const errorMessage =
          error?.error?.message || 'Login fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten.';
        return throwError(() => new Error(errorMessage));
      }),
    );
  }

  /**
   * Registriert einen neuen Benutzer
   *
   * Sendet Registrierungs-Daten an das Backend und meldet den Benutzer
   * bei Erfolg automatisch an.
   *
   * @param userData - Email und Passwort für neuen Account
   * @returns Observable mit Auth-Response
   *
   * @example
   * ```typescript
   * this.authService.register({ email: 'new@test.com', password: 'secure123' })
   *   .subscribe({
   *     next: () => this.router.navigate(['/dashboard']),
   *     error: (err) => this.showError(err.message)
   *   });
   * ```
   */
  register(userData: RegisterRequest): Observable<AuthResponse> {
    const apiUrl = `${environment.apiBaseUrl}/auth/register`;

    return this.http.post<AuthResponse>(apiUrl, userData).pipe(
      tap((response) => this.handleAuthSuccess(response)),
      catchError((error) => {
        console.error('Registration error:', error);
        return throwError(
          () => new Error('Registrierung fehlgeschlagen. Versuchen Sie es später erneut.'),
        );
      }),
    );
  }

  /**
   * Meldet den aktuellen Benutzer ab
   *
   * Löscht alle Auth-Tokens und Benutzerdaten aus dem LocalStorage
   * und setzt den Authentifizierungsstatus zurück.
   */
  logout(): void {
    this.clearTokens();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  /**
   * Aktualisiert den Access-Token mit Refresh-Token
   *
   * @returns Observable mit neuer Auth-Response
   * @throws Error wenn kein Refresh-Token vorhanden
   *
   * @example
   * ```typescript
   * this.authService.refreshToken().subscribe({
   *   next: () => console.log('Token erfolgreich erneuert'),
   *   error: () => this.authService.logout()
   * });
   * ```
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('Keine Refresh-Token gefunden'));
    }

    // TODO: Replace with actual API endpoint
    const apiUrl = '/api/auth/refresh';

    return this.http.post<AuthResponse>(apiUrl, { refreshToken }).pipe(
      tap((response) => this.handleAuthSuccess(response)),
      catchError((error) => {
        console.error('Token refresh error:', error);
        this.logout();
        return throwError(() => new Error('Token-Erneuerung fehlgeschlagen'));
      }),
    );
  }

  /**
   * Gibt den aktuellen Access-Token zurück
   *
   * @returns Access-Token oder null wenn nicht vorhanden
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Gibt den aktuellen Refresh-Token zurück
   *
   * @returns Refresh-Token oder null wenn nicht vorhanden
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Gibt den aktuellen Benutzer zurück
   *
   * @returns User-Objekt oder null wenn nicht angemeldet
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Prüft ob Benutzer authentifiziert ist
   *
   * @returns true wenn angemeldet, sonst false
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Verarbeitet erfolgreiche Authentifizierung
   *
   * Speichert Tokens und User-Daten im LocalStorage und
   * aktualisiert die reaktiven State-Subjects.
   *
   * @private
   * @param response - Auth-Response vom Backend
   */
  private handleAuthSuccess(response: AuthResponse): void {
    // Store tokens
    localStorage.setItem(this.TOKEN_KEY, response.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));

    // Update subjects
    this.currentUserSubject.next(response.user);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Löscht alle Auth-Daten aus LocalStorage
   *
   * @private
   */
  private clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Lädt User-Daten aus LocalStorage
   *
   * @private
   * @returns User-Objekt oder null bei Fehler/nicht vorhanden
   */
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

  /**
   * Prüft ob ein gültiger Token vorhanden ist
   *
   * Dekodiert JWT und prüft Expiration-Timestamp.
   * Löscht Token bei Ungültigkeit.
   *
   * @private
   * @returns true wenn Token vorhanden und nicht abgelaufen
   */
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

  /**
   * Prüft Token-Gültigkeit bei Service-Initialisierung
   *
   * @private
   */
  private checkTokenValidity(): void {
    if (!this.hasValidToken()) {
      this.clearTokens();
      this.currentUserSubject.next(null);
      this.isAuthenticatedSubject.next(false);
    }
  }

  /**
   * Simuliert Login für Testing ohne Backend
   *
   * @todo Nur für Entwicklung - in Produktion entfernen
   * @private
   * @param email - Test Email
   * @param password - Test Passwort
   * @returns Promise mit Login-Erfolg
   */
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
              email: email,
            },
          };
          this.handleAuthSuccess(mockResponse);
          resolve(true);
        } else {
          reject(new Error('Ungültige E-Mail oder Passwort'));
        }
      }, 1000);
    });
  }

  /**
   * Simuliert Registrierung für Testing ohne Backend
   *
   * @todo Nur für Entwicklung - in Produktion entfernen
   * @private
   * @param email - Test Email
   * @returns Promise mit Registrierungs-Erfolg
   */
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
            email: email,
          },
        };
        this.handleAuthSuccess(mockResponse);
        resolve(true);
      }, 1500);
    });
  }

  /**
   * Generiert Mock JWT-Token für Testing
   *
   * @private
   * @param email - Email für Token-Payload
   * @returns Base64-kodierter Mock-Token
   */
  private generateMockToken(email: string): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        sub: '1',
        email: email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
      }),
    );
    const signature = 'mock-signature';
    return `${header}.${payload}.${signature}`;
  }
}

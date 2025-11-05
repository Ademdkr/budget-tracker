import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../shared/services/api.service';

/**
 * Repräsentiert einen Benutzer im System
 */
export interface User {
  /** Eindeutige Benutzer-ID */
  id: string;
  /** Email-Adresse */
  email: string;
  /** Benutzername */
  username: string;
  /** Vorname (optional) */
  firstName?: string;
  /** Nachname (optional) */
  lastName?: string;
  /** Avatar-URL (optional) */
  avatar?: string;
  /** Erstellungsdatum */
  createdAt?: Date | string;
  /** Letzte Änderung */
  updatedAt?: Date | string;
}

/**
 * Login-Request DTO
 */
export interface LoginDto {
  /** Email-Adresse */
  email: string;
  /** Passwort */
  password: string;
}

/**
 * Registrierungs-Request DTO
 */
export interface RegisterDto {
  /** Email-Adresse */
  email: string;
  /** Benutzername */
  username: string;
  /** Passwort */
  password: string;
  /** Vorname (optional) */
  firstName?: string;
  /** Nachname (optional) */
  lastName?: string;
}

/**
 * Auth-Response vom Backend
 */
export interface AuthResponse {
  /** JWT Access-Token */
  access_token: string;
  /** JWT Refresh-Token (optional) */
  refresh_token?: string;
  /** User-Objekt */
  user: User;
  /** Token-Gültigkeit in Sekunden */
  expiresIn?: number;
}

/**
 * Refresh-Token Request DTO
 */
export interface RefreshTokenDto {
  /** Refresh-Token */
  refresh_token: string;
}

/**
 * Auth API Service - Behandelt Backend-API Authentifizierung
 *
 * Low-level Service für direkte Backend-Kommunikation.
 * Verwendet ApiService für HTTP-Requests und speichert Tokens im LocalStorage.
 * Wird vom authInterceptor verwendet.
 *
 * @example
 * ```typescript
 * constructor(private authApi: AuthApiService) {}
 *
 * login() {
 *   this.authApi.login({ email: 'user@test.com', password: 'pass' })
 *     .subscribe(response => console.log('Logged in:', response.user));
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private api = inject(ApiService);
  /** LocalStorage Key für Access-Token */
  private readonly TOKEN_KEY = 'budget_tracker_token';
  /** LocalStorage Key für Refresh-Token */
  private readonly REFRESH_TOKEN_KEY = 'budget_tracker_refresh_token';
  /** LocalStorage Key für User-Daten */
  private readonly USER_KEY = 'budget_tracker_user';

  /**
   * Login mit Email und Passwort
   *
   * @param dto - Login-Credentials
   * @returns Observable mit Auth-Response
   *
   * @example
   * ```typescript
   * this.authApi.login({ email: 'user@test.com', password: 'pass' })
   *   .subscribe(response => console.log(response.user));
   * ```
   */
  login(dto: LoginDto): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>('auth/login', dto)
      .pipe(tap((response) => this.storeAuthData(response)));
  }

  /**
   * Registriert neuen Benutzer
   *
   * @param dto - Registrierungs-Daten
   * @returns Observable mit Auth-Response
   *
   * @example
   * ```typescript
   * this.authApi.register({
   *   email: 'new@test.com',
   *   username: 'newuser',
   *   password: 'secure123',
   *   firstName: 'Max'
   * }).subscribe();
   * ```
   */
  register(dto: RegisterDto): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>('auth/register', dto)
      .pipe(tap((response) => this.storeAuthData(response)));
  }

  /**
   * Erneuert Access-Token mit Refresh-Token
   *
   * @param refreshToken - Optional: Refresh-Token (verwendet gespeicherten wenn nicht angegeben)
   * @returns Observable mit neuer Auth-Response
   * @throws Error wenn kein Refresh-Token vorhanden
   *
   * @example
   * ```typescript
   * this.authApi.refreshToken().subscribe({
   *   next: () => console.log('Token erneuert'),
   *   error: () => this.logout()
   * });
   * ```
   */
  refreshToken(refreshToken?: string): Observable<AuthResponse> {
    const token = refreshToken || this.getRefreshToken();
    if (!token) {
      throw new Error('No refresh token available');
    }

    return this.api
      .post<AuthResponse>('auth/refresh', { refresh_token: token } as RefreshTokenDto)
      .pipe(tap((response) => this.storeAuthData(response)));
  }

  /**
   * Meldet Benutzer ab (Backend + LocalStorage)
   *
   * @returns Observable void
   */
  logout(): Observable<void> {
    return this.api.post<void>('auth/logout', {}).pipe(tap(() => this.clearAuthData()));
  }

  /**
   * Ruft aktuellen authentifizierten Benutzer vom Backend ab
   *
   * @returns Observable mit User-Objekt
   */
  getCurrentUser(): Observable<User> {
    return this.api.get<User>('auth/me');
  }

  /**
   * Verifiziert Gültigkeit des aktuellen Tokens beim Backend
   *
   * @returns Observable mit Validierungs-Status
   */
  verifyToken(): Observable<{ valid: boolean }> {
    return this.api.get<{ valid: boolean }>('auth/verify');
  }

  /**
   * Speichert Authentifizierungs-Daten im LocalStorage
   *
   * @private
   * @param response - Auth-Response vom Backend
   */
  private storeAuthData(response: AuthResponse): void {
    if (response.access_token) {
      localStorage.setItem(this.TOKEN_KEY, response.access_token);
    }
    if (response.refresh_token) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refresh_token);
    }
    if (response.user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
    }
  }

  /**
   * Löscht alle Authentifizierungs-Daten aus LocalStorage
   *
   * @private
   */
  private clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Gibt gespeicherten Access-Token zurück
   *
   * @returns Access-Token oder null
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Gibt gespeicherten Refresh-Token zurück
   *
   * @returns Refresh-Token oder null
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Gibt gespeicherte User-Daten zurück
   *
   * @returns User-Objekt oder null
   */
  getStoredUser(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  /**
   * Prüft ob Benutzer authentifiziert ist
   *
   * @returns true wenn Access-Token vorhanden
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

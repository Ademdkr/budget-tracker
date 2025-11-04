import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../shared/services/api.service';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  user: User;
  expiresIn?: number;
}

export interface RefreshTokenDto {
  refresh_token: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private api = inject(ApiService);
  private readonly TOKEN_KEY = 'budget_tracker_token';
  private readonly REFRESH_TOKEN_KEY = 'budget_tracker_refresh_token';
  private readonly USER_KEY = 'budget_tracker_user';

  /**
   * Login with email and password
   */
  login(dto: LoginDto): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>('auth/login', dto)
      .pipe(tap((response) => this.storeAuthData(response)));
  }

  /**
   * Register new user
   */
  register(dto: RegisterDto): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>('auth/register', dto)
      .pipe(tap((response) => this.storeAuthData(response)));
  }

  /**
   * Refresh access token
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
   * Logout user
   */
  logout(): Observable<void> {
    return this.api.post<void>('auth/logout', {}).pipe(tap(() => this.clearAuthData()));
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): Observable<User> {
    return this.api.get<User>('auth/me');
  }

  /**
   * Verify if current token is valid
   */
  verifyToken(): Observable<{ valid: boolean }> {
    return this.api.get<{ valid: boolean }>('auth/verify');
  }

  /**
   * Store authentication data in localStorage
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
   * Clear all authentication data
   */
  private clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Get stored user data
   */
  getStoredUser(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

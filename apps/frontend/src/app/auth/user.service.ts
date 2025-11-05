import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Repräsentiert Basis-Informationen eines Benutzers
 */
export interface UserInfo {
  /** Eindeutige Benutzer-ID */
  id: string;
  /** Vorname */
  name: string;
  /** Nachname */
  surname: string;
  /** Email-Adresse */
  email: string;
  /** Erstellungsdatum (ISO String) */
  createdAt: string;
}

/**
 * User Service - Verwaltung von Benutzer-Daten
 *
 * Service zum Abrufen von Benutzerinformationen vom Backend.
 * Verwendet HttpClient für direkte API-Kommunikation.
 *
 * @example
 * ```typescript
 * constructor(private userService: UserService) {}
 *
 * loadUsers() {
 *   this.userService.getUsers().subscribe(users => {
 *     console.log('Alle Benutzer:', users);
 *   });
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  /** Basis-URL für Auth/User Endpoints */
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  /**
   * Ruft alle Benutzer vom Backend ab
   *
   * @returns Observable mit Array von UserInfo-Objekten
   *
   * @example
   * ```typescript
   * this.userService.getUsers().subscribe({
   *   next: (users) => this.displayUsers(users),
   *   error: (err) => console.error('Fehler beim Laden:', err)
   * });
   * ```
   */
  getUsers(): Observable<UserInfo[]> {
    return this.http.get<UserInfo[]>(`${this.baseUrl}/users`);
  }
}

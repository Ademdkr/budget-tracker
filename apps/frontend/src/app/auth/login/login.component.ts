import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { UserService, UserInfo } from '../user.service';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { Footer } from '../../footer/footer';

/**
 * Login Component - Benutzer-Anmeldeseite
 *
 * Features:
 * - Reaktives Login-Formular mit Email/Passwort
 * - Lädt verfügbare Demo-Benutzer für einfaches Testing
 * - Schnellauswahl von Demo-Benutzern
 * - Formular-Validierung mit Fehleranzeige
 * - Loading-Spinner während Authentifizierung
 * - Navigation zu Register-Seite
 *
 * @example
 * ```typescript
 * // In app.routes.ts
 * {
 *   path: 'login',
 *   component: LoginComponent,
 *   canActivate: [guestGuard]
 * }
 * ```
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSelectModule,
    MatDividerModule,
    Footer,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private userService = inject(UserService);

  /** Reaktives Formular für Login */
  loginForm: FormGroup;
  /** Loading-Status während Authentifizierung */
  isLoading = false;
  /** Fehlermeldung bei Login-Fehler */
  errorMessage = '';
  /** Passwort-Sichtbarkeit toggle */
  hidePassword = true;
  /** Liste verfügbarer Demo-Benutzer */
  availableUsers: UserInfo[] = [];
  /** Loading-Status beim Laden der Benutzer */
  isLoadingUsers = false;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  /**
   * Angular Lifecycle Hook - Initialisierung
   */
  ngOnInit() {
    this.loadAvailableUsers();
  }

  /**
   * Lädt verfügbare Demo-Benutzer vom Backend
   *
   * Zeigt Liste von Test-Accounts für schnelle Anmeldung.
   */
  loadAvailableUsers() {
    this.isLoadingUsers = true;
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.availableUsers = users;
        this.isLoadingUsers = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoadingUsers = false;
      },
    });
  }

  /**
   * Füllt Login-Formular mit ausgewähltem Demo-Benutzer
   *
   * @param user - Ausgewählter Demo-User
   */
  selectUser(user: UserInfo) {
    this.loginForm.patchValue({
      email: user.email,
      password: 'password', // Default password for all demo users
    });
  }

  /**
   * Behandelt Formular-Absenden
   *
   * Validiert Formular und führt Login durch AuthService aus.
   * Bei Erfolg: Navigation zu Dashboard
   * Bei Fehler: Anzeige Fehlermeldung
   */
  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { email, password } = this.loginForm.value;

      // Use real API login
      this.authService.login({ email, password }).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Ungültige E-Mail oder Passwort';
        },
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  /**
   * Navigiert zur Registrierungs-Seite
   */
  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  /**
   * Markiert alle Formular-Controls als touched
   *
   * @private
   */
  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach((key) => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Generiert benutzerfreundliche Fehlermeldungen
   *
   * @param field - Feldname (email oder password)
   * @returns Fehlermeldung oder leerer String
   */
  getErrorMessage(field: string): string {
    const control = this.loginForm.get(field);
    if (control?.hasError('required')) {
      return `${field === 'email' ? 'E-Mail' : 'Passwort'} ist erforderlich`;
    }
    if (control?.hasError('email')) {
      return 'Ungültige E-Mail-Adresse';
    }
    if (control?.hasError('minlength')) {
      return 'Passwort muss mindestens 6 Zeichen lang sein';
    }
    return '';
  }
}

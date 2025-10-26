import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  hidePassword = true;
  hideConfirmPassword = true;

  constructor() {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), this.passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  // Custom validator for password strength
  passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value;
    if (!password) return null;

    const hasNumber = /[0-9]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const passwordValid = hasNumber && hasLower && hasUpper && hasSpecial;
    
    if (!passwordValid) {
      return { 
        passwordStrength: {
          hasNumber,
          hasLower,
          hasUpper,
          hasSpecial
        }
      };
    }
    return null;
  }

  // Custom validator for password match
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) return null;

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const { email } = this.registerForm.value;
      
      // Use simulated registration for now
      this.authService.simulateRegister(email)
        .then(() => {
          this.isLoading = false;
          // Auto-login after registration
          this.router.navigate(['/dashboard']);
        })
        .catch((error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Registrierung fehlgeschlagen. Versuchen Sie es später erneut.';
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  private markFormGroupTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(field: string): string {
    const control = this.registerForm.get(field);
    
    if (control?.hasError('required')) {
      const fieldNames: { [key: string]: string } = {
        email: 'E-Mail',
        password: 'Passwort',
        confirmPassword: 'Passwort-Wiederholung'
      };
      return `${fieldNames[field]} ist erforderlich`;
    }
    
    if (control?.hasError('email')) {
      return 'Ungültige E-Mail-Adresse';
    }
    
    if (control?.hasError('minlength')) {
      return 'Passwort muss mindestens 8 Zeichen lang sein';
    }
    
    if (control?.hasError('passwordStrength')) {
      return 'Passwort muss Groß-/Kleinbuchstaben, Zahlen und Sonderzeichen enthalten';
    }
    
    if (field === 'confirmPassword' && this.registerForm.hasError('passwordMismatch')) {
      return 'Passwörter stimmen nicht überein';
    }
    
    return '';
  }

  getPasswordStrengthText(): string {
    const control = this.registerForm.get('password');
    if (!control?.hasError('passwordStrength')) return '';
    
    const errors = control.errors?.['passwordStrength'];
    const missing: string[] = [];
    
    if (!errors.hasLower) missing.push('Kleinbuchstaben');
    if (!errors.hasUpper) missing.push('Großbuchstaben');
    if (!errors.hasNumber) missing.push('Zahlen');
    if (!errors.hasSpecial) missing.push('Sonderzeichen');
    
    return `Fehlt: ${missing.join(', ')}`;
  }
}

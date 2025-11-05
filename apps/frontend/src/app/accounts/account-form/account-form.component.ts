import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AccountsApiService, CreateAccountDto } from '../accounts-api.service';

/**
 * Repräsentiert ein Konto
 */
export interface Account {
  /** Eindeutige Konto-ID */
  id: string;
  /** Name des Kontos */
  name: string;
  /** Kontotyp */
  type: AccountType;
  /** Aktueller Saldo */
  balance: number;
  /** Notiz (optional) */
  note?: string;
  /** Ob Konto aktiv ist */
  isActive: boolean;
  /** Erstellungsdatum */
  createdAt: Date;
  /** Letzte Änderung */
  updatedAt: Date;
}

/**
 * Enum für Kontotypen
 */
/**
 * Enum für Kontotypen
 */
export enum AccountType {
  /** Girokonto */
  CHECKING = 'CHECKING',
  /** Sparkonto */
  SAVINGS = 'SAVINGS',
  /** Kreditkarte */
  CREDIT_CARD = 'CREDIT_CARD',
  /** Anlagekonto */
  INVESTMENT = 'INVESTMENT',
  /** Bargeld */
  CASH = 'CASH',
  /** Sonstiges */
  OTHER = 'OTHER',
}

/**
 * Dialog-Daten für Account-Form
 */
/**
 * Dialog-Daten für Account-Form
 */
export interface AccountDialogData {
  /** Account-Objekt bei Bearbeitung (optional) */
  account?: Account;
  /** true = Bearbeiten, false = Neu erstellen */
  isEdit: boolean;
}

/**
 * Account Form Component - Dialog für Konto-Erstellung/-Bearbeitung
 *
 * Features:
 * - Reaktives Formular für Konto-Details
 * - Unterstützt Erstellen und Bearbeiten von Konten
 * - Auswahl verschiedener Kontotypen mit Icons
 * - Initialer Saldo (nur bei Erstellung)
 * - isActive Toggle für aktives Konto
 * - Formular-Validierung
 *
 * @example
 * ```typescript
 * // Neues Konto erstellen
 * this.dialog.open(AccountFormComponent, {
 *   data: { isEdit: false }
 * });
 *
 * // Konto bearbeiten
 * this.dialog.open(AccountFormComponent, {
 *   data: { account: existingAccount, isEdit: true }
 * });
 * ```
 */
@Component({
  selector: 'app-account-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatSlideToggleModule,
  ],
  templateUrl: './account-form.component.html',

  styleUrls: ['./account-form.component.scss'],
})
export class AccountFormComponent implements OnInit {
  /** Reaktives Formular für Konto-Daten */
  accountForm: FormGroup;
  /** Sende-Status während API-Call */
  isSubmitting = false;

  /** Verfügbare Kontotypen mit Icons und Farben */
  accountTypes = [
    {
      value: AccountType.CHECKING,
      label: 'Girokonto',
      icon: 'account_balance',
      color: '#2196F3',
    },
    {
      value: AccountType.SAVINGS,
      label: 'Sparkonto',
      icon: 'savings',
      color: '#4CAF50',
    },
    {
      value: AccountType.CREDIT_CARD,
      label: 'Kreditkarte',
      icon: 'credit_card',
      color: '#FF9800',
    },
    {
      value: AccountType.INVESTMENT,
      label: 'Anlagekonto',
      icon: 'trending_up',
      color: '#9C27B0',
    },
    {
      value: AccountType.CASH,
      label: 'Bargeld',
      icon: 'payments',
      color: '#795548',
    },
    {
      value: AccountType.OTHER,
      label: 'Sonstiges',
      icon: 'more_horiz',
      color: '#607D8B',
    },
  ];

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AccountFormComponent>);
  public data = inject(MAT_DIALOG_DATA) as AccountDialogData;
  private accountsApi = inject(AccountsApiService);

  constructor() {
    this.accountForm = this.createForm();
  }

  /**
   * Angular Lifecycle Hook - Initialisierung
   */
  ngOnInit(): void {
    console.log('🚀 AccountFormComponent ngOnInit');
    console.log('📋 Dialog data:', this.data);
    console.log('✏️ Is edit mode:', this.data.isEdit);

    if (this.data.isEdit && this.data.account) {
      console.log('📝 Populating form with account data:', this.data.account);
      this.populateForm(this.data.account);
    } else {
      console.log('🆕 Creating new account form');
    }
  }

  /**
   * Erstellt das reaktive Formular mit Validierung
   *
   * @private
   * @returns Initialisiertes FormGroup
   */
  private createForm(): FormGroup {
    const form = this.fb.group({
      name: ['Test Konto', [Validators.required, Validators.minLength(2)]],
      type: [AccountType.CHECKING, [Validators.required]],
      balance: [0, [Validators.required]],
      note: [''],
      isActive: [true],
    });

    console.log('📝 Form created with values:', form.value);
    console.log('📝 Form valid on creation:', form.valid);
    return form;
  }

  /**
   * Füllt Formular mit bestehenden Account-Daten
   *
   * @private
   * @param account - Account zum Bearbeiten
   */
  private populateForm(account: Account): void {
    this.accountForm.patchValue({
      name: account.name,
      type: account.type,
      balance: account.balance,
      note: account.note || '',
      isActive: account.isActive,
    });

    // Remove balance control for edit mode
    if (this.data.isEdit) {
      this.accountForm.removeControl('balance');
    }
  }

  /**
   * Behandelt Formular-Absenden
   *
   * Erstellt neues Konto oder aktualisiert bestehendes.
   * Schließt Dialog bei Erfolg.
   */
  onSubmit(): void {
    console.log('🔄 onSubmit called');
    console.log('📋 Form valid:', this.accountForm.valid);
    console.log('📋 Form value:', this.accountForm.value);
    console.log('📋 Data object:', this.data);

    if (this.accountForm.invalid) {
      console.log('❌ Form is invalid, marking fields as touched');
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.accountForm.value;
    console.log('✅ Form is valid, proceeding with submission');

    if (this.data.isEdit && this.data.account) {
      // Update existing account
      const updateData = {
        name: formValue.name.trim(),
        type: formValue.type,
        note: formValue.note?.trim() || undefined,
        isActive: formValue.isActive,
      };

      this.accountsApi.update(this.data.account.id, updateData).subscribe({
        next: (account) => {
          this.isSubmitting = false;
          this.dialogRef.close({
            action: 'edit',
            account: account,
          });
        },
        error: (error) => {
          console.error('Error updating account:', error);
          this.isSubmitting = false;
        },
      });
    } else {
      // Create new account
      console.log('🆕 Creating new account');
      const createData: CreateAccountDto = {
        name: formValue.name.trim(),
        type: formValue.type,
        balance: formValue.balance || 0,
        note: formValue.note?.trim() || undefined,
        isActive: formValue.isActive,
      };
      console.log('📤 Create data:', createData);

      this.accountsApi.create(createData).subscribe({
        next: (account) => {
          console.log('✅ Account created successfully:', account);
          this.isSubmitting = false;
          this.dialogRef.close({
            action: 'create',
            account: account,
          });
        },
        error: (error) => {
          console.error('❌ Error creating account:', error);
          this.isSubmitting = false;
        },
      });
    }
  }

  /**
   * Bricht Formular-Bearbeitung ab
   *
   * Fragt bei ungespeicherten Änderungen nach Bestätigung.
   */
  onCancel(): void {
    if (this.accountForm.dirty) {
      // In a real app, you might want to show a confirmation dialog
      const confirmLeave = confirm(
        'Möchten Sie wirklich abbrechen? Ungespeicherte Änderungen gehen verloren.',
      );
      if (!confirmLeave) {
        return;
      }
    }

    this.dialogRef.close();
  }

  /**
   * Setzt Formular auf Ursprungswerte zurück
   */
  onReset(): void {
    if (this.data.isEdit && this.data.account) {
      this.populateForm(this.data.account);
    } else {
      this.accountForm.reset({
        name: '',
        type: AccountType.CHECKING,
        balance: 0,
        note: '',
        isActive: true,
      });
    }
    this.accountForm.markAsUntouched();
  }

  /**
   * Markiert alle Formular-Controls als touched
   *
   * @private
   */
  private markFormGroupTouched(): void {
    console.log('👆 Marking form fields as touched');
    Object.keys(this.accountForm.controls).forEach((key) => {
      const control = this.accountForm.get(key);
      if (control) {
        console.log(
          `📝 Field ${key}: value=${control.value}, valid=${control.valid}, errors=`,
          control.errors,
        );
        control.markAsTouched();
      }
    });
  }

  /**
   * Hilfsmethode für Account-Typ Informationen
   *
   * @param type - AccountType
   * @returns Typ-Informationen (Label, Icon, Farbe)
   */
  getAccountTypeInfo(type: AccountType) {
    return this.accountTypes.find((t) => t.value === type);
  }
}

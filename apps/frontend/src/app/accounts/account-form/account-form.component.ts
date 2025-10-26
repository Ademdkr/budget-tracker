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

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  note?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
  CREDIT_CARD = 'CREDIT_CARD',
  INVESTMENT = 'INVESTMENT',
  CASH = 'CASH',
  OTHER = 'OTHER'
}

export interface AccountDialogData {
  account?: Account;
  isEdit: boolean;
}

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
    MatSnackBarModule
  ],
  template: `
    <div class="account-form-dialog">
      <div mat-dialog-title class="dialog-header">
        <div class="header-content">
          <mat-icon class="header-icon">{{ data.isEdit ? 'edit' : 'add' }}</mat-icon>
          <h2>{{ data.isEdit ? 'Konto bearbeiten' : 'Neues Konto' }}</h2>
        </div>
        <button mat-icon-button mat-dialog-close class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div mat-dialog-content class="dialog-content">
        <form [formGroup]="accountForm" class="account-form">
          <!-- Name Field -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Kontoname</mat-label>
            <input
              matInput
              formControlName="name"
              placeholder="z.B. Sparkasse Girokonto"
              maxlength="100"
            >
            <mat-icon matPrefix>account_balance</mat-icon>
            <mat-hint align="start">{{ accountForm.get('name')?.value?.length || 0 }}/100</mat-hint>
            <mat-error *ngIf="accountForm.get('name')?.hasError('required')">
              Kontoname ist erforderlich
            </mat-error>
            <mat-error *ngIf="accountForm.get('name')?.hasError('minlength')">
              Kontoname muss mindestens 2 Zeichen lang sein
            </mat-error>
            <mat-error *ngIf="accountForm.get('name')?.hasError('maxlength')">
              Kontoname darf maximal 100 Zeichen lang sein
            </mat-error>
            <mat-error *ngIf="accountForm.get('name')?.hasError('pattern')">
              Kontoname darf nur Buchstaben, Zahlen und Sonderzeichen enthalten
            </mat-error>
          </mat-form-field>

          <!-- Type Field -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Kontotyp</mat-label>
            <mat-select formControlName="type">
              <mat-option *ngFor="let type of accountTypes" [value]="type.value">
                <div class="type-option">
                  <mat-icon [style.color]="type.color">{{ type.icon }}</mat-icon>
                  <span>{{ type.label }}</span>
                </div>
              </mat-option>
            </mat-select>
            <mat-icon matPrefix>category</mat-icon>
            <mat-error *ngIf="accountForm.get('type')?.hasError('required')">
              Kontotyp ist erforderlich
            </mat-error>
          </mat-form-field>

          <!-- Initial Balance Field (only for new accounts) -->
          <mat-form-field appearance="outline" class="full-width" *ngIf="!data.isEdit">
            <mat-label>Anfangssaldo</mat-label>
            <input
              matInput
              type="number"
              formControlName="balance"
              placeholder="0,00"
              step="0.01"
            >
            <mat-icon matPrefix>euro</mat-icon>
            <span matSuffix>€</span>
            <mat-hint>Geben Sie den aktuellen Kontostand ein</mat-hint>
            <mat-error *ngIf="accountForm.get('balance')?.hasError('required')">
              Anfangssaldo ist erforderlich
            </mat-error>
            <mat-error *ngIf="accountForm.get('balance')?.hasError('min')">
              Saldo muss mindestens -999.999,99 € betragen
            </mat-error>
            <mat-error *ngIf="accountForm.get('balance')?.hasError('max')">
              Saldo darf maximal 999.999,99 € betragen
            </mat-error>
          </mat-form-field>

          <!-- Note Field -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Notiz (optional)</mat-label>
            <textarea
              matInput
              formControlName="note"
              placeholder="Zusätzliche Informationen zum Konto..."
              maxlength="500"
              rows="3"
              cdkTextareaAutosize
              cdkAutosizeMinRows="3"
              cdkAutosizeMaxRows="6"
            ></textarea>
            <mat-icon matPrefix>note</mat-icon>
            <mat-hint align="start">{{ accountForm.get('note')?.value?.length || 0 }}/500</mat-hint>
            <mat-error *ngIf="accountForm.get('note')?.hasError('maxlength')">
              Notiz darf maximal 500 Zeichen lang sein
            </mat-error>
          </mat-form-field>

          <!-- Form Status -->
          <div class="form-status" *ngIf="accountForm.invalid && accountForm.touched">
            <mat-icon color="warn">warning</mat-icon>
            <span>Bitte korrigieren Sie die Fehler im Formular</span>
          </div>
        </form>
      </div>

      <div mat-dialog-actions class="dialog-actions">
        <div class="actions-left">
          <button
            mat-button
            type="button"
            (click)="onCancel()"
            class="cancel-button"
          >
            <mat-icon>close</mat-icon>
            Abbrechen
          </button>
        </div>
        
        <div class="actions-right">
          <button
            mat-button
            type="button"
            (click)="onReset()"
            [disabled]="!accountForm.dirty"
            class="reset-button"
          >
            <mat-icon>refresh</mat-icon>
            Zurücksetzen
          </button>
          
          <button
            mat-raised-button
            color="primary"
            type="submit"
            (click)="onSubmit()"
            [disabled]="accountForm.invalid || isSubmitting"
            class="submit-button"
          >
            <mat-icon>{{ data.isEdit ? 'save' : 'add' }}</mat-icon>
            {{ data.isEdit ? 'Speichern' : 'Erstellen' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./account-form.component.scss']
})
export class AccountFormComponent implements OnInit {
  accountForm: FormGroup;
  isSubmitting = false;

  accountTypes = [
    {
      value: AccountType.CHECKING,
      label: 'Girokonto',
      icon: 'account_balance',
      color: '#2196F3'
    },
    {
      value: AccountType.SAVINGS,
      label: 'Sparkonto',
      icon: 'savings',
      color: '#4CAF50'
    },
    {
      value: AccountType.CREDIT_CARD,
      label: 'Kreditkarte',
      icon: 'credit_card',
      color: '#FF9800'
    },
    {
      value: AccountType.INVESTMENT,
      label: 'Anlagekonto',
      icon: 'trending_up',
      color: '#9C27B0'
    },
    {
      value: AccountType.CASH,
      label: 'Bargeld',
      icon: 'payments',
      color: '#795548'
    },
    {
      value: AccountType.OTHER,
      label: 'Sonstiges',
      icon: 'more_horiz',
      color: '#607D8B'
    }
  ];

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AccountFormComponent>);
  public data = inject(MAT_DIALOG_DATA) as AccountDialogData;

  constructor() {
    this.accountForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.data.isEdit && this.data.account) {
      this.populateForm(this.data.account);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-ZäöüÄÖÜß0-9\s\-_.,()&]+$/)
      ]],
      type: [AccountType.CHECKING, [Validators.required]],
      balance: [0, [
        Validators.required,
        Validators.min(-999999.99),
        Validators.max(999999.99)
      ]],
      note: ['', [Validators.maxLength(500)]]
    });
  }

  private populateForm(account: Account): void {
    this.accountForm.patchValue({
      name: account.name,
      type: account.type,
      balance: account.balance,
      note: account.note || ''
    });

    // Remove balance control for edit mode
    if (this.data.isEdit) {
      this.accountForm.removeControl('balance');
    }
  }

  onSubmit(): void {
    if (this.accountForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;

    const formValue = this.accountForm.value;
    const accountData: Partial<Account> = {
      name: formValue.name.trim(),
      type: formValue.type,
      note: formValue.note?.trim() || undefined
    };

    // Add balance only for new accounts
    if (!this.data.isEdit) {
      accountData.balance = formValue.balance || 0;
    }

    // Simulate API call
    setTimeout(() => {
      this.isSubmitting = false;
      this.dialogRef.close({
        action: this.data.isEdit ? 'edit' : 'create',
        account: accountData
      });
    }, 500);
  }

  onCancel(): void {
    if (this.accountForm.dirty) {
      // In a real app, you might want to show a confirmation dialog
      const confirmLeave = confirm('Möchten Sie wirklich abbrechen? Ungespeicherte Änderungen gehen verloren.');
      if (!confirmLeave) {
        return;
      }
    }
    
    this.dialogRef.close();
  }

  onReset(): void {
    if (this.data.isEdit && this.data.account) {
      this.populateForm(this.data.account);
    } else {
      this.accountForm.reset({
        name: '',
        type: AccountType.CHECKING,
        balance: 0,
        note: ''
      });
    }
    this.accountForm.markAsUntouched();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.accountForm.controls).forEach(key => {
      const control = this.accountForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  // Helper method to get account type info
  getAccountTypeInfo(type: AccountType) {
    return this.accountTypes.find(t => t.value === type);
  }
}
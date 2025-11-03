import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Transaction, TransactionsApiService } from '../transactions-api.service';
import { Category } from '../../categories/categories-api.service';
import { AccountSelectionService } from '../../shared/services/account-selection.service';

export interface TransactionFormData {
  transaction?: Transaction;
  categories: Category[];
  // accounts: Account[];
  mode: 'create' | 'edit';
}

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatCardModule,
  ],
  templateUrl: './transaction-form.component.html',
  styleUrl: './transaction-form.component.scss',
})
export class TransactionFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<TransactionFormComponent>);
  private transactionsApi = inject(TransactionsApiService);
  private accountSelectionService = inject(AccountSelectionService);
  public data = inject(MAT_DIALOG_DATA) as TransactionFormData;

  transactionForm!: FormGroup;
  categories: Category[] = [];
  // accounts: Account[] = [];
  mode: 'create' | 'edit' = 'create';
  isSubmitting = false;

  // Filtered categories based on transaction type
  filteredCategories: Category[] = [];

  constructor() {}

  ngOnInit() {
    const data = this.data;
    this.categories = data.categories;
    // this.accounts = data.accounts;
    this.mode = data.mode;

    this.transactionForm = this.fb.group({
      date: [
        data.transaction?.date ? new Date(data.transaction.date) : new Date(),
        [Validators.required],
      ],
      amount: [
        data.transaction ? Math.abs(data.transaction.amount) : null,
        [Validators.required, Validators.min(0.01)],
      ],
      category: [data.transaction?.categoryId || '', [Validators.required]],
      // account: [data.transaction?.account || '', [Validators.required]],
      note: [data.transaction?.note || data.transaction?.description || ''],
    });

    this.setupFormSubscriptions();
    this.filterCategories();
  }

  private setupFormSubscriptions() {
    // Kategorien initial laden
    this.filterCategories();
  }

  private filterCategories() {
    // Zeige alle Kategorien, da das Schema kein type-Feld hat
    this.filteredCategories = [...this.categories];
  }

  getDialogTitle(): string {
    return this.mode === 'create' ? 'Neue Transaktion' : 'Transaktion bearbeiten';
  }

  getSubmitButtonText(): string {
    return this.mode === 'create' ? 'Hinzufügen' : 'Speichern';
  }

  getCategoryEmoji(categoryId: string): string {
    const category = this.categories.find((c) => c.id === categoryId);
    return category?.emoji || category?.icon || '';
  }

  getSelectedCategoryType(): 'INCOME' | 'EXPENSE' | null {
    const selectedCategoryId = this.transactionForm.get('category')?.value;
    if (!selectedCategoryId) return null;

    const category = this.categories.find((c) => c.id === selectedCategoryId);
    return category?.transactionType || null;
  }

  onSubmit() {
    if (this.transactionForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const formValue = this.transactionForm.value;

      // Finde die ausgewählte Kategorie und leite den Transaktionstyp ab
      const selectedCategory = this.categories.find((c) => c.id === formValue.category);

      // Hole die aktuelle Account-ID vom Service
      const selectedAccount = this.accountSelectionService.getSelectedAccount();
      const accountId = selectedAccount?.id || '';

      // Leite Transaktionstyp von der Kategorie ab
      const transactionType = selectedCategory?.transactionType || 'EXPENSE';

      console.log('Transaktion wird erstellt:', {
        kategorie: selectedCategory?.name,
        transactionType: transactionType,
        accountId: accountId,
        accountName: selectedAccount?.name || 'Kein Konto ausgewählt',
      });

      if (this.mode === 'create') {
        // Erstelle neue Transaktion
        // Setze die aktuelle Uhrzeit, falls nur ein Datum ausgewählt wurde
        const transactionDate = new Date(formValue.date);
        if (transactionDate.getHours() === 0 && transactionDate.getMinutes() === 0) {
          const now = new Date();
          transactionDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
        }

        const createDto = {
          title: formValue.note || 'Transaktion',
          description: formValue.note || '',
          amount: Math.abs(formValue.amount), // Immer positiv speichern
          type: transactionType, // Automatisch von Kategorie abgeleitet
          date: transactionDate,
          categoryId: formValue.category,
          accountId: accountId,
        };

        this.transactionsApi.create(createDto).subscribe({
          next: (transaction) => {
            this.dialogRef.close(transaction);
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Fehler beim Erstellen:', error);
            this.isSubmitting = false;
            alert('Fehler beim Speichern der Transaktion');
          },
        });
      } else {
        // Aktualisiere existierende Transaktion
        // Behalte die ursprüngliche Uhrzeit bei, falls nur das Datum geändert wurde
        const transactionDate = new Date(formValue.date);
        const originalDate = this.data.transaction?.date
          ? new Date(this.data.transaction.date)
          : new Date();

        // Wenn keine Zeit im Formular gesetzt ist, übernehme die ursprüngliche Zeit
        if (transactionDate.getHours() === 0 && transactionDate.getMinutes() === 0) {
          transactionDate.setHours(
            originalDate.getHours(),
            originalDate.getMinutes(),
            originalDate.getSeconds(),
          );
        }

        const updateDto = {
          title: formValue.note || 'Transaktion',
          description: formValue.note || '',
          amount: Math.abs(formValue.amount), // Immer positiv speichern
          type: transactionType, // Automatisch von Kategorie abgeleitet
          date: transactionDate,
          categoryId: formValue.category,
          accountId: accountId,
        };

        this.transactionsApi.update(this.data.transaction!.id, updateDto).subscribe({
          next: (transaction) => {
            this.dialogRef.close(transaction);
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Fehler beim Aktualisieren:', error);
            this.isSubmitting = false;
            alert('Fehler beim Speichern der Transaktion');
          },
        });
      }
    } else {
      // Mark all fields as touched to show validation errors
      this.transactionForm.markAllAsTouched();
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  // Validation helper methods
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.transactionForm.get(fieldName);
    return !!(field?.hasError(errorType) && (field?.dirty || field?.touched));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.transactionForm.get(fieldName);

    if (field?.hasError('required')) {
      return 'Dieses Feld ist erforderlich';
    }

    if (fieldName === 'amount') {
      if (field?.hasError('min')) {
        return 'Der Betrag muss größer als 0 sein';
      }
    }

    if (fieldName === 'date') {
      if (field?.hasError('matDatepickerParse')) {
        return 'Ungültiges Datum';
      }
    }

    return '';
  }
}

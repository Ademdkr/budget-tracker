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
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { Transaction, Category, Account } from '../transactions.component';

export interface TransactionFormData {
  transaction?: Transaction;
  categories: Category[];
  accounts: Account[];
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
    MatRadioModule,
    MatCardModule
  ],
  templateUrl: './transaction-form.component.html',
  styleUrl: './transaction-form.component.scss'
})
export class TransactionFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<TransactionFormComponent>);
  public data = inject(MAT_DIALOG_DATA) as TransactionFormData;
  
  transactionForm!: FormGroup;
  categories: Category[] = [];
  accounts: Account[] = [];
  mode: 'create' | 'edit' = 'create';
  isSubmitting = false;

  // Filtered categories based on transaction type
  filteredCategories: Category[] = [];

  constructor() {}

  ngOnInit() {
    const data = this.data;
    this.categories = data.categories;
    this.accounts = data.accounts;
    this.mode = data.mode;

    this.transactionForm = this.fb.group({
      type: [data.transaction?.type || 'expense', [Validators.required]],
      date: [data.transaction?.date || new Date(), [Validators.required]],
      amount: [
        data.transaction ? Math.abs(data.transaction.amount) : null, 
        [Validators.required, Validators.min(0.01)]
      ],
      category: [data.transaction?.category || '', [Validators.required]],
      account: [data.transaction?.account || '', [Validators.required]],
      note: [data.transaction?.note || '']
    });

    this.setupFormSubscriptions();
    this.filterCategories();
  }

  private setupFormSubscriptions() {
    // Filter categories when transaction type changes
    this.transactionForm.get('type')?.valueChanges.subscribe(() => {
      this.filterCategories();
      // Reset category when type changes
      this.transactionForm.patchValue({ category: '' });
    });
  }

  private filterCategories() {
    const transactionType = this.transactionForm.get('type')?.value;
    this.filteredCategories = this.categories.filter(category => 
      category.type === transactionType || category.type === 'both'
    );
  }

  getDialogTitle(): string {
    return this.mode === 'create' ? 'Neue Transaktion' : 'Transaktion bearbeiten';
  }

  getSubmitButtonText(): string {
    return this.mode === 'create' ? 'Hinzufügen' : 'Speichern';
  }

  getCategoryEmoji(categoryName: string): string {
    const category = this.categories.find(c => c.name === categoryName);
    return category?.emoji || '';
  }

  onSubmit() {
    if (this.transactionForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const formValue = this.transactionForm.value;
      const transaction: Partial<Transaction> = {
        ...formValue,
        // Convert amount to negative for expenses
        amount: formValue.type === 'expense' ? -Math.abs(formValue.amount) : Math.abs(formValue.amount),
        categoryEmoji: this.getCategoryEmoji(formValue.category),
        id: this.mode === 'edit' ? this.data.transaction?.id : undefined
      };

      // Simulate API call
      setTimeout(() => {
        this.dialogRef.close(transaction);
        this.isSubmitting = false;
      }, 1000);
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
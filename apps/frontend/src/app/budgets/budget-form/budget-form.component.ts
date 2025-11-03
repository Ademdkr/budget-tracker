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

export interface Budget {
  id?: string;
  categoryId: string;
  categoryName: string;
  targetAmount: number;
  month: number;
  year: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isActive: boolean;
}

export interface BudgetDialogData {
  budget?: Budget;
  categories: Category[];
  existingBudgets: Budget[];
  month: number;
  year: number;
  isEdit: boolean;
}

@Component({
  selector: 'app-budget-form',
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
  ],
  templateUrl: './budget-form.component.html',
  styleUrls: ['./budget-form.component.scss'],
})
export class BudgetFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<BudgetFormComponent>);
  public data = inject(MAT_DIALOG_DATA) as BudgetDialogData;

  budgetForm: FormGroup;
  isSubmitting = false;
  availableCategories: Category[] = [];

  monthNames = [
    'Januar',
    'Februar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember',
  ];

  constructor() {
    this.budgetForm = this.createForm();
  }

  ngOnInit(): void {
    console.log('🔍 Budget Form Dialog Data:', this.data);
    console.log('🔍 Categories received:', this.data.categories);
    console.log('🔍 Existing budgets:', this.data.existingBudgets);
    
    this.loadAvailableCategories();

    console.log('🔍 Available categories after filtering:', this.availableCategories);

    if (this.data.isEdit && this.data.budget) {
      this.populateForm(this.data.budget);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      categoryId: ['', [Validators.required]],
      targetAmount: [null, [Validators.required, Validators.min(0.01), Validators.max(999999.99)]],
    });
  }

  private loadAvailableCategories(): void {
    if (this.data.isEdit) {
      // For editing, show all categories including the selected one
      this.availableCategories = this.data.categories.filter((c) => c.isActive);
    } else {
      // For creating, exclude categories that already have budgets for this period
      const existingCategoryIds = this.data.existingBudgets.map((b) => b.categoryId);
      this.availableCategories = this.data.categories.filter(
        (c) => c.isActive && !existingCategoryIds.includes(c.id),
      );
    }
  }

  private populateForm(budget: Budget): void {
    this.budgetForm.patchValue({
      categoryId: budget.categoryId,
      targetAmount: budget.targetAmount,
    });
  }

  // Helper Methods
  getMonthName(monthIndex: number): string {
    return this.monthNames[monthIndex] || '';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  getDailyBudget(): number {
    const targetAmount = this.budgetForm.get('targetAmount')?.value || 0;
    const daysInMonth = this.getDaysInMonth(this.data.month, this.data.year);
    return targetAmount / daysInMonth;
  }

  getWeeklyBudget(): number {
    const targetAmount = this.budgetForm.get('targetAmount')?.value || 0;
    const daysInMonth = this.getDaysInMonth(this.data.month, this.data.year);
    return (targetAmount / daysInMonth) * 7;
  }

  private getDaysInMonth(month: number, year: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  // Form Actions
  onSubmit(): void {
    if (this.budgetForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;

    const formValue = this.budgetForm.value;
    const selectedCategory = this.availableCategories.find((c) => c.id === formValue.categoryId);

    const budgetData: Partial<Budget> = {
      categoryId: formValue.categoryId,
      categoryName: selectedCategory?.name || '',
      targetAmount: formValue.targetAmount,
      month: this.data.month,
      year: this.data.year,
      isActive: true,
    };

    // Simulate API call
    setTimeout(() => {
      this.isSubmitting = false;
      this.dialogRef.close({
        action: this.data.isEdit ? 'edit' : 'create',
        budget: budgetData,
      });
    }, 500);
  }

  onCancel(): void {
    if (this.budgetForm.dirty) {
      const confirmLeave = confirm(
        'Möchten Sie wirklich abbrechen? Ungespeicherte Änderungen gehen verloren.',
      );
      if (!confirmLeave) {
        return;
      }
    }

    this.dialogRef.close();
  }

  onReset(): void {
    if (this.data.isEdit && this.data.budget) {
      this.populateForm(this.data.budget);
    } else {
      this.budgetForm.reset({
        categoryId: '',
        targetAmount: null,
      });
    }
    this.budgetForm.markAsUntouched();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.budgetForm.controls).forEach((key) => {
      const control = this.budgetForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }
}

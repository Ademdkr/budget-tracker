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
    MatSnackBarModule
  ],
  template: `
    <div class="budget-form-dialog">
      <div mat-dialog-title class="dialog-header">
        <div class="header-content">
          <mat-icon class="header-icon">{{ data.isEdit ? 'edit' : 'add' }}</mat-icon>
          <h2>{{ data.isEdit ? 'Budget bearbeiten' : 'Neues Budget' }}</h2>
        </div>
        <button mat-icon-button mat-dialog-close class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div mat-dialog-content class="dialog-content">
        <form [formGroup]="budgetForm" class="budget-form">
          <!-- Period Info -->
          <div class="period-info">
            <mat-icon>calendar_month</mat-icon>
            <span>Budget für {{ getMonthName(data.month) }} {{ data.year }}</span>
          </div>

          <!-- Category Field -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Kategorie</mat-label>
            <mat-select formControlName="categoryId" [disabled]="data.isEdit">
              <mat-option *ngFor="let category of availableCategories" [value]="category.id">
                <div class="category-option">
                  <div class="category-icon" [style.background-color]="category.color">
                    {{ category.icon }}
                  </div>
                  <span>{{ category.name }}</span>
                </div>
              </mat-option>
            </mat-select>
            <mat-icon matPrefix>category</mat-icon>
            <mat-hint *ngIf="data.isEdit">Kategorie kann bei der Bearbeitung nicht geändert werden</mat-hint>
            <mat-error *ngIf="budgetForm.get('categoryId')?.hasError('required')">
              Kategorie ist erforderlich
            </mat-error>
          </mat-form-field>

          <!-- Target Amount Field -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Budget-Betrag</mat-label>
            <input
              matInput
              type="number"
              formControlName="targetAmount"
              placeholder="0,00"
              step="0.01"
              min="0.01"
            >
            <mat-icon matPrefix>euro</mat-icon>
            <span matSuffix class="currency-suffix">€</span>
            <mat-hint>Geben Sie den gewünschten Budgetbetrag für den Monat ein</mat-hint>
            <mat-error *ngIf="budgetForm.get('targetAmount')?.hasError('required')">
              Budget-Betrag ist erforderlich
            </mat-error>
            <mat-error *ngIf="budgetForm.get('targetAmount')?.hasError('min')">
              Budget-Betrag muss mindestens 0,01 € betragen
            </mat-error>
            <mat-error *ngIf="budgetForm.get('targetAmount')?.hasError('max')">
              Budget-Betrag darf maximal 999.999,99 € betragen
            </mat-error>
          </mat-form-field>

          <!-- Budget Preview -->
          <div class="budget-preview" *ngIf="budgetForm.get('targetAmount')?.value > 0">
            <mat-icon>preview</mat-icon>
            <div class="preview-content">
              <h4>Budget-Vorschau</h4>
              <div class="preview-item">
                <span class="preview-label">Monatliches Budget:</span>
                <span class="preview-value">{{ formatCurrency(budgetForm.get('targetAmount')?.value || 0) }}</span>
              </div>
              <div class="preview-item">
                <span class="preview-label">Tägliches Budget:</span>
                <span class="preview-value">{{ formatCurrency(getDailyBudget()) }}</span>
              </div>
              <div class="preview-item">
                <span class="preview-label">Wöchentliches Budget:</span>
                <span class="preview-value">{{ formatCurrency(getWeeklyBudget()) }}</span>
              </div>
            </div>
          </div>

          <!-- Form Status -->
          <div class="form-status" *ngIf="budgetForm.invalid && budgetForm.touched">
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
            [disabled]="!budgetForm.dirty"
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
            [disabled]="budgetForm.invalid || isSubmitting"
            class="submit-button"
          >
            <mat-icon>{{ data.isEdit ? 'save' : 'add' }}</mat-icon>
            {{ data.isEdit ? 'Speichern' : 'Erstellen' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./budget-form.component.scss']
})
export class BudgetFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<BudgetFormComponent>);
  public data = inject(MAT_DIALOG_DATA) as BudgetDialogData;

  budgetForm: FormGroup;
  isSubmitting = false;
  availableCategories: Category[] = [];

  monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  constructor() {
    this.budgetForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadAvailableCategories();

    if (this.data.isEdit && this.data.budget) {
      this.populateForm(this.data.budget);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      categoryId: ['', [Validators.required]],
      targetAmount: [null, [
        Validators.required,
        Validators.min(0.01),
        Validators.max(999999.99)
      ]]
    });
  }

  private loadAvailableCategories(): void {
    if (this.data.isEdit) {
      // For editing, show all categories including the selected one
      this.availableCategories = this.data.categories.filter(c => c.isActive);
    } else {
      // For creating, exclude categories that already have budgets for this period
      const existingCategoryIds = this.data.existingBudgets.map(b => b.categoryId);
      this.availableCategories = this.data.categories.filter(c =>
        c.isActive && !existingCategoryIds.includes(c.id)
      );
    }
  }

  private populateForm(budget: Budget): void {
    this.budgetForm.patchValue({
      categoryId: budget.categoryId,
      targetAmount: budget.targetAmount
    });
  }

  // Helper Methods
  getMonthName(monthIndex: number): string {
    return this.monthNames[monthIndex] || '';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
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
    const selectedCategory = this.availableCategories.find(c => c.id === formValue.categoryId);

    const budgetData: Partial<Budget> = {
      categoryId: formValue.categoryId,
      categoryName: selectedCategory?.name || '',
      targetAmount: formValue.targetAmount,
      month: this.data.month,
      year: this.data.year,
      isActive: true
    };

    // Simulate API call
    setTimeout(() => {
      this.isSubmitting = false;
      this.dialogRef.close({
        action: this.data.isEdit ? 'edit' : 'create',
        budget: budgetData
      });
    }, 500);
  }

  onCancel(): void {
    if (this.budgetForm.dirty) {
      const confirmLeave = confirm('Möchten Sie wirklich abbrechen? Ungespeicherte Änderungen gehen verloren.');
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
        targetAmount: null
      });
    }
    this.budgetForm.markAsUntouched();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.budgetForm.controls).forEach(key => {
      const control = this.budgetForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }
}

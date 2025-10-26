import { Component, OnInit, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { CategoryWithStats } from '../categories.component';

export interface CategoryFormData {
  category?: CategoryWithStats;
  existingNames: string[];
  mode: 'create' | 'edit';
}

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatRadioModule,
    MatCardModule,
    MatChipsModule
  ],
  templateUrl: './category-form.component.html',
  styleUrl: './category-form.component.scss'
})
export class CategoryFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CategoryFormComponent>);
  
  categoryForm: FormGroup;
  mode: 'create' | 'edit' = 'create';
  isSubmitting = false;
  existingNames: string[] = [];

  // Predefined options
  commonEmojis = [
    '💰', '💻', '📈', '🏪', '🎁', '💼', '🏦', '📊',
    '🍕', '🚗', '🎬', '💊', '🛍️', '📚', '🏠', '🛡️',
    '⚡', '🎮', '🏋️', '✈️', '📱', '🎵', '🍔', '☕',
    '🚇', '🏥', '📝', '🧾', '💡', '🔧', '🎯', '🌟'
  ];

  predefinedColors = [
    '#4caf50', '#2196f3', '#9c27b0', '#ff9800', '#f44336',
    '#e91e63', '#03dac6', '#ff5722', '#673ab7', '#795548',
    '#607d8b', '#009688', '#3f51b5', '#8bc34a', '#ffc107',
    '#ff4081', '#00bcd4', '#cddc39', '#ffeb3b', '#9e9e9e'
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CategoryFormData
  ) {
    this.mode = data.mode;
    this.existingNames = data.existingNames;

    this.categoryForm = this.fb.group({
      name: [
        data.category?.name || '', 
        [Validators.required, Validators.minLength(2), this.uniqueNameValidator.bind(this)]
      ],
      emoji: [data.category?.emoji || '💰', [Validators.required]],
      color: [data.category?.color || '#4caf50', [Validators.required]],
      type: [data.category?.type || 'expense', [Validators.required]],
      description: [data.category?.description || '']
    });
  }

  ngOnInit() {
    // Pre-select first available emoji if none selected
    if (!this.categoryForm.get('emoji')?.value) {
      this.categoryForm.patchValue({ emoji: this.commonEmojis[0] });
    }
  }

  // Custom validator for unique category names
  uniqueNameValidator(control: AbstractControl) {
    if (!control.value) return null;
    
    const normalizedValue = control.value.toLowerCase().trim();
    const isDuplicate = this.existingNames.includes(normalizedValue);
    
    return isDuplicate ? { uniqueName: { value: control.value } } : null;
  }

  getDialogTitle(): string {
    return this.mode === 'create' ? 'Neue Kategorie' : 'Kategorie bearbeiten';
  }

  getSubmitButtonText(): string {
    return this.mode === 'create' ? 'Erstellen' : 'Speichern';
  }

  onEmojiSelect(emoji: string) {
    this.categoryForm.patchValue({ emoji });
  }

  onColorSelect(color: string) {
    this.categoryForm.patchValue({ color });
  }

  getPreviewStyle() {
    return {
      'background-color': this.categoryForm.get('color')?.value,
      'color': this.getContrastColor(this.categoryForm.get('color')?.value)
    };
  }

  private getContrastColor(hexColor: string): string {
    // Convert hex to RGB
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  onSubmit() {
    if (this.categoryForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const formValue = this.categoryForm.value;
      const category = {
        ...formValue,
        name: formValue.name.trim()
      };

      // Simulate API call
      setTimeout(() => {
        this.dialogRef.close(category);
        this.isSubmitting = false;
      }, 800);
    } else {
      // Mark all fields as touched to show validation errors
      this.categoryForm.markAllAsTouched();
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  // Validation helper methods
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.categoryForm.get(fieldName);
    return !!(field?.hasError(errorType) && (field?.dirty || field?.touched));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.categoryForm.get(fieldName);
    
    if (field?.hasError('required')) {
      return 'Dieses Feld ist erforderlich';
    }
    
    if (fieldName === 'name') {
      if (field?.hasError('minlength')) {
        return 'Der Name muss mindestens 2 Zeichen lang sein';
      }
      if (field?.hasError('uniqueName')) {
        return 'Eine Kategorie mit diesem Namen existiert bereits';
      }
    }
    
    return '';
  }
}
import { Component, OnInit, inject } from '@angular/core';
import { BaseComponent } from '../shared/components/base.component';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';

// Import interfaces
export interface CSVRow {
  [key: string]: string;
}

export interface CSVPreview {
  headers: string[];
  rows: CSVRow[];
  totalRows: number;
}

export interface ColumnMapping {
  date?: string;
  amount?: string;
  description?: string;
  category?: string;
  account?: string;
}

export interface ImportOptions {
  targetAccountId: string;
  defaultCategoryId?: string;
  enableDuplicateCheck: boolean;
  dateFormat: string;
  amountFormat: string;
  skipFirstRow: boolean;
}

export interface ImportResult {
  total: number;
  successful: number;
  skipped: number;
  errors: number;
  errorDetails: ImportError[];
}

export interface ImportError {
  row: number;
  data: CSVRow;
  error: string;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  icon: string;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-import',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatChipsModule,
    MatCheckboxModule,
    MatDividerModule,
    MatSnackBarModule,
    RouterModule
  ],
  templateUrl: './import.component.html',
  styleUrl: './import.component.scss'
})
export class ImportComponent extends BaseComponent implements OnInit {
  protected componentKey = 'import';
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  // Make Object accessible in template
  Object = Object;

  // Helper method for template
  getObjectKeys(obj: Record<string, unknown>): string[] {
    return Object.keys(obj);
  }

  // Form groups for stepper
  uploadForm!: FormGroup;
  mappingForm!: FormGroup;
  optionsForm!: FormGroup;

  // Data properties
  csvPreview: CSVPreview | null = null;
  selectedFile: File | null = null;
  accounts: Account[] = [];
  categories: Category[] = [];
  
  // Import state
  isUploading = false;
  isParsing = false;
  isImporting = false;
  importResult: ImportResult | null = null;
  
  // Stepper state
  currentStep = 0;
  
  // Available options
  dateFormats = [
    { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY (31.12.2023)' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2023)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2023-12-31)' },
    { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (31-12-2023)' }
  ];
  
  amountFormats = [
    { value: 'de', label: 'Deutsch (1.234,56)' },
    { value: 'en', label: 'Englisch (1,234.56)' },
    { value: 'simple', label: 'Einfach (1234.56)' }
  ];

  // Table display columns
  previewColumns: string[] = [];
  displayedColumns: string[] = [];

  ngOnInit() {
    this.initializeForms();
    this.loadMockData();
  }

  private initializeForms() {
    this.uploadForm = this.fb.group({
      file: [null, [Validators.required]]
    });

    this.mappingForm = this.fb.group({
      dateColumn: ['', [Validators.required]],
      amountColumn: ['', [Validators.required]],
      descriptionColumn: ['', [Validators.required]],
      categoryColumn: [''],
      accountColumn: ['']
    });

    this.optionsForm = this.fb.group({
      targetAccountId: ['', [Validators.required]],
      defaultCategoryId: [''],
      enableDuplicateCheck: [true],
      dateFormat: ['DD.MM.YYYY', [Validators.required]],
      amountFormat: ['de', [Validators.required]],
      skipFirstRow: [true]
    });
  }

  private loadMockData() {
    // Mock accounts
    this.accounts = [
      { id: '1', name: 'Sparkasse Hauptkonto', type: 'checking', icon: '🏦', color: '#FF5722' },
      { id: '2', name: 'ING Tagesgeld', type: 'savings', icon: '🏛️', color: '#FF9800' },
      { id: '3', name: 'DKB Visa Card', type: 'credit_card', icon: '💳', color: '#2196F3' },
      { id: '4', name: 'Bargeld', type: 'cash', icon: '💵', color: '#4CAF50' }
    ];

    // Mock categories
    this.categories = [
      { id: '1', name: 'Lebensmittel', icon: '🛒', color: '#4CAF50' },
      { id: '2', name: 'Transport', icon: '🚗', color: '#2196F3' },
      { id: '3', name: 'Unterhaltung', icon: '🎬', color: '#FF9800' },
      { id: '4', name: 'Kleidung', icon: '👕', color: '#E91E63' },
      { id: '5', name: 'Gesundheit', icon: '🏥', color: '#00BCD4' },
      { id: '6', name: 'Restaurants', icon: '🍽️', color: '#FF5722' },
      { id: '7', name: 'Shopping', icon: '🛍️', color: '#673AB7' },
      { id: '8', name: 'Sonstiges', icon: '📦', color: '#607D8B' }
    ];
  }

  // File Upload Methods
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        this.snackBar.open('Bitte wählen Sie eine CSV-Datei aus.', 'Schließen', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.snackBar.open('Die Datei ist zu groß (max. 10MB).', 'Schließen', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        return;
      }
      
      this.selectedFile = file;
      this.uploadForm.patchValue({ file: file });
      this.parseCSVFile(file);
    }
  }

  private parseCSVFile(file: File) {
    this.isParsing = true;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        this.csvPreview = this.parseCSVText(csvText);
        this.setupPreviewTable();
        this.isParsing = false;
      } catch {
        this.isParsing = false;
        this.snackBar.open('Fehler beim Parsen der CSV-Datei.', 'Schließen', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    };
    
    reader.onerror = () => {
      this.isParsing = false;
      this.snackBar.open('Fehler beim Lesen der Datei.', 'Schließen', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    };
    
    reader.readAsText(file, 'UTF-8');
  }

  private parseCSVText(csvText: string): CSVPreview {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }
    
    // Parse header
    const headers = this.parseCSVLine(lines[0]);
    
    // Parse rows (first 20 for preview)
    const rows: CSVRow[] = [];
    const maxRows = Math.min(lines.length - 1, 20);
    
    for (let i = 1; i <= maxRows; i++) {
      if (i < lines.length) {
        const values = this.parseCSVLine(lines[i]);
        const row: CSVRow = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        rows.push(row);
      }
    }
    
    return {
      headers,
      rows,
      totalRows: lines.length - 1
    };
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private setupPreviewTable() {
    if (this.csvPreview) {
      this.previewColumns = this.csvPreview.headers;
      this.displayedColumns = this.csvPreview.headers.slice(0, 6); // Show first 6 columns
    }
  }

  // Navigation Methods
  nextStep() {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  // Import Process
  startImport() {
    if (!this.csvPreview || !this.selectedFile) {
      return;
    }
    
    this.isImporting = true;
    
    // Simulate import process
    setTimeout(() => {
      this.performImport();
      this.isImporting = false;
      this.currentStep = 3; // Move to results step
    }, 3000);
  }

  private performImport() {
    // Mock import results
    const totalRows = this.csvPreview?.totalRows || 0;
    const successful = Math.floor(totalRows * 0.85);
    const skipped = Math.floor(totalRows * 0.1);
    const errors = totalRows - successful - skipped;
    
    const errorDetails: ImportError[] = [];
    
    // Generate mock errors
    for (let i = 0; i < errors; i++) {
      errorDetails.push({
        row: i + 1,
        data: this.csvPreview?.rows[i] || {},
        error: 'Ungültiges Datumsformat'
      });
    }
    
    this.importResult = {
      total: totalRows,
      successful,
      skipped,
      errors,
      errorDetails
    };
  }

  // Helper Methods
  formatCurrency(amount: number): string {
    return this.formatUtils.formatCurrency(amount);
  }

  retry(): void {
    // Reload import data if needed
    console.log('Retry import operation');
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getAccountById(id: string): Account | undefined {
    return this.accounts.find(a => a.id === id);
  }

  getCategoryById(id: string): Category | undefined {
    return this.categories.find(c => c.id === id);
  }

  // Reset Methods
  resetImport() {
    this.currentStep = 0;
    this.csvPreview = null;
    this.selectedFile = null;
    this.importResult = null;
    this.uploadForm.reset();
    this.mappingForm.reset();
    this.optionsForm.patchValue({
      enableDuplicateCheck: true,
      dateFormat: 'DD.MM.YYYY',
      amountFormat: 'de',
      skipFirstRow: true
    });
  }

  downloadErrorReport() {
    if (!this.importResult || this.importResult.errorDetails.length === 0) {
      return;
    }
    
    // Generate CSV error report
    const headers = ['Zeile', 'Fehler', 'Daten'];
    const csvContent = [
      headers.join(','),
      ...this.importResult.errorDetails.map(error => 
        [
          error.row,
          `"${error.error}"`,
          `"${JSON.stringify(error.data)}"`
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'import-errors.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
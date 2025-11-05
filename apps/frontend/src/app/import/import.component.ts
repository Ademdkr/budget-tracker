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
import { AccountsApiService, Account } from '../accounts/accounts-api.service';
import { ApiService } from '../shared/services/api.service';

// Import interfaces
/**
 * Repräsentiert eine Zeile in einer CSV-Datei.
 *
 * Ein flexibles Objekt mit Schlüssel-Wert-Paaren, wobei die Schlüssel
 * den CSV-Spaltennamen entsprechen.
 */
export interface CSVRow {
  [key: string]: string;
}

/**
 * Vorschau-Daten einer geparseten CSV-Datei.
 *
 * Enthält die Kopfzeile, eine begrenzte Anzahl von Zeilen für die Vorschau
 * und die Gesamtanzahl der Zeilen in der Datei.
 */
export interface CSVPreview {
  /** Liste der Spaltennamen aus der CSV-Kopfzeile */
  headers: string[];

  /** Erste N Zeilen für die Vorschau (typischerweise 20) */
  rows: CSVRow[];

  /** Gesamtanzahl der Datenzeilen in der CSV-Datei */
  totalRows: number;
}

/**
 * Zuordnung von CSV-Spalten zu Transaktionsfeldern.
 *
 * Definiert, welche CSV-Spalte welchem Transaktionsfeld zugeordnet wird.
 */
export interface ColumnMapping {
  /** Name der Spalte für das Datum */
  date?: string;

  /** Name der Spalte für den Betrag */
  amount?: string;

  /** Name der Spalte für die Notiz/Beschreibung */
  note?: string;
}

/**
 * Optionen für den Import-Prozess.
 *
 * Konfiguriert, wie die CSV-Daten verarbeitet und importiert werden sollen.
 */
export interface ImportOptions {
  /** ID des Zielkontos für die importierten Transaktionen */
  targetAccountId: string;

  /** Format der Datumswerte in der CSV-Datei */
  dateFormat: string;

  /** Format der Beträge (Tausender- und Dezimaltrennzeichen) */
  amountFormat: string;

  /** Erste Zeile überspringen (Header-Zeile) */
  skipFirstRow: boolean;
}

/**
 * Ergebnis eines Import-Vorgangs.
 *
 * Enthält Statistiken über den Import und Details zu aufgetretenen Fehlern.
 */
export interface ImportResult {
  /** Gesamtanzahl der verarbeiteten Zeilen */
  total: number;

  /** Anzahl erfolgreich importierter Transaktionen */
  successful: number;

  /** Anzahl übersprungener Zeilen */
  skipped: number;

  /** Anzahl fehlgeschlagener Importe */
  errors: number;

  /** Detaillierte Fehlerinformationen */
  errorDetails: ImportError[];
}

/**
 * Fehlerbeschreibung für eine fehlgeschlagene Import-Zeile.
 *
 * Enthält die Zeilennummer, die Originaldaten und die Fehlermeldung.
 */
export interface ImportError {
  /** Zeilennummer in der CSV-Datei */
  row: number;

  /** Originaldaten der fehlgeschlagenen Zeile */
  data: CSVRow;

  /** Fehlermeldung mit Beschreibung des Problems */
  error: string;
}

/**
 * Komponente für den Import von Transaktionen aus CSV-Dateien.
 *
 * Diese Komponente bietet einen mehrstufigen Import-Prozess:
 * 1. Datei-Upload und CSV-Parsing
 * 2. Spalten-Zuordnung (Mapping von CSV-Spalten zu Transaktionsfeldern)
 * 3. Import-Optionen (Zielkonto, Datumsformat, etc.)
 * 4. Import-Ausführung und Ergebnisanzeige
 *
 * Features:
 * - CSV-Datei-Validierung (Format, Größe)
 * - Live-Vorschau der CSV-Daten
 * - Flexible Spalten-Zuordnung
 * - Verschiedene Datums- und Betragsformate
 * - Fehlerbehandlung und -reporting
 * - Download von Fehlerberichten
 *
 * @example
 * // Route zur Import-Komponente
 * { path: 'import', component: ImportComponent }
 */
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
    RouterModule,
  ],
  templateUrl: './import.component.html',
  styleUrl: './import.component.scss',
})
export class ImportComponent extends BaseComponent implements OnInit {
  /** Eindeutiger Schlüssel für die Komponente */
  protected componentKey = 'import';

  /** FormBuilder-Service für reaktive Formulare */
  private fb = inject(FormBuilder);

  /** SnackBar-Service für Benutzer-Benachrichtigungen */
  private snackBar = inject(MatSnackBar);

  /** API-Service für Konten-Operationen */
  private accountsApi = inject(AccountsApiService);

  /** Allgemeiner API-Service für HTTP-Anfragen */
  private api = inject(ApiService);

  // Make Object accessible in template
  /** Object-Referenz für Template-Zugriff */
  Object = Object;

  /**
   * Hilfsmethode für Template-Zugriff auf Objekt-Keys.
   *
   * @param {Record<string, unknown>} obj - Das Objekt, dessen Keys extrahiert werden sollen
   * @returns {string[]} Array der Objekt-Keys
   */
  getObjectKeys(obj: Record<string, unknown>): string[] {
    return Object.keys(obj);
  }

  // Form groups for stepper
  /** Formular für Datei-Upload (Schritt 1) */
  uploadForm!: FormGroup;

  /** Formular für Spalten-Zuordnung (Schritt 2) */
  mappingForm!: FormGroup;

  /** Formular für Import-Optionen (Schritt 3) */
  optionsForm!: FormGroup;

  // Data properties
  /** Vorschau der geparseten CSV-Daten */
  csvPreview: CSVPreview | null = null;

  /** Die ausgewählte CSV-Datei */
  selectedFile: File | null = null;

  /** Liste aller verfügbaren Konten */
  accounts: Account[] = [];

  // Import state
  /** Status: Datei wird hochgeladen */
  isUploading = false;

  /** Status: CSV wird geparst */
  isParsing = false;

  /** Status: Import läuft */
  isImporting = false;

  /** Ergebnis des letzten Imports */
  importResult: ImportResult | null = null;

  // Stepper state
  /** Aktueller Schritt im Stepper (0-3) */
  currentStep = 0;

  // Available options
  /** Verfügbare Datumsformate für die Auswahl */
  dateFormats = [
    { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY (31.12.2023)' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2023)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2023-12-31)' },
    { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (31-12-2023)' },
  ];

  /** Verfügbare Betragsformate für die Auswahl */
  amountFormats = [
    { value: 'de', label: 'Deutsch (1.234,56)' },
    { value: 'en', label: 'Englisch (1,234.56)' },
    { value: 'simple', label: 'Einfach (1234.56)' },
  ];

  // Table display columns
  /** Alle verfügbaren Spalten aus der CSV-Vorschau */
  previewColumns: string[] = [];

  /** Aktuell angezeigte Spalten in der Tabelle (begrenzt) */
  displayedColumns: string[] = [];

  /**
   * Angular Lifecycle Hook - wird nach der Initialisierung aufgerufen.
   *
   * Initialisiert die Formulare und lädt die verfügbaren Konten.
   *
   * @returns {void}
   */
  ngOnInit() {
    this.initializeForms();
    this.loadAccounts();
  }

  /**
   * Initialisiert alle reaktiven Formulare für den Import-Prozess.
   *
   * Erstellt drei FormGroups:
   * 1. uploadForm - Für Datei-Upload
   * 2. mappingForm - Für Spalten-Zuordnung
   * 3. optionsForm - Für Import-Optionen
   *
   * @private
   * @returns {void}
   */
  private initializeForms() {
    this.uploadForm = this.fb.group({
      file: [null, [Validators.required]],
    });

    this.mappingForm = this.fb.group({
      dateColumn: ['', [Validators.required]],
      amountColumn: ['', [Validators.required]],
      noteColumn: ['', [Validators.required]],
    });

    this.optionsForm = this.fb.group({
      targetAccountId: ['', [Validators.required]],
      dateFormat: ['DD.MM.YYYY', [Validators.required]],
      amountFormat: ['de', [Validators.required]],
      skipFirstRow: [true],
    });
  }

  /**
   * Lädt alle verfügbaren Konten vom Backend.
   *
   * Die Konten werden für die Auswahl des Zielkontos beim Import benötigt.
   * Bei Fehlern wird eine Snackbar-Benachrichtigung angezeigt.
   *
   * @private
   * @returns {void}
   */
  private loadAccounts() {
    this.accountsApi.getAll().subscribe({
      next: (accounts) => {
        this.accounts = accounts;
        console.log('Konten geladen:', accounts);
      },
      error: (error) => {
        console.error('Fehler beim Laden der Konten:', error);
        this.snackBar.open('Fehler beim Laden der Konten', 'Schließen', {
          duration: 3000,
        });
      },
    });
  }

  // File Upload Methods
  /**
   * Handler für Datei-Auswahl-Events.
   *
   * Validiert die ausgewählte Datei (Format, Größe) und startet bei Erfolg
   * das CSV-Parsing. Zeigt Fehlermeldungen an, wenn die Datei ungültig ist.
   *
   * Validierungen:
   * - Dateityp muss .csv sein
   * - Maximale Dateigröße: 10MB
   *
   * @param {Event} event - Das File-Input-Event
   * @returns {void}
   */
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        this.snackBar.open('Bitte wählen Sie eine CSV-Datei aus.', 'Schließen', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.snackBar.open('Die Datei ist zu groß (max. 10MB).', 'Schließen', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
        return;
      }

      this.selectedFile = file;
      this.uploadForm.patchValue({ file: file });
      this.parseCSVFile(file);
    }
  }

  /**
   * Parst eine CSV-Datei und erstellt eine Vorschau.
   *
   * Liest die Datei als Text, parst sie zeilenweise und erstellt ein
   * CSVPreview-Objekt mit Header und ersten 20 Zeilen für die Anzeige.
   *
   * @private
   * @param {File} file - Die zu parsende CSV-Datei
   * @returns {void}
   */
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
          panelClass: ['error-snackbar'],
        });
      }
    };

    reader.onerror = () => {
      this.isParsing = false;
      this.snackBar.open('Fehler beim Lesen der Datei.', 'Schließen', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
    };

    reader.readAsText(file, 'UTF-8');
  }

  /**
   * Parst den CSV-Text in ein strukturiertes Format.
   *
   * Extrahiert Header-Zeile und Datenzeilen. Erstellt ein CSVPreview-Objekt
   * mit den ersten 20 Zeilen für die Vorschau.
   *
   * @private
   * @param {string} csvText - Der rohe CSV-Text
   * @returns {CSVPreview} Strukturierte CSV-Daten mit Header und Zeilen
   * @throws {Error} Wenn die CSV-Datei leer ist
   */
  private parseCSVText(csvText: string): CSVPreview {
    const lines = csvText.split('\n').filter((line) => line.trim());
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
      totalRows: lines.length - 1,
    };
  }

  /**
   * Parst eine einzelne CSV-Zeile unter Berücksichtigung von Anführungszeichen.
   *
   * Behandelt korrekt:
   * - Komma-getrennte Werte
   * - Anführungszeichen-umschlossene Werte mit Kommas
   * - Escape-Sequenzen
   *
   * @private
   * @param {string} line - Die zu parsende CSV-Zeile
   * @returns {string[]} Array der extrahierten Werte
   */
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

  /**
   * Konfiguriert die Tabellen-Spalten für die CSV-Vorschau.
   *
   * Setzt previewColumns auf alle verfügbaren Spalten und displayedColumns
   * auf die ersten 6 Spalten für die initiale Anzeige.
   *
   * @private
   * @returns {void}
   */
  private setupPreviewTable() {
    if (this.csvPreview) {
      this.previewColumns = this.csvPreview.headers;
      this.displayedColumns = this.csvPreview.headers.slice(0, 6); // Show first 6 columns
    }
  }

  // Navigation Methods
  /**
   * Navigiert zum nächsten Schritt im Stepper.
   *
   * @returns {void}
   */
  nextStep() {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  /**
   * Navigiert zum vorherigen Schritt im Stepper.
   *
   * @returns {void}
   */
  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  // Import Process
  /**
   * Startet den Import-Prozess.
   *
   * Validiert die Voraussetzungen (CSV-Vorschau und Datei vorhanden),
   * setzt den Import-Status und führt nach einer Verzögerung den
   * tatsächlichen Import durch. Wechselt nach Abschluss zum Ergebnis-Schritt.
   *
   * @returns {void}
   */
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

  /**
   * Führt den tatsächlichen Import durch.
   *
   * Bereitet die Import-Daten aus der CSV-Vorschau auf, kombiniert sie
   * mit den Spalten-Zuordnungen und Optionen, und sendet sie an das Backend.
   * Verarbeitet die Antwort und zeigt Erfolgs-/Fehlermeldungen an.
   *
   * @private
   * @returns {void}
   */
  private performImport() {
    if (!this.csvPreview) {
      return;
    }

    const mapping = this.mappingForm.value;
    const options = this.optionsForm.value;

    // Prepare import data
    const importData = this.csvPreview.rows.map((row) => ({
      date: row[mapping.dateColumn],
      amount: parseFloat(row[mapping.amountColumn]),
      note: row[mapping.noteColumn] || '',
    }));

    const importRequest = {
      data: importData,
      mapping: {
        date: mapping.dateColumn,
        amount: mapping.amountColumn,
        note: mapping.noteColumn,
      },
      options: {
        targetAccountId: options.targetAccountId,
        dateFormat: options.dateFormat,
        amountFormat: options.amountFormat,
        skipFirstRow: options.skipFirstRow,
      },
    };

    // Call API
    this.api.post<ImportResult>('transactions/import', importRequest).subscribe({
      next: (result) => {
        this.importResult = result;
        this.isImporting = false;
        this.currentStep = 3;

        if (result.successful > 0) {
          this.snackBar.open(
            `${result.successful} Transaktionen erfolgreich importiert`,
            'Schließen',
            { duration: 5000 },
          );
        }
      },
      error: (error) => {
        console.error('Import-Fehler:', error);
        this.isImporting = false;
        this.snackBar.open(
          'Fehler beim Import: ' + (error.error?.message || error.message),
          'Schließen',
          { duration: 5000 },
        );
      },
    });
  }

  // Helper Methods
  /**
   * Formatiert einen Betrag als Währung.
   *
   * Nutzt den geerbten formatUtils-Service aus BaseComponent.
   *
   * @param {number} amount - Der zu formatierende Betrag
   * @returns {string} Der formatierte Währungsbetrag (z.B. "1.234,56 €")
   */
  formatCurrency(amount: number): string {
    return this.formatUtils.formatCurrency(amount);
  }

  /**
   * Wiederholt einen fehlgeschlagenen Import-Versuch.
   *
   * Diese Methode ist aktuell ein Platzhalter für zukünftige Funktionalität.
   *
   * @returns {void}
   */
  retry(): void {
    // Reload import data if needed
    console.log('Retry import operation');
  }

  /**
   * Formatiert eine Dateigröße in lesbares Format.
   *
   * Konvertiert Bytes in die passende Einheit (Bytes, KB, MB, GB).
   *
   * @param {number} bytes - Die Dateigröße in Bytes
   * @returns {string} Formatierte Dateigröße (z.B. "2.5 MB")
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Sucht ein Konto anhand seiner ID.
   *
   * @param {string} id - Die Konto-ID
   * @returns {Account | undefined} Das gefundene Konto oder undefined
   */
  getAccountById(id: string): Account | undefined {
    return this.accounts.find((a) => a.id === id);
  }

  // Reset Methods
  /**
   * Setzt den gesamten Import-Prozess zurück.
   *
   * Setzt alle Formulare, Status-Flags und temporären Daten auf ihre
   * Ausgangswerte zurück. Ermöglicht einen kompletten Neustart des
   * Import-Prozesses.
   *
   * @returns {void}
   */
  resetImport() {
    this.currentStep = 0;
    this.csvPreview = null;
    this.selectedFile = null;
    this.importResult = null;
    this.uploadForm.reset();
    this.mappingForm.reset();
    this.optionsForm.patchValue({
      dateFormat: 'DD.MM.YYYY',
      amountFormat: 'de',
      skipFirstRow: true,
    });
  }

  /**
   * Lädt einen Fehlerbericht als CSV-Datei herunter.
   *
   * Erstellt eine CSV-Datei mit allen Fehlerdetails aus dem Import-Ergebnis
   * und triggert einen automatischen Download im Browser. Die Datei enthält
   * Zeilennummer, Fehlermeldung und Originaldaten für jede fehlgeschlagene Zeile.
   *
   * @returns {void}
   */
  downloadErrorReport() {
    if (!this.importResult || this.importResult.errorDetails.length === 0) {
      return;
    }

    // Generate CSV error report
    const headers = ['Zeile', 'Fehler', 'Daten'];
    const csvContent = [
      headers.join(','),
      ...this.importResult.errorDetails.map((error) =>
        [error.row, `"${error.error}"`, `"${JSON.stringify(error.data)}"`].join(','),
      ),
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

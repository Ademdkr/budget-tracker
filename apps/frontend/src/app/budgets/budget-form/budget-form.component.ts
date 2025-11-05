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

/**
 * Budget-Interface für das Budget-Formular.
 *
 * Repräsentiert die Datenstruktur eines Budgets im Dialog-Kontext.
 */
export interface Budget {
  /** Eindeutige Budget-ID (optional bei Erstellung) */
  id?: string;

  /** ID der zugewiesenen Kategorie */
  categoryId: string;

  /** Name der zugewiesenen Kategorie */
  categoryName: string;

  /** Zielbetrag des Budgets in EUR */
  targetAmount: number;

  /** Monat (0-11, wobei 0 = Januar) */
  month: number;

  /** Jahr (z.B. 2024) */
  year: number;

  /** Status, ob das Budget aktiv ist */
  isActive: boolean;

  /** Zeitpunkt der Erstellung (optional) */
  createdAt?: Date;

  /** Zeitpunkt der letzten Aktualisierung (optional) */
  updatedAt?: Date;
}

/**
 * Kategorie-Interface für das Budget-Formular.
 *
 * Definiert die Struktur einer Kategorie, die für ein Budget ausgewählt werden kann.
 */
export interface Category {
  /** Eindeutige Kategorie-ID */
  id: string;

  /** Name der Kategorie */
  name: string;

  /** Icon-Name für die visuelle Darstellung */
  icon: string;

  /** Farbe der Kategorie (z.B. '#FF5733') */
  color: string;

  /** Status, ob die Kategorie aktiv ist */
  isActive: boolean;
}

/**
 * Datenstruktur für den Budget-Dialog.
 *
 * Enthält alle notwendigen Informationen, die an den Dialog übergeben werden.
 */
export interface BudgetDialogData {
  /** Das zu bearbeitende Budget (nur im Edit-Modus) */
  budget?: Budget;

  /** Liste aller verfügbaren Kategorien */
  categories: Category[];

  /** Liste der bereits existierenden Budgets für den Zeitraum */
  existingBudgets: Budget[];

  /** Monat für das neue Budget (0-11) */
  month: number;

  /** Jahr für das neue Budget */
  year: number;

  /** True = Bearbeiten, False = Neu erstellen */
  isEdit: boolean;
}

/**
 * Dialog-Komponente für das Erstellen und Bearbeiten von Budgets.
 *
 * Diese Komponente wird als Material Dialog geöffnet und ermöglicht es dem Benutzer,
 * ein neues Budget zu erstellen oder ein bestehendes zu bearbeiten. Sie bietet:
 * - Kategorieauswahl (gefiltert nach bereits zugewiesenen Budgets)
 * - Zielbetrag-Eingabe mit Validierung
 * - Berechnung von Tages- und Wochenbudgets
 * - Validierung und Fehlerbehandlung
 *
 * @example
 * // Dialog öffnen zum Erstellen eines neuen Budgets
 * this.dialog.open(BudgetFormComponent, {
 *   data: {
 *     categories: this.availableCategories,
 *     existingBudgets: this.budgets,
 *     month: 0,
 *     year: 2024,
 *     isEdit: false
 *   }
 * });
 */
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
  /** FormBuilder-Service für Formular-Erstellung */
  private fb = inject(FormBuilder);

  /** Referenz zum Dialog für Schließen und Rückgabewerte */
  private dialogRef = inject(MatDialogRef<BudgetFormComponent>);

  /** Vom Parent übergebene Dialog-Daten */
  public data = inject(MAT_DIALOG_DATA) as BudgetDialogData;

  /** Reaktives Formular für Budget-Eingabe */
  budgetForm: FormGroup;

  /** Status, ob das Formular gerade übermittelt wird */
  isSubmitting = false;

  /** Liste der verfügbaren Kategorien (gefiltert) */
  availableCategories: Category[] = [];

  /** Deutsche Monatsnamen für die Anzeige */
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

  /**
   * Konstruktor initialisiert das Formular.
   */
  constructor() {
    this.budgetForm = this.createForm();
  }

  /**
   * Angular Lifecycle Hook - wird nach der Initialisierung aufgerufen.
   *
   * Lädt die verfügbaren Kategorien (gefiltert nach bereits vorhandenen Budgets)
   * und füllt das Formular im Edit-Modus mit den bestehenden Budget-Daten.
   *
   * @returns {void}
   */
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

  /**
   * Erstellt das reaktive Formular mit Validierungen.
   *
   * Das Formular enthält zwei Felder:
   * - categoryId: Pflichtfeld für die Kategorieauswahl
   * - targetAmount: Pflichtfeld mit Min/Max-Validierung (0.01 - 999999.99 EUR)
   *
   * @private
   * @returns {FormGroup} Das konfigurierte FormGroup-Objekt
   */
  private createForm(): FormGroup {
    return this.fb.group({
      categoryId: ['', [Validators.required]],
      targetAmount: [null, [Validators.required, Validators.min(0.01), Validators.max(999999.99)]],
    });
  }

  /**
   * Lädt und filtert die verfügbaren Kategorien.
   *
   * Im Erstellungs-Modus werden Kategorien ausgeschlossen, die bereits ein Budget
   * für den aktuellen Zeitraum haben. Im Bearbeitungs-Modus werden alle aktiven
   * Kategorien angezeigt (inkl. der aktuell zugewiesenen).
   *
   * @private
   * @returns {void}
   */
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

  /**
   * Füllt das Formular mit Daten eines bestehenden Budgets (Edit-Modus).
   *
   * @private
   * @param {Budget} budget - Das zu bearbeitende Budget
   * @returns {void}
   */
  private populateForm(budget: Budget): void {
    this.budgetForm.patchValue({
      categoryId: budget.categoryId,
      targetAmount: budget.targetAmount,
    });
  }

  // Helper Methods
  /**
   * Gibt den deutschen Namen für einen Monatsindex zurück.
   *
   * @param {number} monthIndex - Der Monatsindex (0-11)
   * @returns {string} Der deutsche Monatsname (z.B. "Januar")
   */
  getMonthName(monthIndex: number): string {
    return this.monthNames[monthIndex] || '';
  }

  /**
   * Formatiert einen Betrag als Euro-Währung.
   *
   * @param {number} amount - Der zu formatierende Betrag
   * @returns {string} Der formatierte Betrag (z.B. "150,00 €")
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  /**
   * Berechnet das tägliche Budget basierend auf dem Zielbetrag.
   *
   * @returns {number} Der durchschnittliche Tagesbetrag in EUR
   */
  getDailyBudget(): number {
    const targetAmount = this.budgetForm.get('targetAmount')?.value || 0;
    const daysInMonth = this.getDaysInMonth(this.data.month, this.data.year);
    return targetAmount / daysInMonth;
  }

  /**
   * Berechnet das wöchentliche Budget basierend auf dem Zielbetrag.
   *
   * @returns {number} Der durchschnittliche Wochenbetrag in EUR (Tagesbetrag * 7)
   */
  getWeeklyBudget(): number {
    const targetAmount = this.budgetForm.get('targetAmount')?.value || 0;
    const daysInMonth = this.getDaysInMonth(this.data.month, this.data.year);
    return (targetAmount / daysInMonth) * 7;
  }

  /**
   * Ermittelt die Anzahl der Tage in einem bestimmten Monat.
   *
   * @private
   * @param {number} month - Der Monatsindex (0-11)
   * @param {number} year - Das Jahr (z.B. 2024)
   * @returns {number} Die Anzahl der Tage im Monat (28-31)
   */
  private getDaysInMonth(month: number, year: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  // Form Actions
  /**
   * Verarbeitet die Formular-Übermittlung.
   *
   * Validiert das Formular, erstellt ein Budget-Objekt und schließt den Dialog
   * mit den Budget-Daten. Im Edit-Modus wird die Aktion als 'edit', im
   * Erstellungs-Modus als 'create' markiert.
   *
   * @returns {void}
   */
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

  /**
   * Bricht die Formular-Bearbeitung ab und schließt den Dialog.
   *
   * Zeigt eine Bestätigungsmeldung an, falls das Formular geändert wurde (dirty).
   *
   * @returns {void}
   */
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

  /**
   * Setzt das Formular auf die Ursprungswerte zurück.
   *
   * Im Edit-Modus werden die ursprünglichen Budget-Daten wiederhergestellt,
   * im Erstellungs-Modus wird das Formular komplett geleert.
   *
   * @returns {void}
   */
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

  /**
   * Markiert alle Formular-Controls als berührt (touched).
   *
   * Dies aktiviert die Anzeige von Validierungsfehlern für alle Felder,
   * auch wenn sie noch nicht vom Benutzer fokussiert wurden.
   *
   * @private
   * @returns {void}
   */
  private markFormGroupTouched(): void {
    Object.keys(this.budgetForm.controls).forEach((key) => {
      const control = this.budgetForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }
}

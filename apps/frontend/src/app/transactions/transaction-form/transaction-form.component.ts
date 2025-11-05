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

/**
 * Formulardaten-Schnittstelle für Transaktions-Dialog
 */
export interface TransactionFormData {
  /** Zu bearbeitende Transaktion (nur im Edit-Modus) */
  transaction?: Transaction;
  /** Verfügbare Kategorien für Dropdown */
  categories: Category[];
  /** Formularmodus */
  mode: 'create' | 'edit';
}

/**
 * Transaktions-Formular-Komponente
 *
 * Dialog-Komponente zum Erstellen und Bearbeiten von Transaktionen.
 * Bietet Felder für Datum, Betrag, Kategorie und Notiz mit automatischer
 * Kategorie-Filterung nach Transaktionstyp.
 *
 * @example
 * ```typescript
 * const dialogRef = this.dialog.open(TransactionFormComponent, {
 *   width: '600px',
 *   data: {
 *     mode: 'create',
 *     categories: this.categories
 *   }
 * });
 * ```
 */
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
  /** FormBuilder zur Formular-Erstellung */
  private fb = inject(FormBuilder);
  /** Dialog-Referenz zum Schließen */
  private dialogRef = inject(MatDialogRef<TransactionFormComponent>);
  /** API-Service für Transaktionen */
  private transactionsApi = inject(TransactionsApiService);
  /** Service zur Konto-Auswahl */
  private accountSelectionService = inject(AccountSelectionService);
  /** Injizierte Formulardaten */
  public data = inject(MAT_DIALOG_DATA) as TransactionFormData;

  /** Reaktives Formular für Transaktion */
  transactionForm!: FormGroup;
  /** Verfügbare Kategorien */
  categories: Category[] = [];
  /** Formularmodus (erstellen oder bearbeiten) */
  mode: 'create' | 'edit' = 'create';
  /** Gibt an, ob Formular gerade übermittelt wird */
  isSubmitting = false;

  /** Gefilterte Kategorien basierend auf Transaktionstyp */
  filteredCategories: Category[] = [];

  constructor() {}

  /**
   * Initialisiert Formular mit injizierten Daten
   *
   * Erstellt ReactiveForm mit Validatoren, füllt Felder im Edit-Modus
   * und richtet Formular-Subscriptions ein.
   */
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

  /**
   * Richtet Formular-Subscriptions ein
   *
   * Lädt initial gefilterte Kategorien.
   *
   * @private
   */
  private setupFormSubscriptions() {
    // Kategorien initial laden
    this.filterCategories();
  }

  /**
   * Filtert Kategorien (aktuell keine Filterung)
   *
   * Zeigt alle Kategorien an, da Schema kein type-Feld hat.
   *
   * @private
   */
  private filterCategories() {
    // Zeige alle Kategorien, da das Schema kein type-Feld hat
    this.filteredCategories = [...this.categories];
  }

  /**
   * Gibt Dialog-Titel basierend auf Modus zurück
   *
   * @returns 'Neue Transaktion' oder 'Transaktion bearbeiten'
   */
  getDialogTitle(): string {
    return this.mode === 'create' ? 'Neue Transaktion' : 'Transaktion bearbeiten';
  }

  /**
   * Gibt Submit-Button-Text basierend auf Modus zurück
   *
   * @returns 'Hinzufügen' oder 'Speichern'
   */
  getSubmitButtonText(): string {
    return this.mode === 'create' ? 'Hinzufügen' : 'Speichern';
  }

  /**
   * Gibt Emoji für ausgewählte Kategorie zurück
   *
   * @param categoryId - Kategorie-ID
   * @returns Emoji oder Icon der Kategorie, oder leerer String
   */
  getCategoryEmoji(categoryId: string): string {
    const category = this.categories.find((c) => c.id === categoryId);
    return category?.emoji || category?.icon || '';
  }

  /**
   * Gibt Transaktionstyp der ausgewählten Kategorie zurück
   *
   * @returns 'INCOME', 'EXPENSE' oder null wenn keine Kategorie ausgewählt
   */
  getSelectedCategoryType(): 'INCOME' | 'EXPENSE' | null {
    const selectedCategoryId = this.transactionForm.get('category')?.value;
    if (!selectedCategoryId) return null;

    const category = this.categories.find((c) => c.id === selectedCategoryId);
    return category?.transactionType || null;
  }

  /**
   * Übermittelt Formular und erstellt/aktualisiert Transaktion
   *
   * Validiert Formular, leitet Transaktionstyp von Kategorie ab,
   * erstellt oder aktualisiert Transaktion über API und schließt Dialog.
   */
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

  /**
   * Bricht Formular ab und schließt Dialog ohne Änderungen
   */
  onCancel() {
    this.dialogRef.close();
  }

  // Validation helper methods
  /**
   * Prüft ob Feld spezifischen Validierungsfehler hat
   *
   * @param fieldName - Name des Formular-Felds
   * @param errorType - Typ des Validierungsfehlers (z.B. 'required', 'min')
   * @returns true wenn Feld den Fehler hat und touched/dirty ist
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.transactionForm.get(fieldName);
    return !!(field?.hasError(errorType) && (field?.dirty || field?.touched));
  }

  /**
   * Gibt benutzerfreundliche Fehlermeldung für Feld zurück
   *
   * Übersetzt Angular-Validierungsfehler in deutsche Fehlermeldungen.
   *
   * @param fieldName - Name des Formular-Felds
   * @returns Deutsche Fehlermeldung oder leerer String
   */
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

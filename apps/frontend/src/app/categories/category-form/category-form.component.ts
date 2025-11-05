import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
} from '@angular/forms';
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

/**
 * Formulardaten-Schnittstelle für Kategorie-Dialog
 */
export interface CategoryFormData {
  /** Zu bearbeitende Kategorie (nur im Edit-Modus) */
  category?: CategoryWithStats;
  /** Liste bereits vorhandener Kategorienamen (für Validierung) */
  existingNames: string[];
  /** Formularmodus */
  mode: 'create' | 'edit';
}

/**
 * Kategorie-Formular-Komponente
 *
 * Dialog-Komponente zum Erstellen und Bearbeiten von Kategorien.
 * Bietet Felder für Name, Beschreibung, Typ, Emoji und Farbe mit Validierung.
 *
 * @example
 * ```typescript
 * const dialogRef = this.dialog.open(CategoryFormComponent, {
 *   width: '500px',
 *   data: {
 *     mode: 'create',
 *     existingNames: ['Gehalt', 'Einkauf']
 *   }
 * });
 * ```
 */
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
    MatChipsModule,
  ],
  templateUrl: './category-form.component.html',
  styleUrl: './category-form.component.scss',
})
export class CategoryFormComponent implements OnInit {
  /** FormBuilder zur Formular-Erstellung */
  private fb = inject(FormBuilder);
  /** Dialog-Referenz zum Schließen */
  private dialogRef = inject(MatDialogRef<CategoryFormComponent>);
  /** Injizierte Formulardaten */
  public data = inject(MAT_DIALOG_DATA) as CategoryFormData;

  /** Reaktives Formular für Kategorie */
  categoryForm!: FormGroup;
  /** Formularmodus (erstellen oder bearbeiten) */
  mode: 'create' | 'edit' = 'create';
  /** Gibt an, ob Formular gerade übermittelt wird */
  isSubmitting = false;
  /** Liste bereits vorhandener Kategorienamen */
  existingNames: string[] = [];

  // Predefined options
  /** Häufig verwendete Emojis für Kategorien */
  commonEmojis = [
    '💰',
    '💻',
    '📈',
    '🏪',
    '🎁',
    '💼',
    '🏦',
    '📊',
    '🍕',
    '🚗',
    '🎬',
    '💊',
    '🛍️',
    '📚',
    '🏠',
    '🛡️',
    '⚡',
    '🎮',
    '🏋️',
    '✈️',
    '📱',
    '🎵',
    '🍔',
    '☕',
    '🚇',
    '🏥',
    '📝',
    '🧾',
    '💡',
    '🔧',
    '🎯',
    '🌟',
  ];

  /** Vordefinierte Farbpalette für Kategorien */
  predefinedColors = [
    '#4caf50',
    '#2196f3',
    '#9c27b0',
    '#ff9800',
    '#f44336',
    '#e91e63',
    '#03dac6',
    '#ff5722',
    '#673ab7',
    '#795548',
    '#607d8b',
    '#009688',
    '#3f51b5',
    '#8bc34a',
    '#ffc107',
    '#ff4081',
    '#00bcd4',
    '#cddc39',
    '#ffeb3b',
    '#9e9e9e',
  ];

  constructor() {}

  /**
   * Initialisiert Formular mit injizierten Daten
   *
   * Erstellt ReactiveForm mit Validatoren und füllt Felder
   * im Edit-Modus mit vorhandenen Kategorie-Daten.
   */
  ngOnInit() {
    // Initialize from injected data
    const data = this.data;
    this.mode = data.mode;
    this.existingNames = data.existingNames;

    this.categoryForm = this.fb.group({
      name: [
        data.category?.name || '',
        [Validators.required, Validators.minLength(2), this.uniqueNameValidator.bind(this)],
      ],
      emoji: [data.category?.emoji || '💰', [Validators.required]],
      color: [data.category?.color || '#4caf50', [Validators.required]],
      type: [data.category?.type || 'expense', [Validators.required]],
      description: [data.category?.description || ''],
    });

    // Pre-select first available emoji if none selected
    if (!this.categoryForm.get('emoji')?.value) {
      this.categoryForm.patchValue({ emoji: this.commonEmojis[0] });
    }
  }

  /**
   * Custom Validator für eindeutige Kategorienamen
   *
   * Prüft ob der eingegebene Name bereits in der Liste existierender
   * Kategorienamen vorhanden ist (case-insensitive).
   *
   * @param control - FormControl mit dem zu validierenden Namen
   * @returns Validation Error Objekt oder null bei gültigem Namen
   */
  uniqueNameValidator(control: AbstractControl) {
    if (!control.value) return null;

    const normalizedValue = control.value.toLowerCase().trim();
    const isDuplicate = this.existingNames.includes(normalizedValue);

    return isDuplicate ? { uniqueName: { value: control.value } } : null;
  }

  /**
   * Gibt Dialog-Titel basierend auf Modus zurück
   *
   * @returns 'Neue Kategorie' oder 'Kategorie bearbeiten'
   */
  getDialogTitle(): string {
    return this.mode === 'create' ? 'Neue Kategorie' : 'Kategorie bearbeiten';
  }

  /**
   * Gibt Submit-Button-Text basierend auf Modus zurück
   *
   * @returns 'Erstellen' oder 'Speichern'
   */
  getSubmitButtonText(): string {
    return this.mode === 'create' ? 'Erstellen' : 'Speichern';
  }

  /**
   * Wählt Emoji aus und aktualisiert Formular
   *
   * @param emoji - Ausgewähltes Emoji
   */
  onEmojiSelect(emoji: string) {
    this.categoryForm.patchValue({ emoji });
  }

  /**
   * Wählt Farbe aus und aktualisiert Formular
   *
   * @param color - Ausgewählte Farbe (HEX-Code)
   */
  onColorSelect(color: string) {
    this.categoryForm.patchValue({ color });
  }

  /**
   * Generiert Preview-Styles mit ausgewählter Farbe
   *
   * Berechnet Hintergrundfarbe und Kontrastfarbe für Text basierend
   * auf der gewählten Kategoriefarbe.
   *
   * @returns Style-Objekt mit background-color und color
   */
  getPreviewStyle() {
    return {
      'background-color': this.categoryForm.get('color')?.value,
      color: this.getContrastColor(this.categoryForm.get('color')?.value),
    };
  }

  /**
   * Berechnet Kontrastfarbe (Schwarz/Weiß) für lesbare Textdarstellung
   *
   * Konvertiert HEX-Farbe zu RGB, berechnet Luminanz und gibt basierend
   * darauf die optimal lesbare Textfarbe zurück.
   *
   * @private
   * @param hexColor - HEX-Farbcode (z.B. #4caf50)
   * @returns '#000000' für helle Hintergründe, '#ffffff' für dunkle
   */
  private getContrastColor(hexColor: string): string {
    // Convert hex to RGB
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  /**
   * Übermittelt Formular und schließt Dialog
   *
   * Validiert Formular, trimmt Werte und gibt Kategorie-Daten
   * an aufrufende Komponente zurück. Zeigt Validierungsfehler an
   * wenn Formular ungültig ist.
   */
  onSubmit() {
    if (this.categoryForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const formValue = this.categoryForm.value;
      const category = {
        ...formValue,
        name: formValue.name.trim(),
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
   * @param errorType - Typ des Validierungsfehlers (z.B. 'required', 'uniqueName')
   * @returns true wenn Feld den Fehler hat und touched/dirty ist
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.categoryForm.get(fieldName);
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

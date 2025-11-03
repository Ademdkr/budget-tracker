# HTML Structure Standards - Budget Tracker Frontend

## Übersicht

Dieses Dokument definiert die einheitlichen HTML-Struktur-Standards für alle Komponenten im Budget Tracker Frontend.

## Grundlegende Struktur

Jede Komponente soll folgende konsistente Struktur haben:

```html
<div class="[component-name]-container">
  <!-- 1. Header Section -->
  <div class="[component-name]-header">
    <div class="header-content">
      <h1 class="page-title">
        <mat-icon>[component-icon]</mat-icon>
        [Component Title]
        <span *ngIf="getSelectedAccountName()" class="account-filter-badge">
          für {{ getSelectedAccountName() }}
          <button
            mat-icon-button
            (click)="clearAccountFilter()"
            matTooltip="Account-Filter entfernen"
            class="clear-filter-btn"
          >
            <mat-icon>close</mat-icon>
          </button>
        </span>
      </h1>
      <div class="header-actions">
        <!-- Primary actions buttons -->
      </div>
    </div>
    <p class="[component-name]-subtitle">
      [Component description]
      <span *ngIf="hasAccountSelection()"> - Gefiltert nach ausgewähltem Konto</span>
    </p>
  </div>

  <!-- 2. State Sections (Loading, Error, Empty) -->
  <!-- Loading State -->
  <div *ngIf="isLoading" class="loading-container">
    <mat-card class="loading-card">
      <mat-card-content>
        <div class="loading-content">
          <mat-spinner diameter="50"></mat-spinner>
          <p>[Component] werden geladen...</p>
        </div>
      </mat-card-content>
    </mat-card>
  </div>

  <!-- Error State -->
  <div *ngIf="hasError" class="error-container">
    <mat-card class="error-card">
      <mat-card-content>
        <div class="error-content">
          <mat-icon class="error-icon">error_outline</mat-icon>
          <h3>Fehler beim Laden</h3>
          <p>Die [Component] konnten nicht geladen werden.</p>
          <button mat-raised-button color="primary" (click)="retry()">
            <mat-icon>refresh</mat-icon>
            Erneut versuchen
          </button>
        </div>
      </mat-card-content>
    </mat-card>
  </div>

  <!-- Empty State -->
  <div *ngIf="isEmpty && !isLoading && !hasError" class="empty-container">
    <mat-card class="empty-card">
      <mat-card-content>
        <div class="empty-content">
          <mat-icon class="empty-icon">[empty-icon]</mat-icon>
          <h3>[Empty State Title]</h3>
          <p>[Empty State Description]</p>
          <button mat-raised-button color="primary" (click)="[primaryAction]()">
            <mat-icon>add</mat-icon>
            [Primary Action Text]
          </button>
        </div>
      </mat-card-content>
    </mat-card>
  </div>

  <!-- 3. Main Content -->
  <div *ngIf="!isLoading && !hasError && !isEmpty" class="[component-name]-content">
    <!-- Component specific content -->
  </div>
</div>
```

## CSS-Klassen-Namenskonvention

### Container-Klassen

- `[component-name]-container` - Haupt-Container der Komponente
- `[component-name]-header` - Header-Bereich
- `[component-name]-content` - Haupt-Content-Bereich

### Header-Klassen

- `header-content` - Content-Wrapper im Header
- `page-title` - Haupttitel der Seite
- `account-filter-badge` - Badge für Account-Filter
- `clear-filter-btn` - Button zum Entfernen des Filters
- `header-actions` - Container für Action-Buttons
- `[component-name]-subtitle` - Untertitel

### State-Klassen

- `loading-container` - Container für Loading-State
- `loading-card` - Card für Loading-State
- `loading-content` - Content für Loading-State
- `error-container` - Container für Error-State
- `error-card` - Card für Error-State
- `error-content` - Content für Error-State
- `error-icon` - Icon für Error-State
- `empty-container` - Container für Empty-State
- `empty-card` - Card für Empty-State
- `empty-content` - Content für Empty-State
- `empty-icon` - Icon für Empty-State

### Content-Klassen

- `table-card` - Card für Tabellen
- `table-container` - Container für Tabellen
- `[items]-grid` - Grid-Layout für Items (z.B. accounts-grid)
- `filter-card` - Card für Filter
- `summary-card` - Card für Zusammenfassungen

## Form-Standards

### Grundstruktur

```html
<div class="[form-name]-form-container">
  <div class="form-header">
    <h2 mat-dialog-title>
      <mat-icon>{{ mode === 'create' ? 'add' : 'edit' }}</mat-icon>
      {{ getDialogTitle() }}
    </h2>
  </div>

  <mat-dialog-content class="form-content">
    <form [formGroup]="[formName]Form" class="[form-name]-form">
      <div class="form-section">
        <h3 class="section-title">[Section Title]</h3>
        <div class="form-row">
          <!-- Form fields -->
        </div>
      </div>
    </form>
  </mat-dialog-content>

  <mat-dialog-actions class="form-actions">
    <!-- Action buttons -->
  </mat-dialog-actions>
</div>
```

### Form-Klassen

- `[form-name]-form-container` - Haupt-Container des Formulars
- `form-header` - Header-Bereich des Formulars
- `form-content` - Content-Bereich des Formulars
- `form-section` - Sektion innerhalb des Formulars
- `section-title` - Titel einer Sektion
- `form-row` - Zeile mit Form-Feldern
- `form-actions` - Container für Action-Buttons

## Icons und Farben

### Standard-Icons pro Komponente

- **Dashboard**: `dashboard`
- **Transactions**: `receipt_long`
- **Accounts**: `account_balance_wallet`
- **Categories**: `category`
- **Budgets**: `pie_chart`
- **Import**: `upload_file`

### Standard-Farben für States

- **Loading**: Primary Color
- **Error**: Warn Color (`error_outline` Icon)
- **Success**: Accent Color
- **Empty**: Disabled Color

## Responsive Verhalten

### Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Grid-Layouts

```scss
.accounts-grid,
.categories-grid,
.budgets-grid {
  display: grid;
  gap: 1rem;

  // Mobile: 1 Spalte
  grid-template-columns: 1fr;

  // Tablet: 2 Spalten
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  // Desktop: 3 Spalten
  @media (min-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

## Accessibility Standards

### ARIA Labels

- Verwende `matTooltip` für interaktive Elemente
- Verwende `mat-label` für Form-Felder
- Verwende `aria-label` für Icon-Buttons ohne Text

### Keyboard Navigation

- Alle interaktiven Elemente müssen mit Tab erreichbar sein
- Enter und Space müssen bei Buttons funktionieren
- Escape soll Modal-Dialoge schließen

## Best Practices

1. **Konsistenz**: Verwende immer die gleichen Klassen-Namen für ähnliche Funktionen
2. **Semantic HTML**: Nutze semantische HTML-Elemente wo möglich (`<main>`, `<section>`, `<header>`)
3. **Material Design**: Folge den Material Design Guidelines für Spacing und Layout
4. **Performance**: Verwende `trackBy` Funktionen für `*ngFor` Schleifen
5. **Loading States**: Zeige immer Loading-Zustände für asynchrone Operationen
6. **Error Handling**: Biete immer eine Retry-Option bei Fehlern
7. **Empty States**: Leite Benutzer zu einer sinnvollen Aktion bei leeren Zuständen

## Validierung

Jede neue Komponente sollte gegen diese Standards geprüft werden:

- [ ] Container-Struktur korrekt implementiert
- [ ] Header-Sektion mit allen erforderlichen Elementen
- [ ] Loading-, Error- und Empty-States implementiert
- [ ] CSS-Klassen folgen der Namenskonvention
- [ ] Responsive Design implementiert
- [ ] Accessibility Standards erfüllt
- [ ] trackBy Funktionen für Listen implementiert

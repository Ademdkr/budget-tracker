import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Root-Komponente der Anwendung
 *
 * Funktionalität:
 * - Haupt-Entry-Point der Angular-Anwendung
 * - Hostet den Router-Outlet für alle Routen
 * - Minimalistisches Design ohne eigene Logik
 *
 * Template:
 * - Enthält nur <router-outlet> für dynamisches Routing
 *
 * @example
 * ```typescript
 * // In main.ts
 * bootstrapApplication(AppComponent, appConfig)
 *   .catch(err => console.error(err));
 * ```
 */
@Component({
  /** Selektor für die Root-Komponente */
  selector: 'app-root',
  /** Standalone-Komponente ohne NgModule */
  standalone: true,
  /** Import des RouterOutlet für Routing */
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  /** Anwendungstitel */
  title = 'Budget Tracker';
}

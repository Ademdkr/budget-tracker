import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

/**
 * Haupt-Entry-Point der Angular-Anwendung
 *
 * Bootstrapped die AppComponent mit appConfig
 * Fehlerbehandlung über console.error
 *
 * @example
 * ```typescript
 * // Wird automatisch beim Start der Anwendung ausgeführt
 * // Konfiguriert durch angular.json
 * ```
 */
bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));

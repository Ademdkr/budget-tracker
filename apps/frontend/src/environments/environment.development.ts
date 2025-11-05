/**
 * Entwicklungs-Umgebungskonfiguration
 *
 * Wird für lokale Entwicklung verwendet
 * API-Endpunkt zeigt auf lokales NestJS Backend
 */
export const environment = {
  /** Flag für Produktionsumgebung (false in Entwicklung) */
  production: false,
  /** Base-URL für API-Calls (Lokales NestJS Backend) */
  // Lokales NestJS Backend für Entwicklung
  apiBaseUrl: 'http://localhost:3001/api',
};

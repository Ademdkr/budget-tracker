/**
 * Produktions-Umgebungskonfiguration
 *
 * Wird für Production-Builds verwendet
 * API-Endpunkt zeigt auf Cloudflare Worker
 */
export const environment = {
  /** Flag für Produktionsumgebung */
  production: true,
  /** Base-URL für API-Calls (Cloudflare Worker) */
  apiBaseUrl: 'https://api.budget-tracker.ademdokur.dev/api',
};

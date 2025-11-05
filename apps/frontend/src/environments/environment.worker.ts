/**
 * Worker-Umgebungskonfiguration
 *
 * Für lokales Testing gegen Production API
 * Ermöglicht lokale Entwicklung mit Cloudflare Worker Backend
 */
// Environment for testing with Cloudflare Worker (Production API)
export const environment = {
  /** Flag für Produktionsumgebung (false beim Testing) */
  production: false,
  /** Base-URL für API-Calls (Cloudflare Worker für lokales Testing) */
  // Cloudflare Worker API für lokales Testing gegen Production
  apiBaseUrl: 'https://budget-tracker-worker.adem-dokur.workers.dev/api',
};

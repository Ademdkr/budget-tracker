import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { neon } from '@neondatabase/serverless';
import { registerAuthRoutes } from './routes/auth';
import { registerAccountRoutes } from './routes/accounts';
import { registerCategoryRoutes } from './routes/categories';
import { registerBudgetRoutes } from './routes/budgets';
import { registerTransactionRoutes } from './routes/transactions';

/**
 * Cloudflare Worker Environment-Variablen
 */
type Env = {
  /** Neon PostgreSQL Datenbank-URL */
  DATABASE_URL: string;
  /** Optionale Environment-Bezeichnung (z.B. 'production', 'staging') */
  ENVIRONMENT?: string;
};

/**
 * Cloudflare Worker Entry Point
 *
 * Funktionalität:
 * - Hono Framework für API-Routing
 * - Neon Serverless PostgreSQL Integration
 * - CORS-Konfiguration für Frontend-Zugriff
 * - REST API-Endpoints für Budget-Tracker
 * - Health-Check Endpoints
 *
 * Features:
 * - Serverless Edge Computing
 * - Automatisches DB-Connection-Pooling
 * - Multi-Origin CORS Support
 * - Modulares Routing-System
 *
 * Endpoints:
 * - GET /: Root Health-Check
 * - GET /api/health: Detaillierter Health-Status
 * - /api/auth/*: Authentifizierungs-Endpoints
 * - /api/accounts/*: Konten-Verwaltung
 * - /api/categories/*: Kategorien-Verwaltung
 * - /api/budgets/*: Budget-Verwaltung
 * - /api/transactions/*: Transaktions-Verwaltung
 *
 * @example
 * ```bash
 * # Lokal testen mit Wrangler
 * wrangler dev
 *
 * # Deployen zu Cloudflare
 * wrangler deploy
 * ```
 */
export default {
  /**
   * Fetch-Handler für Worker-Requests
   *
   * @param req - Eingehender HTTP-Request
   * @param env - Environment-Variablen
   * @param ctx - Execution Context
   * @returns HTTP-Response
   */
  fetch: async (req: Request, env: Env, ctx: ExecutionContext) => {
    const app = new Hono<{ Bindings: Env }>();

    // Validierung der DATABASE_URL
    if (!env.DATABASE_URL) {
      return new Response('DATABASE_URL environment variable is not set', { status: 500 });
    }

    // Neon PostgreSQL Client initialisieren
    const sql = neon(env.DATABASE_URL);

    // CORS-Konfiguration für Frontend-Zugriff
    app.use(
      '/*',
      cors({
        origin: [
          'https://budget-tracker-frontend.pages.dev', // Production
          'https://7c847dee.budget-tracker-frontend.pages.dev', // Preview
          'http://localhost:4201', // Local Development
        ],
        allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
        exposeHeaders: ['Content-Length'],
        maxAge: 600,
        credentials: true,
      }),
    );

    // Root Health-Check
    app.get('/', (c) => c.text('Budget Tracker API - Running!'));
    
    // API Health-Check mit Details
    app.get('/api/health', (c) =>
      c.json({
        status: 'ok',
        service: 'Budget Tracker API',
        ts: new Date().toISOString(),
        environment: env.ENVIRONMENT || 'production',
      }),
    );

    // Feature-Module registrieren
    registerAuthRoutes(app, sql);
    registerAccountRoutes(app, sql);
    registerCategoryRoutes(app, sql);
    registerBudgetRoutes(app, sql);
    registerTransactionRoutes(app, sql);

    return app.fetch(req, env, ctx);
  },
};

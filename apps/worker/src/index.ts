import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { neon } from '@neondatabase/serverless';
import { registerAuthRoutes } from './routes/auth';
import { registerAccountRoutes } from './routes/accounts';
import { registerCategoryRoutes } from './routes/categories';
import { registerBudgetRoutes } from './routes/budgets';
import { registerTransactionRoutes } from './routes/transactions';

type Env = {
  DATABASE_URL: string;
  ENVIRONMENT?: string;
};

export default {
  fetch: async (req: Request, env: Env, ctx: ExecutionContext) => {
    const app = new Hono<{ Bindings: Env }>();

    if (!env.DATABASE_URL) {
      return new Response('DATABASE_URL environment variable is not set', { status: 500 });
    }

    const sql = neon(env.DATABASE_URL);

    app.use(
      '/*',
      cors({
        origin: [
          'https://budget-tracker-frontend.pages.dev',
          'https://7c847dee.budget-tracker-frontend.pages.dev',
          'http://localhost:4201',
        ],
        allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
        exposeHeaders: ['Content-Length'],
        maxAge: 600,
        credentials: true,
      }),
    );

    app.get('/', (c) => c.text('Budget Tracker API - Running!'));
    app.get('/api/health', (c) =>
      c.json({
        status: 'ok',
        service: 'Budget Tracker API',
        ts: new Date().toISOString(),
        environment: env.ENVIRONMENT || 'production',
      }),
    );

    registerAuthRoutes(app, sql);
    registerAccountRoutes(app, sql);
    registerCategoryRoutes(app, sql);
    registerBudgetRoutes(app, sql);
    registerTransactionRoutes(app, sql);

    return app.fetch(req, env, ctx);
  },
};

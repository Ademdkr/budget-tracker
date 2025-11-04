import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { neon } from '@neondatabase/serverless';

type Env = { 
  DATABASE_URL: string;
  ENVIRONMENT?: string;
};

export default {
  fetch: async (req: Request, env: Env, ctx: ExecutionContext) => {
    const app = new Hono<{ Bindings: Env }>();
    const sql = neon(env.DATABASE_URL);

    // CORS für Cloudflare Pages Frontend
    app.use('/*', cors({
      origin: ['https://budget-tracker-frontend.pages.dev', 'https://7c847dee.budget-tracker-frontend.pages.dev', 'http://localhost:4201'],
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
      exposeHeaders: ['Content-Length'],
      maxAge: 600,
      credentials: true,
    }));

    app.get('/', (c) => c.text('Budget Tracker API - Running!'));
    app.get('/api/health', (c) => c.json({ 
      status: 'ok', 
      service: 'Budget Tracker API',
      ts: new Date().toISOString(),
      environment: env.ENVIRONMENT || 'production'
    }));

    app.get('/api/budgets', async (c) => {
      const rows = await sql`SELECT * FROM "Budget" ORDER BY "createdAt" DESC`;
      return c.json(rows);
    });
    app.post('/api/budgets', async (c) => {
      const body = await c.req.json<{ name: string }>();
      const created = await sql`
        INSERT INTO "Budget" (id, name, "totalAmount", spent, "createdAt", "updatedAt") 
        VALUES (gen_random_uuid(), ${body.name}, 0, 0, NOW(), NOW()) 
        RETURNING *
      `;
      return c.json(created[0], 201);
    });
    app.patch('/api/budgets/:id', async (c) => {
      const { id } = c.req.param();
      const body = await c.req.json<{ name: string }>();
      const updated = await sql`
        UPDATE "Budget" 
        SET name = ${body.name}, "updatedAt" = NOW() 
        WHERE id = ${id} 
        RETURNING *
      `;
      return c.json(updated[0]);
    });
    app.delete('/api/budgets/:id', async (c) => {
      const { id } = c.req.param();
      await sql`DELETE FROM "Budget" WHERE id = ${id}`;
      return c.json({ ok: true });
    });

    return app.fetch(req, env, ctx);
  },
};

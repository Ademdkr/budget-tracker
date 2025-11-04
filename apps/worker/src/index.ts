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
    
    // Check if DATABASE_URL is set
    if (!env.DATABASE_URL) {
      return new Response('DATABASE_URL environment variable is not set', { status: 500 });
    }
    
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
      try {
        const rows = await sql`SELECT * FROM "Budget" ORDER BY created_at DESC`;
        return c.json(rows);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Database query failed', details: String(error) }, 500);
      }
    });
    app.post('/api/budgets', async (c) => {
      try {
        const body = await c.req.json<{ name: string }>();
        const created = await sql`
          INSERT INTO "Budget" (id, name, total_amount, spent, created_at, updated_at) 
          VALUES (gen_random_uuid(), ${body.name}, 0, 0, NOW(), NOW()) 
          RETURNING *
        `;
        return c.json(created[0], 201);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to create budget', details: String(error) }, 500);
      }
    });
    app.patch('/api/budgets/:id', async (c) => {
      try {
        const { id } = c.req.param();
        const body = await c.req.json<{ name: string }>();
        const updated = await sql`
          UPDATE "Budget" 
          SET name = ${body.name}, updated_at = NOW() 
          WHERE id = ${id} 
          RETURNING *
        `;
        return c.json(updated[0]);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to update budget', details: String(error) }, 500);
      }
    });
    app.delete('/api/budgets/:id', async (c) => {
      try {
        const { id } = c.req.param();
        await sql`DELETE FROM "Budget" WHERE id = ${id}`;
        return c.json({ ok: true });
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to delete budget', details: String(error) }, 500);
      }
    });

    return app.fetch(req, env, ctx);
  },
};

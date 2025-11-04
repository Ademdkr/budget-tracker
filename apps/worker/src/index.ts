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

    // Auth Endpoints
    app.post('/api/auth/login', async (c) => {
      try {
        const { email } = await c.req.json<{ email: string; password: string }>();
        
        // Find user by email
        const users = await sql`SELECT * FROM "User" WHERE email = ${email} LIMIT 1`;
        
        if (users.length === 0) {
          return c.json({ message: 'Ungültige E-Mail oder Passwort' }, 401);
        }

        const user = users[0];

        // TODO: In production, use bcrypt to compare password
        // For now, accept any password for demo purposes
        // const isValidPassword = await bcrypt.compare(password, user.password);
        
        // Generate mock JWT tokens
        const accessToken = generateMockToken(user.email, user.id);
        const refreshToken = 'mock-refresh-token-' + Date.now();

        return c.json({
          accessToken,
          refreshToken,
          user: {
            id: user.id.toString(),
            name: user.name,
            surname: user.surname,
            email: user.email
          }
        });
      } catch (error) {
        console.error('Login error:', error);
        return c.json({ error: 'Login fehlgeschlagen', details: String(error) }, 500);
      }
    });

    app.post('/api/auth/register', async (c) => {
      try {
        const { email, password, name, surname } = await c.req.json<{ 
          email: string; 
          password: string;
          name: string;
          surname: string;
        }>();
        
        // Check if user already exists
        const existingUsers = await sql`SELECT id FROM "User" WHERE email = ${email} LIMIT 1`;
        
        if (existingUsers.length > 0) {
          return c.json({ message: 'E-Mail bereits registriert' }, 400);
        }

        // TODO: In production, hash password with bcrypt
        // const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user
        const newUsers = await sql`
          INSERT INTO "User" (name, surname, email, password, created_at)
          VALUES (${name || 'User'}, ${surname || 'Demo'}, ${email}, ${password}, NOW())
          RETURNING *
        `;

        const user = newUsers[0];

        // Generate mock JWT tokens
        const accessToken = generateMockToken(user.email, user.id);
        const refreshToken = 'mock-refresh-token-' + Date.now();

        return c.json({
          accessToken,
          refreshToken,
          user: {
            id: user.id.toString(),
            name: user.name,
            surname: user.surname,
            email: user.email
          }
        }, 201);
      } catch (error) {
        console.error('Registration error:', error);
        return c.json({ error: 'Registrierung fehlgeschlagen', details: String(error) }, 500);
      }
    });

    app.get('/api/auth/users', async (c) => {
      try {
        const users = await sql`
          SELECT id, name, surname, email, created_at 
          FROM "User" 
          ORDER BY created_at DESC
        `;
        
        return c.json(users.map(user => ({
          id: user.id.toString(),
          name: user.name,
          surname: user.surname,
          email: user.email,
          createdAt: user.created_at
        })));
      } catch (error) {
        console.error('Error fetching users:', error);
        return c.json({ error: 'Failed to fetch users', details: String(error) }, 500);
      }
    });

    // Helper function to generate mock JWT
    function generateMockToken(email: string, userId: number): string {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({
        sub: userId.toString(),
        email: email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      }));
      const signature = 'mock-signature';
      return `${header}.${payload}.${signature}`;
    }

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

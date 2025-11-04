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

    // ====================================================================
    // BUDGETS ENDPOINTS
    // ====================================================================
    app.get('/api/budgets', async (c) => {
      try {
        const rows = await sql`SELECT * FROM "Budget" ORDER BY created_at DESC`;
        return c.json(rows);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Database query failed', details: String(error) }, 500);
      }
    });

    app.get('/api/budgets/with-stats', async (c) => {
      try {
        const budgets = await sql`
          SELECT 
            b.*,
            c.name as category_name,
            c.emoji as category_emoji,
            c.color as category_color,
            COALESCE(SUM(t.amount), 0) as spent
          FROM "Budget" b
          LEFT JOIN "Category" c ON b.category_id = c.id
          LEFT JOIN "Transaction" t ON t.category_id = c.id 
            AND EXTRACT(MONTH FROM t.date) = b.month 
            AND EXTRACT(YEAR FROM t.date) = b.year
          GROUP BY b.id, c.name, c.emoji, c.color
          ORDER BY b.created_at DESC
        `;
        return c.json(budgets);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to fetch budgets with stats', details: String(error) }, 500);
      }
    });

    app.get('/api/budgets/:id', async (c) => {
      try {
        const { id } = c.req.param();
        const rows = await sql`SELECT * FROM "Budget" WHERE id = ${id} LIMIT 1`;
        if (rows.length === 0) {
          return c.json({ error: 'Budget not found' }, 404);
        }
        return c.json(rows[0]);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to fetch budget', details: String(error) }, 500);
      }
    });

    app.post('/api/budgets', async (c) => {
      try {
        const body = await c.req.json<{ category_id: number; total_amount: number; month: number; year: number }>();
        const created = await sql`
          INSERT INTO "Budget" (category_id, total_amount, month, year, created_at, updated_at) 
          VALUES (${body.category_id}, ${body.total_amount}, ${body.month}, ${body.year}, NOW(), NOW()) 
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
        const body = await c.req.json<{ total_amount?: number; month?: number; year?: number }>();
        
        const updates: string[] = [];
        
        if (body.total_amount !== undefined) {
          updates.push(`total_amount = ${body.total_amount}`);
        }
        if (body.month !== undefined) {
          updates.push(`month = ${body.month}`);
        }
        if (body.year !== undefined) {
          updates.push(`year = ${body.year}`);
        }
        
        if (updates.length === 0) {
          return c.json({ error: 'No fields to update' }, 400);
        }

        const updated = await sql`
          UPDATE "Budget" 
          SET total_amount = ${body.total_amount || 0}, 
              month = ${body.month || 1}, 
              year = ${body.year || 2025},
              updated_at = NOW() 
          WHERE id = ${id} 
          RETURNING *
        `;
        
        if (updated.length === 0) {
          return c.json({ error: 'Budget not found' }, 404);
        }
        
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

    // ====================================================================
    // ACCOUNTS ENDPOINTS
    // ====================================================================
    app.get('/api/accounts', async (c) => {
      try {
        const accounts = await sql`
          SELECT * FROM "Account" 
          WHERE is_active = true 
          ORDER BY created_at DESC
        `;
        return c.json(accounts);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to fetch accounts', details: String(error) }, 500);
      }
    });

    app.get('/api/accounts/:id', async (c) => {
      try {
        const { id } = c.req.param();
        const rows = await sql`SELECT * FROM "Account" WHERE id = ${id} LIMIT 1`;
        if (rows.length === 0) {
          return c.json({ error: 'Account not found' }, 404);
        }
        return c.json(rows[0]);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to fetch account', details: String(error) }, 500);
      }
    });

    app.post('/api/accounts', async (c) => {
      try {
        const body = await c.req.json<{ 
          user_id: number; 
          name: string; 
          type: string; 
          initial_balance: number;
          note?: string;
        }>();
        
        const created = await sql`
          INSERT INTO "Account" (user_id, name, type, initial_balance, note, is_active, created_at, updated_at) 
          VALUES (
            ${body.user_id}, 
            ${body.name}, 
            ${body.type}, 
            ${body.initial_balance}, 
            ${body.note || null},
            true,
            NOW(), 
            NOW()
          ) 
          RETURNING *
        `;
        return c.json(created[0], 201);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to create account', details: String(error) }, 500);
      }
    });

    app.patch('/api/accounts/:id', async (c) => {
      try {
        const { id } = c.req.param();
        const body = await c.req.json<{ name?: string; note?: string; is_active?: boolean }>();
        
        const updated = await sql`
          UPDATE "Account" 
          SET 
            name = COALESCE(${body.name}, name),
            note = COALESCE(${body.note}, note),
            is_active = COALESCE(${body.is_active}, is_active),
            updated_at = NOW() 
          WHERE id = ${id} 
          RETURNING *
        `;
        
        if (updated.length === 0) {
          return c.json({ error: 'Account not found' }, 404);
        }
        
        return c.json(updated[0]);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to update account', details: String(error) }, 500);
      }
    });

    app.delete('/api/accounts/:id', async (c) => {
      try {
        const { id } = c.req.param();
        // Soft delete
        await sql`UPDATE "Account" SET is_active = false WHERE id = ${id}`;
        return c.json({ ok: true });
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to delete account', details: String(error) }, 500);
      }
    });

    // ====================================================================
    // CATEGORIES ENDPOINTS
    // ====================================================================
    app.get('/api/categories', async (c) => {
      try {
        const categories = await sql`
          SELECT c.*, a.name as account_name 
          FROM "Category" c
          LEFT JOIN "Account" a ON c.account_id = a.id
          WHERE c.is_active = true
          ORDER BY c.created_at DESC
        `;
        return c.json(categories);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to fetch categories', details: String(error) }, 500);
      }
    });

    app.get('/api/categories/:id', async (c) => {
      try {
        const { id } = c.req.param();
        const rows = await sql`SELECT * FROM "Category" WHERE id = ${id} LIMIT 1`;
        if (rows.length === 0) {
          return c.json({ error: 'Category not found' }, 404);
        }
        return c.json(rows[0]);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to fetch category', details: String(error) }, 500);
      }
    });

    app.post('/api/categories', async (c) => {
      try {
        const body = await c.req.json<{ 
          account_id: number;
          name: string;
          description?: string;
          transaction_type: string;
          emoji: string;
          color: string;
        }>();
        
        const created = await sql`
          INSERT INTO "Category" (
            account_id, name, description, transaction_type, emoji, color, is_active, created_at, updated_at
          ) 
          VALUES (
            ${body.account_id},
            ${body.name},
            ${body.description || null},
            ${body.transaction_type},
            ${body.emoji},
            ${body.color},
            true,
            NOW(),
            NOW()
          ) 
          RETURNING *
        `;
        return c.json(created[0], 201);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to create category', details: String(error) }, 500);
      }
    });

    app.patch('/api/categories/:id', async (c) => {
      try {
        const { id } = c.req.param();
        const body = await c.req.json<{ 
          name?: string; 
          description?: string; 
          emoji?: string; 
          color?: string;
          is_active?: boolean;
        }>();
        
        const updated = await sql`
          UPDATE "Category" 
          SET 
            name = COALESCE(${body.name}, name),
            description = COALESCE(${body.description}, description),
            emoji = COALESCE(${body.emoji}, emoji),
            color = COALESCE(${body.color}, color),
            is_active = COALESCE(${body.is_active}, is_active),
            updated_at = NOW() 
          WHERE id = ${id} 
          RETURNING *
        `;
        
        if (updated.length === 0) {
          return c.json({ error: 'Category not found' }, 404);
        }
        
        return c.json(updated[0]);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to update category', details: String(error) }, 500);
      }
    });

    app.delete('/api/categories/:id', async (c) => {
      try {
        const { id } = c.req.param();
        // Soft delete
        await sql`UPDATE "Category" SET is_active = false WHERE id = ${id}`;
        return c.json({ ok: true });
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to delete category', details: String(error) }, 500);
      }
    });

    // ====================================================================
    // TRANSACTIONS ENDPOINTS
    // ====================================================================
    app.get('/api/transactions', async (c) => {
      try {
        const transactions = await sql`
          SELECT 
            t.*,
            a.name as account_name,
            c.name as category_name,
            c.emoji as category_emoji,
            c.color as category_color
          FROM "Transaction" t
          LEFT JOIN "Account" a ON t.account_id = a.id
          LEFT JOIN "Category" c ON t.category_id = c.id
          ORDER BY t.date DESC, t.created_at DESC
        `;
        return c.json(transactions);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to fetch transactions', details: String(error) }, 500);
      }
    });

    app.get('/api/transactions/:id', async (c) => {
      try {
        const { id } = c.req.param();
        const rows = await sql`SELECT * FROM "Transaction" WHERE id = ${id} LIMIT 1`;
        if (rows.length === 0) {
          return c.json({ error: 'Transaction not found' }, 404);
        }
        return c.json(rows[0]);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to fetch transaction', details: String(error) }, 500);
      }
    });

    app.post('/api/transactions', async (c) => {
      try {
        const body = await c.req.json<{ 
          account_id: number;
          category_id?: number;
          amount: number;
          note?: string;
          date: string;
        }>();
        
        const created = await sql`
          INSERT INTO "Transaction" (account_id, category_id, amount, note, date, created_at, updated_at) 
          VALUES (
            ${body.account_id},
            ${body.category_id || null},
            ${body.amount},
            ${body.note || null},
            ${body.date},
            NOW(),
            NOW()
          ) 
          RETURNING *
        `;
        return c.json(created[0], 201);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to create transaction', details: String(error) }, 500);
      }
    });

    app.patch('/api/transactions/:id', async (c) => {
      try {
        const { id } = c.req.param();
        const body = await c.req.json<{ 
          amount?: number;
          category_id?: number;
          note?: string;
          date?: string;
        }>();
        
        const updated = await sql`
          UPDATE "Transaction" 
          SET 
            amount = COALESCE(${body.amount}, amount),
            category_id = COALESCE(${body.category_id}, category_id),
            note = COALESCE(${body.note}, note),
            date = COALESCE(${body.date}::date, date),
            updated_at = NOW() 
          WHERE id = ${id} 
          RETURNING *
        `;
        
        if (updated.length === 0) {
          return c.json({ error: 'Transaction not found' }, 404);
        }
        
        return c.json(updated[0]);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to update transaction', details: String(error) }, 500);
      }
    });

    app.delete('/api/transactions/:id', async (c) => {
      try {
        const { id } = c.req.param();
        await sql`DELETE FROM "Transaction" WHERE id = ${id}`;
        return c.json({ ok: true });
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to delete transaction', details: String(error) }, 500);
      }
    });

    return app.fetch(req, env, ctx);
  },
};

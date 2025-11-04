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
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({
        sub: userId.toString(),
        email: email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
      })).toString('base64url');
      const signature = 'mock-signature';
      return `${header}.${payload}.${signature}`;
    }

    // Helper function to get user ID from headers
    function getUserIdFromHeaders(c: any): string {
      const userId = c.req.header('x-user-id');
      if (!userId) {
        console.log('⚠️ No user ID in headers, using test user ID');
        return '1'; // Test User ID
      }
      return userId;
    }

    // ====================================================================

    // ====================================================================
    // BUDGETS ENDPOINTS
    // ====================================================================
    app.get('/api/budgets', async (c) => {
      try {
        const userId = getUserIdFromHeaders(c);
        const rows = await sql`
          SELECT b.* FROM "Budget" b
          JOIN "Category" c ON b.category_id = c.id
          JOIN "Account" a ON c.account_id = a.id
          WHERE a.user_id = ${userId}
          ORDER BY b.created_at DESC
        `;
        return c.json(rows);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Database query failed', details: String(error) }, 500);
      }
    });

    app.get('/api/budgets/with-stats', async (c) => {
      try {
        const userId = getUserIdFromHeaders(c);
        const budgets = await sql`
          SELECT 
            b.*,
            c.name as category_name,
            c.emoji as category_emoji,
            c.color as category_color,
            COALESCE(SUM(t.amount), 0) as spent
          FROM "Budget" b
          LEFT JOIN "Category" c ON b.category_id = c.id
          LEFT JOIN "Account" a ON c.account_id = a.id
          LEFT JOIN "Transaction" t ON t.category_id = c.id 
            AND EXTRACT(MONTH FROM t.date) = b.month 
            AND EXTRACT(YEAR FROM t.date) = b.year
          WHERE a.user_id = ${userId}
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
        const userId = getUserIdFromHeaders(c);
        const rows = await sql`
          SELECT b.* FROM "Budget" b
          JOIN "Category" c ON b.category_id = c.id
          JOIN "Account" a ON c.account_id = a.id
          WHERE b.id = ${id} AND a.user_id = ${userId}
          LIMIT 1
        `;
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
        const userId = getUserIdFromHeaders(c);
        const body = await c.req.json<{ category_id: number; total_amount: number; month: number; year: number }>();
        
        // Verify category belongs to user
        const category = await sql`
          SELECT c.* FROM "Category" c
          JOIN "Account" a ON c.account_id = a.id
          WHERE c.id = ${body.category_id} AND a.user_id = ${userId}
          LIMIT 1
        `;
        if (category.length === 0) {
          return c.json({ error: 'Category not found or access denied' }, 404);
        }
        
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
        const userId = getUserIdFromHeaders(c);
        const body = await c.req.json<{ total_amount?: number; month?: number; year?: number }>();
        
        // Verify budget belongs to user
        const check = await sql`
          SELECT b.id FROM "Budget" b
          JOIN "Category" c ON b.category_id = c.id
          JOIN "Account" a ON c.account_id = a.id
          WHERE b.id = ${id} AND a.user_id = ${userId}
        `;
        if (check.length === 0) {
          return c.json({ error: 'Budget not found or access denied' }, 404);
        }
        
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
        const userId = getUserIdFromHeaders(c);
        
        // Verify budget belongs to user
        const check = await sql`
          SELECT b.id FROM "Budget" b
          JOIN "Category" c ON b.category_id = c.id
          JOIN "Account" a ON c.account_id = a.id
          WHERE b.id = ${id} AND a.user_id = ${userId}
        `;
        if (check.length === 0) {
          return c.json({ error: 'Budget not found or access denied' }, 404);
        }
        
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
        const userId = getUserIdFromHeaders(c);
        const accounts = await sql`
          SELECT * FROM "Account" 
          WHERE is_active = true AND user_id = ${userId}
          ORDER BY created_at DESC
        `;
        return c.json(accounts);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to fetch accounts', details: String(error) }, 500);
      }
    });

    // Specific routes MUST come before dynamic :id routes
    app.get('/api/accounts/statistics', async (c) => {
      try {
        const userId = getUserIdFromHeaders(c);
        const accounts = await sql`
          SELECT * FROM "Account" WHERE is_active = true AND user_id = ${userId}
        `;
        
        const totalBalance = accounts.reduce((sum: number, acc: any) => 
          sum + Number(acc.initial_balance), 0);
        const activeAccounts = accounts.length;
        const totalAccountsResult = await sql`SELECT COUNT(*) as count FROM "Account" WHERE user_id = ${userId}`;
        const totalAccounts = Number(totalAccountsResult[0].count);
        
        return c.json({
          totalBalance,
          activeAccounts,
          totalAccounts
        });
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to fetch account statistics', details: String(error) }, 500);
      }
    });

    app.get('/api/accounts/with-balances', async (c) => {
      try {
        const userId = getUserIdFromHeaders(c);
        const accounts = await sql`
          SELECT a.*, 
            COUNT(DISTINCT t.id) as transaction_count
          FROM "Account" a
          LEFT JOIN "Transaction" t ON t.account_id = a.id
          WHERE a.user_id = ${userId}
          GROUP BY a.id
          ORDER BY a.created_at DESC
        `;
        
        // Calculate balances for each account
        const accountsWithBalances = await Promise.all(accounts.map(async (account: any) => {
          const transactions = await sql`
            SELECT t.amount, c.transaction_type
            FROM "Transaction" t
            JOIN "Category" c ON t.category_id = c.id
            WHERE t.account_id = ${account.id}
            ORDER BY t.date DESC
          `;
          
          let calculatedBalance = Number(account.initial_balance);
          let totalIncome = 0;
          let totalExpenses = 0;
          
          for (const tx of transactions) {
            const amount = Number(tx.amount);
            if (tx.transaction_type === 'INCOME') {
              calculatedBalance += amount;
              totalIncome += amount;
            } else if (tx.transaction_type === 'EXPENSE') {
              calculatedBalance -= amount;
              totalExpenses += amount;
            }
          }
          
          const lastTransaction = transactions[0];
          
          return {
            ...account,
            calculatedBalance,
            totalIncome,
            totalExpenses,
            lastTransactionDate: lastTransaction?.date || null,
            transactionCount: Number(account.transaction_count)
          };
        }));
        
        return c.json(accountsWithBalances);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to fetch accounts with balances', details: String(error) }, 500);
      }
    });

    app.post('/api/accounts/recalculate-balances', async (c) => {
      try {
        const userId = getUserIdFromHeaders(c);
        // With the new schema, we only have initialBalance (no balance field)
        // This endpoint returns all accounts (balances are calculated on-the-fly)
        const accounts = await sql`SELECT * FROM "Account" WHERE user_id = ${userId} ORDER BY created_at DESC`;
        return c.json(accounts);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to recalculate balances', details: String(error) }, 500);
      }
    });

    app.get('/api/accounts/:id', async (c) => {
      try {
        const { id } = c.req.param();
        const userId = getUserIdFromHeaders(c);
        const rows = await sql`SELECT * FROM "Account" WHERE id = ${id} AND user_id = ${userId} LIMIT 1`;
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
        const userId = getUserIdFromHeaders(c);
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
            ${userId}, 
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
        const userId = getUserIdFromHeaders(c);
        const body = await c.req.json<{ name?: string; note?: string; is_active?: boolean }>();
        
        const updated = await sql`
          UPDATE "Account" 
          SET 
            name = COALESCE(${body.name}, name),
            note = COALESCE(${body.note}, note),
            is_active = COALESCE(${body.is_active}, is_active),
            updated_at = NOW() 
          WHERE id = ${id} AND user_id = ${userId}
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
        const userId = getUserIdFromHeaders(c);
        
        // Check if account has transactions
        const transactions = await sql`
          SELECT COUNT(*) as count FROM "Transaction" 
          WHERE account_id = ${id}
        `;
        
        if (Number(transactions[0].count) > 0) {
          // Soft delete by setting is_active to false
          const updated = await sql`
            UPDATE "Account" 
            SET is_active = false, updated_at = NOW() 
            WHERE id = ${id} AND user_id = ${userId}
            RETURNING *
          `;
          return c.json(updated[0]);
        }
        
        // Hard delete if no transactions
        await sql`DELETE FROM "Account" WHERE id = ${id} AND user_id = ${userId}`;
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
        const userId = getUserIdFromHeaders(c);
        const categories = await sql`
          SELECT c.*, a.name as account_name 
          FROM "Category" c
          LEFT JOIN "Account" a ON c.account_id = a.id
          WHERE a.user_id = ${userId}
          ORDER BY c.created_at DESC
        `;
        return c.json(categories);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to fetch categories', details: String(error) }, 500);
      }
    });

    // Specific routes MUST come before dynamic :id routes
    app.post('/api/categories/auto-assign/:accountId', async (c) => {
      try {
        const { accountId } = c.req.param();
        const userId = getUserIdFromHeaders(c);
        
        // Verify account belongs to user
        const account = await sql`SELECT * FROM "Account" WHERE id = ${accountId} AND user_id = ${userId} LIMIT 1`;
        if (account.length === 0) {
          return c.json({ error: 'Account not found or access denied' }, 404);
        }
        
        // Find all categories that have transactions for this account
        const categories = await sql`
          SELECT DISTINCT c.*, COUNT(t.id) as transaction_count
          FROM "Category" c
          JOIN "Transaction" t ON t.category_id = c.id
          WHERE t.account_id = ${accountId}
          GROUP BY c.id
          ORDER BY transaction_count DESC
        `;
        
        return c.json(categories);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to auto-assign categories', details: String(error) }, 500);
      }
    });

    app.get('/api/categories/:id', async (c) => {
      try {
        const { id } = c.req.param();
        const userId = getUserIdFromHeaders(c);
        const rows = await sql`
          SELECT c.* FROM "Category" c
          JOIN "Account" a ON c.account_id = a.id
          WHERE c.id = ${id} AND a.user_id = ${userId}
          LIMIT 1
        `;
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
        const userId = getUserIdFromHeaders(c);
        const body = await c.req.json<{ 
          account_id: number;
          name: string;
          description?: string;
          transaction_type: string;
          emoji: string;
          color: string;
        }>();
        
        // Verify account belongs to user
        const account = await sql`SELECT * FROM "Account" WHERE id = ${body.account_id} AND user_id = ${userId} LIMIT 1`;
        if (account.length === 0) {
          return c.json({ error: 'Account not found or access denied' }, 404);
        }
        
        const created = await sql`
          INSERT INTO "Category" (
            account_id, name, description, transaction_type, emoji, color, created_at, updated_at
          ) 
          VALUES (
            ${body.account_id},
            ${body.name},
            ${body.description || null},
            ${body.transaction_type},
            ${body.emoji},
            ${body.color},
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
        const userId = getUserIdFromHeaders(c);
        const body = await c.req.json<{ 
          name?: string; 
          description?: string; 
          emoji?: string; 
          color?: string;
        }>();
        
        // Verify category belongs to user's account
        const check = await sql`
          SELECT c.id FROM "Category" c
          JOIN "Account" a ON c.account_id = a.id
          WHERE c.id = ${id} AND a.user_id = ${userId}
        `;
        if (check.length === 0) {
          return c.json({ error: 'Category not found or access denied' }, 404);
        }
        
        const updated = await sql`
          UPDATE "Category" 
          SET 
            name = COALESCE(${body.name}, name),
            description = COALESCE(${body.description}, description),
            emoji = COALESCE(${body.emoji}, emoji),
            color = COALESCE(${body.color}, color),
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
        const userId = getUserIdFromHeaders(c);
        
        // Verify category belongs to user's account
        const check = await sql`
          SELECT c.id FROM "Category" c
          JOIN "Account" a ON c.account_id = a.id
          WHERE c.id = ${id} AND a.user_id = ${userId}
        `;
        if (check.length === 0) {
          return c.json({ error: 'Category not found or access denied' }, 404);
        }
        
        await sql`DELETE FROM "Category" WHERE id = ${id}`;
        return c.json({ ok: true });
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to delete category', details: String(error) }, 500);
      }
    });

    // Category-Account relationship endpoints
    app.post('/api/categories/:id/accounts/:accountId', async (c) => {
      try {
        const { id, accountId } = c.req.param();
        const userId = getUserIdFromHeaders(c);
        
        // Verify both category and account belong to user
        const categoryCheck = await sql`
          SELECT c.id FROM "Category" c
          JOIN "Account" a ON c.account_id = a.id
          WHERE c.id = ${id} AND a.user_id = ${userId}
        `;
        if (categoryCheck.length === 0) {
          return c.json({ error: 'Category not found or access denied' }, 404);
        }
        
        const accountCheck = await sql`
          SELECT * FROM "Account" WHERE id = ${accountId} AND user_id = ${userId}
        `;
        if (accountCheck.length === 0) {
          return c.json({ error: 'Account not found or access denied' }, 404);
        }
        
        // Update category's accountId
        const updated = await sql`
          UPDATE "Category" 
          SET account_id = ${accountId}, updated_at = NOW() 
          WHERE id = ${id} 
          RETURNING *
        `;
        
        if (updated.length === 0) {
          return c.json({ error: 'Category not found' }, 404);
        }
        
        return c.json(updated[0]);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to assign category to account', details: String(error) }, 500);
      }
    });

    app.delete('/api/categories/:id/accounts/:accountId', async (c) => {
      try {
        const { id } = c.req.param();
        const userId = getUserIdFromHeaders(c);
        
        // Verify category belongs to user
        const check = await sql`
          SELECT c.id FROM "Category" c
          JOIN "Account" a ON c.account_id = a.id
          WHERE c.id = ${id} AND a.user_id = ${userId}
        `;
        if (check.length === 0) {
          return c.json({ error: 'Category not found or access denied' }, 404);
        }
        
        // Since categories are directly linked to accounts, we delete the category
        await sql`DELETE FROM "Category" WHERE id = ${id}`;
        return c.json({ ok: true });
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to remove category from account', details: String(error) }, 500);
      }
    });

    app.get('/api/categories/:id/accounts', async (c) => {
      try {
        const { id } = c.req.param();
        const userId = getUserIdFromHeaders(c);
        
        // Get category with its account (verify user ownership)
        const rows = await sql`
          SELECT c.*, a.name as account_name, a.type as account_type
          FROM "Category" c
          JOIN "Account" a ON c.account_id = a.id
          WHERE c.id = ${id} AND a.user_id = ${userId}
        `;
        
        if (rows.length === 0) {
          return c.json({ error: 'Category not found' }, 404);
        }
        
        return c.json([{ category: rows[0], account: rows[0] }]);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to fetch category accounts', details: String(error) }, 500);
      }
    });

    // ====================================================================
    // TRANSACTIONS ENDPOINTS
    // ====================================================================
    app.get('/api/transactions', async (c) => {
      try {
        const userId = getUserIdFromHeaders(c);
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
          WHERE a.user_id = ${userId}
          ORDER BY t.date DESC, t.created_at DESC
        `;
        return c.json(transactions);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to fetch transactions', details: String(error) }, 500);
      }
    });

    // Specific routes MUST come before dynamic :id routes
    app.post('/api/transactions/import', async (c) => {
      try {
        const userId = getUserIdFromHeaders(c);
        const { data, options } = await c.req.json<{
          data: Array<{ date: string; amount: string; note?: string }>;
          options: {
            targetAccountId: string;
            dateFormat: string;
            amountFormat: string;
            skipFirstRow: boolean;
          };
        }>();

        // Verify account belongs to user
        const account = await sql`SELECT * FROM "Account" WHERE id = ${options.targetAccountId} AND user_id = ${userId} LIMIT 1`;
        if (account.length === 0) {
          return c.json({ error: 'Account not found or access denied' }, 404);
        }

        const result = {
          total: data.length,
          successful: 0,
          skipped: 0,
          errors: 0,
          errorDetails: [] as Array<{ row: number; data: any; error: string }>,
          createdTransactions: [] as any[]
        };

        // Helper function to parse date
        const parseDate = (dateStr: string, format: string): Date | null => {
          try {
            const parts = dateStr.split(/[.\-/]/);
            let day: number, month: number, year: number;

            switch (format) {
              case 'DD.MM.YYYY':
              case 'DD-MM-YYYY':
                day = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10) - 1;
                year = parseInt(parts[2], 10);
                break;
              case 'MM/DD/YYYY':
                month = parseInt(parts[0], 10) - 1;
                day = parseInt(parts[1], 10);
                year = parseInt(parts[2], 10);
                break;
              case 'YYYY-MM-DD':
                year = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10) - 1;
                day = parseInt(parts[2], 10);
                break;
              default:
                return null;
            }

            const date = new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
            return isNaN(date.getTime()) ? null : date;
          } catch {
            return null;
          }
        };

        // Helper function to parse amount
        const parseAmount = (amountStr: string, format: string): number => {
          try {
            let cleaned = amountStr.trim();

            switch (format) {
              case 'de':
                cleaned = cleaned.replace(/\./g, '').replace(',', '.');
                break;
              case 'en':
                cleaned = cleaned.replace(/,/g, '');
                break;
              case 'simple':
                break;
            }

            return parseFloat(cleaned);
          } catch {
            return NaN;
          }
        };

        // Pre-create "Unbekannt" categories
        const categoryConfigs = [
          { type: 'INCOME', name: 'Unbekannte Einnahmen', emoji: '❓', color: '#4CAF50' },
          { type: 'EXPENSE', name: 'Unbekannte Ausgaben', emoji: '❓', color: '#F44336' }
        ];

        for (const config of categoryConfigs) {
          const existing = await sql`
            SELECT * FROM "Category" 
            WHERE account_id = ${options.targetAccountId} 
            AND name = ${config.name} 
            AND transaction_type = ${config.type}
            LIMIT 1
          `;

          if (existing.length === 0) {
            await sql`
              INSERT INTO "Category" (account_id, name, emoji, color, transaction_type, created_at, updated_at)
              VALUES (
                ${options.targetAccountId},
                ${config.name},
                ${config.emoji},
                ${config.color},
                ${config.type},
                NOW(),
                NOW()
              )
            `;
          }
        }

        // Process each transaction
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          const rowNumber = i + 1 + (options.skipFirstRow ? 1 : 0);

          try {
            const parsedDate = parseDate(row.date, options.dateFormat);
            if (!parsedDate) {
              throw new Error(`Ungültiges Datum: ${row.date}`);
            }

            const parsedAmount = parseAmount(row.amount.toString(), options.amountFormat);
            if (isNaN(parsedAmount)) {
              throw new Error(`Ungültiger Betrag: ${row.amount}`);
            }

            const transactionType = parsedAmount >= 0 ? 'INCOME' : 'EXPENSE';
            const absoluteAmount = Math.abs(parsedAmount);
            const categoryName = transactionType === 'INCOME' 
              ? 'Unbekannte Einnahmen' 
              : 'Unbekannte Ausgaben';

            // Find category
            const categories = await sql`
              SELECT * FROM "Category" 
              WHERE account_id = ${options.targetAccountId} 
              AND name = ${categoryName} 
              AND transaction_type = ${transactionType}
              LIMIT 1
            `;

            if (categories.length === 0) {
              throw new Error(`Kategorie "${categoryName}" für ${transactionType} nicht gefunden`);
            }

            const category = categories[0];

            // Create transaction
            const transaction = await sql`
              INSERT INTO "Transaction" (date, amount, note, category_id, account_id, created_at, updated_at)
              VALUES (
                ${parsedDate.toISOString()},
                ${absoluteAmount},
                ${row.note || null},
                ${category.id},
                ${options.targetAccountId},
                NOW(),
                NOW()
              )
              RETURNING *
            `;

            result.successful++;
            result.createdTransactions.push(transaction[0]);
          } catch (error) {
            result.errors++;
            result.errorDetails.push({
              row: rowNumber,
              data: row,
              error: error instanceof Error ? error.message : 'Unbekannter Fehler'
            });
          }
        }

        return c.json(result);
      } catch (error) {
        console.error('Import error:', error);
        return c.json({ error: 'Failed to import transactions', details: String(error) }, 500);
      }
    });

    app.get('/api/transactions/:id', async (c) => {
      try {
        const { id } = c.req.param();
        const userId = getUserIdFromHeaders(c);
        const rows = await sql`
          SELECT t.* FROM "Transaction" t
          JOIN "Account" a ON t.account_id = a.id
          WHERE t.id = ${id} AND a.user_id = ${userId}
          LIMIT 1
        `;
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
        const userId = getUserIdFromHeaders(c);
        const body = await c.req.json<{ 
          account_id: number;
          category_id?: number;
          amount: number;
          note?: string;
          date: string;
        }>();
        
        // Verify account belongs to user
        const account = await sql`SELECT * FROM "Account" WHERE id = ${body.account_id} AND user_id = ${userId} LIMIT 1`;
        if (account.length === 0) {
          return c.json({ error: 'Account not found or access denied' }, 404);
        }
        
        // Verify category belongs to user (if provided)
        if (body.category_id) {
          const category = await sql`
            SELECT c.* FROM "Category" c
            JOIN "Account" a ON c.account_id = a.id
            WHERE c.id = ${body.category_id} AND a.user_id = ${userId}
            LIMIT 1
          `;
          if (category.length === 0) {
            return c.json({ error: 'Category not found or access denied' }, 404);
          }
        }
        
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
        const userId = getUserIdFromHeaders(c);
        const body = await c.req.json<{ amount?: number; note?: string; date?: string }>();
        
        // Verify transaction belongs to user
        const check = await sql`
          SELECT t.id FROM "Transaction" t
          JOIN "Account" a ON t.account_id = a.id
          WHERE t.id = ${id} AND a.user_id = ${userId}
        `;
        if (check.length === 0) {
          return c.json({ error: 'Transaction not found or access denied' }, 404);
        }
        
        const updated = await sql`
          UPDATE "Transaction" 
          SET 
            amount = COALESCE(${body.amount}, amount),
            note = COALESCE(${body.note}, note),
            date = COALESCE(${body.date}, date),
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
        const userId = getUserIdFromHeaders(c);
        
        // Verify transaction belongs to user
        const check = await sql`
          SELECT t.id FROM "Transaction" t
          JOIN "Account" a ON t.account_id = a.id
          WHERE t.id = ${id} AND a.user_id = ${userId}
        `;
        if (check.length === 0) {
          return c.json({ error: 'Transaction not found or access denied' }, 404);
        }
        
        await sql`DELETE FROM "Transaction" WHERE id = ${id}`;
        return c.json({ ok: true });
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to delete transaction', details: String(error) }, 500);
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

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
            email: user.email,
          },
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

        return c.json(
          {
            accessToken,
            refreshToken,
            user: {
              id: user.id.toString(),
              name: user.name,
              surname: user.surname,
              email: user.email,
            },
          },
          201,
        );
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

        return c.json(
          users.map((user) => ({
            id: user.id.toString(),
            name: user.name,
            surname: user.surname,
            email: user.email,
            createdAt: user.created_at,
          })),
        );
      } catch (error) {
        console.error('Error fetching users:', error);
        return c.json({ error: 'Failed to fetch users', details: String(error) }, 500);
      }
    });

    // Helper function to generate mock JWT
    function generateMockToken(email: string, userId: number): string {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString(
        'base64url',
      );
      const payload = Buffer.from(
        JSON.stringify({
          sub: userId.toString(),
          email: email,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
        }),
      ).toString('base64url');
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
    
    // Helper function to serialize budget data
    function serializeBudget(budget: any) {
      return {
        id: budget.id.toString(),
        categoryId: budget.category_id?.toString(),
        year: budget.year,
        month: budget.month,
        totalAmount: Number(budget.total_amount),
        createdAt: budget.created_at,
        updatedAt: budget.updated_at,
        category: budget.category_name ? {
          id: budget.category_id?.toString(),
          name: budget.category_name,
          emoji: budget.category_emoji,
          color: budget.category_color,
        } : undefined,
      };
    }

    function serializeTransaction(transaction: any) {
      return {
        id: transaction.id.toString(),
        accountId: transaction.account_id?.toString(),
        categoryId: transaction.category_id?.toString(),
        amount: Number(transaction.amount),
        date: transaction.date,
        note: transaction.note,
        title: transaction.note, // Backend uses note, frontend uses title/description
        description: transaction.note,
        type: transaction.transaction_type || transaction.category_transaction_type, // From category JOIN
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at,
        account: transaction.account_name ? {
          id: transaction.account_id?.toString(),
          name: transaction.account_name,
        } : undefined,
        category: transaction.category_name ? {
          id: transaction.category_id?.toString(),
          name: transaction.category_name,
          emoji: transaction.category_emoji,
          color: transaction.category_color,
        } : undefined,
      };
    }
    
    app.get('/api/budgets', async (c) => {
      try {
        const userId = getUserIdFromHeaders(c);
        console.log('🔍 GET /api/budgets called for user:', userId);
        
        const rows = await sql`
          SELECT b.*, c.name as category_name, c.emoji as category_emoji, c.color as category_color
          FROM "Budget" b
          JOIN "Category" c ON b.category_id = c.id
          JOIN "Account" a ON c.account_id = a.id
          WHERE a.user_id = ${userId}
          ORDER BY b.created_at DESC
        `;
        
        console.log('📊 Found budgets:', rows.length);
        return c.json(rows.map(serializeBudget));
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Database query failed', details: String(error) }, 500);
      }
    });

    app.get('/api/budgets/with-stats', async (c) => {
      try {
        const userId = getUserIdFromHeaders(c);
        const year = c.req.query('year');
        const month = c.req.query('month');
        const accountId = c.req.query('accountId');
        
        console.log('🔍 GET /api/budgets/with-stats - Year:', year, 'Month:', month, 'AccountId:', accountId);
        
        // Use current date if not specified
        const now = new Date();
        const targetYear = year ? parseInt(year) : now.getFullYear();
        const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
        
        // Build query based on whether accountId is provided
        let budgets;
        if (accountId) {
          budgets = await sql`
            SELECT 
              b.*,
              c.name as category_name,
              c.emoji as category_emoji,
              c.color as category_color,
              c.transaction_type as category_transaction_type
            FROM "Budget" b
            LEFT JOIN "Category" c ON b.category_id = c.id
            LEFT JOIN "Account" a ON c.account_id = a.id
            WHERE a.user_id = ${userId}
              AND b.year = ${targetYear}
              AND b.month = ${targetMonth}
              AND a.id = ${accountId}
            ORDER BY b.created_at DESC
          `;
        } else {
          budgets = await sql`
            SELECT 
              b.*,
              c.name as category_name,
              c.emoji as category_emoji,
              c.color as category_color,
              c.transaction_type as category_transaction_type
            FROM "Budget" b
            LEFT JOIN "Category" c ON b.category_id = c.id
            LEFT JOIN "Account" a ON c.account_id = a.id
            WHERE a.user_id = ${userId}
              AND b.year = ${targetYear}
              AND b.month = ${targetMonth}
            ORDER BY b.created_at DESC
          `;
        }
        
        // Calculate stats for each budget
        const budgetsWithStats = await Promise.all(budgets.map(async (budget: any) => {
          const targetAmount = Number(budget.total_amount);
          
          // Get transactions for this category in the target month/year
          const transactions = await sql`
            SELECT t.amount, t.date
            FROM "Transaction" t
            WHERE t.category_id = ${budget.category_id}
              AND EXTRACT(YEAR FROM t.date) = ${targetYear}
              AND EXTRACT(MONTH FROM t.date) = ${targetMonth}
              AND ${budget.category_transaction_type} = 'EXPENSE'
            ORDER BY t.date DESC
          `;
          
          const currentAmount = transactions.reduce((sum: number, t: any) => 
            sum + Number(t.amount), 0);
          const remainingAmount = targetAmount - currentAmount;
          const percentageUsed = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
          
          return {
            id: budget.id.toString(),
            categoryId: budget.category_id.toString(),
            categoryName: budget.category_name,
            categoryIcon: budget.category_emoji || '📦',
            categoryColor: budget.category_color || '#4CAF50',
            targetAmount,
            currentAmount,
            remainingAmount,
            percentageUsed,
            transactionCount: transactions.length,
            lastTransactionDate: transactions.length > 0 ? transactions[0].date : null,
            month: budget.month,
            year: budget.year,
            createdAt: budget.created_at,
            updatedAt: budget.updated_at,
            isActive: true,
          };
        }));
        
        console.log('📊 Returning budgets with stats:', budgetsWithStats.length);
        return c.json(budgetsWithStats);
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
          SELECT 
            b.*,
            c.name as category_name,
            c.emoji as category_emoji,
            c.color as category_color
          FROM "Budget" b
          LEFT JOIN "Category" c ON b.category_id = c.id
          LEFT JOIN "Account" a ON c.account_id = a.id
          WHERE b.id = ${id} AND a.user_id = ${userId}
          LIMIT 1
        `;
        if (rows.length === 0) {
          return c.json({ error: 'Budget not found' }, 404);
        }
        
        const budget = serializeBudget(rows[0]);
        return c.json(budget);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to fetch budget', details: String(error) }, 500);
      }
    });

    app.post('/api/budgets', async (c) => {
      try {
        const userId = getUserIdFromHeaders(c);
        const body = await c.req.json<{
          categoryId: number;
          totalAmount: number;
          month: number;
          year: number;
        }>();
        
        console.log('📝 POST /api/budgets - Body:', body);

        // Verify category belongs to user
        const category = await sql`
          SELECT c.* FROM "Category" c
          JOIN "Account" a ON c.account_id = a.id
          WHERE c.id = ${body.categoryId} AND a.user_id = ${userId}
          LIMIT 1
        `;
        if (category.length === 0) {
          return c.json({ error: 'Category not found or access denied' }, 404);
        }

        const created = await sql`
          INSERT INTO "Budget" (category_id, total_amount, month, year, created_at, updated_at) 
          VALUES (${body.categoryId}, ${body.totalAmount}, ${body.month}, ${body.year}, NOW(), NOW()) 
          RETURNING *
        `;
        
        const budget = serializeBudget(created[0]);
        console.log('✅ Created budget:', budget);
        return c.json(budget, 201);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to create budget', details: String(error) }, 500);
      }
    });

    app.patch('/api/budgets/:id', async (c) => {
      try {
        const { id } = c.req.param();
        const userId = getUserIdFromHeaders(c);
        const body = await c.req.json<{ totalAmount?: number; month?: number; year?: number }>();
        
        console.log('✏️ PATCH /api/budgets/:id - ID:', id, 'Body:', body);

        // Verify budget belongs to user
        const check = await sql`
          SELECT b.* FROM "Budget" b
          JOIN "Category" c ON b.category_id = c.id
          JOIN "Account" a ON c.account_id = a.id
          WHERE b.id = ${id} AND a.user_id = ${userId}
        `;
        if (check.length === 0) {
          return c.json({ error: 'Budget not found or access denied' }, 404);
        }

        const current = check[0];
        const newTotalAmount = body.totalAmount !== undefined ? body.totalAmount : Number(current.total_amount);
        const newMonth = body.month !== undefined ? body.month : current.month;
        const newYear = body.year !== undefined ? body.year : current.year;

        const updated = await sql`
          UPDATE "Budget" 
          SET total_amount = ${newTotalAmount}, 
              month = ${newMonth}, 
              year = ${newYear},
              updated_at = NOW() 
          WHERE id = ${id} 
          RETURNING *
        `;

        if (updated.length === 0) {
          return c.json({ error: 'Budget not found' }, 404);
        }

        const budget = serializeBudget(updated[0]);
        console.log('✅ Updated budget:', budget);
        return c.json(budget);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to update budget', details: String(error) }, 500);
      }
    });

    app.delete('/api/budgets/:id', async (c) => {
      try {
        const { id } = c.req.param();
        const userId = getUserIdFromHeaders(c);
        
        console.log('🗑️ DELETE /api/budgets/:id - ID:', id);

        // Verify budget belongs to user
        const check = await sql`
          SELECT b.* FROM "Budget" b
          JOIN "Category" c ON b.category_id = c.id
          JOIN "Account" a ON c.account_id = a.id
          WHERE b.id = ${id} AND a.user_id = ${userId}
        `;
        if (check.length === 0) {
          return c.json({ error: 'Budget not found or access denied' }, 404);
        }

        await sql`DELETE FROM "Budget" WHERE id = ${id}`;
        
        const budget = serializeBudget(check[0]);
        console.log('✅ Deleted budget:', budget.id);
        return c.json(budget);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to delete budget', details: String(error) }, 500);
      }
    });

    // ====================================================================
    // ACCOUNTS ENDPOINTS
    // ====================================================================

    // Helper function to serialize account data
    function serializeAccount(account: any) {
      return {
        id: account.id.toString(),
        name: account.name,
        type: account.type,
        balance: Number(account.initial_balance),
        currency: 'EUR',
        note: account.note,
        isActive: account.is_active,
        createdAt: account.created_at,
        updatedAt: account.updated_at,
        userId: account.user_id?.toString(),
        transactionCount: account.transaction_count || 0,
      };
    }

    app.get('/api/accounts', async (c) => {
      try {
        const userId = getUserIdFromHeaders(c);
        console.log('🔍 GET /api/accounts called for user:', userId);

        const accounts = await sql`
          SELECT * FROM "Account" 
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
        `;

        console.log('📊 Found accounts:', accounts.length);

        return c.json(accounts.map(serializeAccount));
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

        const totalBalance = accounts.reduce(
          (sum: number, acc: any) => sum + Number(acc.initial_balance),
          0,
        );
        const activeAccounts = accounts.length;
        const totalAccountsResult =
          await sql`SELECT COUNT(*) as count FROM "Account" WHERE user_id = ${userId}`;
        const totalAccounts = Number(totalAccountsResult[0].count);

        return c.json({
          totalBalance,
          activeAccounts,
          totalAccounts,
        });
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to fetch account statistics', details: String(error) }, 500);
      }
    });

    app.get('/api/accounts/with-balances', async (c) => {
      try {
        const userId = getUserIdFromHeaders(c);
        console.log('🔍 GET /api/accounts/with-balances called for user:', userId);

        const accounts = await sql`
          SELECT a.*, 
            COUNT(DISTINCT t.id) as transaction_count
          FROM "Account" a
          LEFT JOIN "Transaction" t ON t.account_id = a.id
          WHERE a.user_id = ${userId}
          GROUP BY a.id
          ORDER BY a.created_at DESC
        `;

        console.log('📊 Found accounts:', accounts.length);

        // Calculate balances for each account
        const accountsWithBalances = await Promise.all(
          accounts.map(async (account: any) => {
            const transactions = await sql`
            SELECT t.amount, c.transaction_type, t.date
            FROM "Transaction" t
            JOIN "Category" c ON t.category_id = c.id
            WHERE t.account_id = ${account.id}
            ORDER BY t.date DESC
          `;

            let calculatedBalance = Number(account.initial_balance);
            let totalIncome = 0;
            let totalExpenses = 0;

            console.log(
              `\n🔍 Calculating balance for account: ${account.name} (ID: ${account.id})`,
            );
            console.log(`💰 Initial Balance: ${calculatedBalance}€`);

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

            console.log(`💵 Final Balance: ${calculatedBalance}€`);
            console.log(`📊 Total Income: ${totalIncome}€, Total Expenses: ${totalExpenses}€\n`);

            const lastTransaction = transactions[0];

            return {
              ...serializeAccount(account),
              calculatedBalance,
              totalIncome,
              totalExpenses,
              lastTransactionDate: lastTransaction?.date || null,
              transactionCount: Number(account.transaction_count),
            };
          }),
        );

        return c.json(accountsWithBalances);
      } catch (error) {
        console.error('Database error:', error);
        return c.json(
          { error: 'Failed to fetch accounts with balances', details: String(error) },
          500,
        );
      }
    });

    app.post('/api/accounts/recalculate-balances', async (c) => {
      try {
        const userId = getUserIdFromHeaders(c);
        console.log('🔄 POST /api/accounts/recalculate-balances called for user:', userId);

        // With the new schema, we only have initialBalance (no balance field)
        // This endpoint returns all accounts (balances are calculated on-the-fly)
        const accounts =
          await sql`SELECT * FROM "Account" WHERE user_id = ${userId} ORDER BY created_at DESC`;

        console.log('📊 Returning accounts:', accounts.length);
        return c.json(accounts.map(serializeAccount));
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to recalculate balances', details: String(error) }, 500);
      }
    });

    app.get('/api/accounts/:id', async (c) => {
      try {
        const { id } = c.req.param();
        const userId = getUserIdFromHeaders(c);
        const rows =
          await sql`SELECT * FROM "Account" WHERE id = ${id} AND user_id = ${userId} LIMIT 1`;
        if (rows.length === 0) {
          return c.json({ error: 'Account not found' }, 404);
        }
        return c.json(serializeAccount(rows[0]));
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to fetch account', details: String(error) }, 500);
      }
    });

    app.post('/api/accounts', async (c) => {
      try {
        const userId = getUserIdFromHeaders(c);
        console.log('🔄 POST /api/accounts called for user:', userId);

        const body = await c.req.json<{
          name: string;
          type: string;
          balance: number;
          note?: string;
          isActive?: boolean;
        }>();

        console.log('📤 Request body:', body);

        const shouldBeActive = body.isActive ?? true;

        // If new account should be active, deactivate all other accounts for this user
        if (shouldBeActive) {
          await sql`
            UPDATE "Account" 
            SET is_active = false 
            WHERE user_id = ${userId} AND is_active = true
          `;
        }

        const created = await sql`
          INSERT INTO "Account" (user_id, name, type, initial_balance, note, is_active, created_at, updated_at) 
          VALUES (
            ${userId}, 
            ${body.name}, 
            ${body.type}, 
            ${body.balance}, 
            ${body.note || null},
            ${shouldBeActive},
            NOW(), 
            NOW()
          ) 
          RETURNING *
        `;

        console.log('✅ Account created:', created[0].id);
        return c.json(serializeAccount(created[0]), 201);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to create account', details: String(error) }, 500);
      }
    });

    app.patch('/api/accounts/:id', async (c) => {
      try {
        const { id } = c.req.param();
        const userId = getUserIdFromHeaders(c);
        console.log('🔄 PATCH /api/accounts/:id called - ID:', id, 'User:', userId);

        const body = await c.req.json<{
          name?: string;
          type?: string;
          balance?: number;
          note?: string;
          isActive?: boolean;
        }>();

        console.log('📤 Update body:', body);

        // Check if account exists and belongs to user
        const check =
          await sql`SELECT * FROM "Account" WHERE id = ${id} AND user_id = ${userId} LIMIT 1`;
        if (check.length === 0) {
          return c.json({ error: 'Account not found or access denied' }, 404);
        }

        // If setting account to active, deactivate all other accounts
        if (body.isActive === true && !check[0].is_active) {
          await sql`
            UPDATE "Account" 
            SET is_active = false 
            WHERE user_id = ${userId} AND is_active = true AND id != ${id}
          `;
        }

        const updated = await sql`
          UPDATE "Account" 
          SET 
            name = COALESCE(${body.name}, name),
            type = COALESCE(${body.type}, type),
            initial_balance = COALESCE(${body.balance}, initial_balance),
            note = COALESCE(${body.note}, note),
            is_active = COALESCE(${body.isActive}, is_active),
            updated_at = NOW() 
          WHERE id = ${id} AND user_id = ${userId}
          RETURNING *
        `;

        if (updated.length === 0) {
          return c.json({ error: 'Account not found' }, 404);
        }

        console.log('✅ Account updated');
        return c.json(serializeAccount(updated[0]));
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
    
    // Helper function to serialize category data
    function serializeCategory(category: any) {
      return {
        id: category.id.toString(),
        name: category.name,
        accountId: category.account_id?.toString(),
        description: category.description,
        transactionType: category.transaction_type,
        emoji: category.emoji,
        color: category.color,
        createdAt: category.created_at,
        updatedAt: category.updated_at,
        _count: category.transaction_count ? { transactions: Number(category.transaction_count) } : undefined,
        account: category.account_name ? {
          name: category.account_name,
        } : undefined,
      };
    }
    
    app.get('/api/categories', async (c) => {
      try {
        const userId = getUserIdFromHeaders(c);
        const accountId = c.req.query('accountId');
        console.log('🔍 GET /api/categories called for user:', userId, 'accountId:', accountId);
        
        if (accountId) {
          // Filter by specific account - includes direct categories and categories used in transactions
          const account = await sql`SELECT * FROM "Account" WHERE id = ${accountId} AND user_id = ${userId} LIMIT 1`;
          if (account.length === 0) {
            return c.json({ error: 'Account not found or access denied' }, 404);
          }
          
          // Get direct categories
          const directCategories = await sql`
            SELECT c.*, a.name as account_name, COUNT(t.id) as transaction_count
            FROM "Category" c
            LEFT JOIN "Account" a ON c.account_id = a.id
            LEFT JOIN "Transaction" t ON t.category_id = c.id
            WHERE c.account_id = ${accountId}
            GROUP BY c.id, a.name
            ORDER BY c.created_at DESC
          `;
          
          // Get categories used in transactions of this account
          const transactionCategories = await sql`
            SELECT DISTINCT c.*, a.name as account_name, COUNT(t.id) as transaction_count
            FROM "Category" c
            LEFT JOIN "Account" a ON c.account_id = a.id
            JOIN "Transaction" t ON t.category_id = c.id
            WHERE t.account_id = ${accountId}
            GROUP BY c.id, a.name
            ORDER BY c.created_at DESC
          `;
          
          // Merge and deduplicate by category id
          const categoryMap = new Map();
          [...directCategories, ...transactionCategories].forEach(cat => {
            if (!categoryMap.has(cat.id.toString())) {
              categoryMap.set(cat.id.toString(), cat);
            }
          });
          
          const categories = Array.from(categoryMap.values());
          console.log('📊 Found categories for account:', categories.length);
          return c.json(categories.map(serializeCategory));
        }
        
        // Get all categories for user
        const categories = await sql`
          SELECT c.*, a.name as account_name, COUNT(t.id) as transaction_count
          FROM "Category" c
          LEFT JOIN "Account" a ON c.account_id = a.id
          LEFT JOIN "Transaction" t ON t.category_id = c.id
          WHERE a.user_id = ${userId}
          GROUP BY c.id, a.name
          ORDER BY c.created_at DESC
        `;
        
        console.log('📊 Found total categories:', categories.length);
        return c.json(categories.map(serializeCategory));
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
        console.log('🔄 POST /api/categories/auto-assign called - Account:', accountId);

        // Verify account belongs to user
        const account =
          await sql`SELECT * FROM "Account" WHERE id = ${accountId} AND user_id = ${userId} LIMIT 1`;
        if (account.length === 0) {
          return c.json({ error: 'Account not found or access denied' }, 404);
        }

        // Find all categories that have transactions for this account
        const categories = await sql`
          SELECT DISTINCT c.*, a.name as account_name, COUNT(t.id) as transaction_count
          FROM "Category" c
          LEFT JOIN "Account" a ON c.account_id = a.id
          JOIN "Transaction" t ON t.category_id = c.id
          WHERE t.account_id = ${accountId}
          GROUP BY c.id, a.name
          ORDER BY transaction_count DESC
        `;

        console.log('📊 Found categories with transactions:', categories.length);
        return c.json(categories.map(serializeCategory));
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
          SELECT c.*, a.name as account_name
          FROM "Category" c
          JOIN "Account" a ON c.account_id = a.id
          WHERE c.id = ${id} AND a.user_id = ${userId}
          LIMIT 1
        `;
        if (rows.length === 0) {
          return c.json({ error: 'Category not found' }, 404);
        }
        return c.json(serializeCategory(rows[0]));
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to fetch category', details: String(error) }, 500);
      }
    });

    app.post('/api/categories', async (c) => {
      try {
        const userId = getUserIdFromHeaders(c);
        console.log('🔄 POST /api/categories called for user:', userId);
        
        const body = await c.req.json<{
          accountId: string;
          name: string;
          description?: string;
          transactionType: string;
          emoji: string;
          color: string;
        }>();
        
        console.log('📤 Create category body:', body);

        // Verify account belongs to user
        const account =
          await sql`SELECT * FROM "Account" WHERE id = ${body.accountId} AND user_id = ${userId} LIMIT 1`;
        if (account.length === 0) {
          return c.json({ error: 'Account not found or access denied' }, 404);
        }

        const created = await sql`
          INSERT INTO "Category" (
            account_id, name, description, transaction_type, emoji, color, created_at, updated_at
          ) 
          VALUES (
            ${body.accountId},
            ${body.name},
            ${body.description || null},
            ${body.transactionType},
            ${body.emoji},
            ${body.color},
            NOW(),
            NOW()
          ) 
          RETURNING *
        `;
        
        console.log('✅ Category created:', created[0].id);
        return c.json(serializeCategory(created[0]), 201);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to create category', details: String(error) }, 500);
      }
    });

    app.patch('/api/categories/:id', async (c) => {
      try {
        const { id } = c.req.param();
        const userId = getUserIdFromHeaders(c);
        console.log('🔄 PATCH /api/categories/:id called - ID:', id, 'User:', userId);
        
        const body = await c.req.json<{
          name?: string;
          description?: string;
          emoji?: string;
          color?: string;
        }>();
        
        console.log('📤 Update category body:', body);

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

        console.log('✅ Category updated');
        return c.json(serializeCategory(updated[0]));
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to update category', details: String(error) }, 500);
      }
    });

    app.delete('/api/categories/:id', async (c) => {
      try {
        const { id } = c.req.param();
        const userId = getUserIdFromHeaders(c);
        console.log('🗑️ DELETE /api/categories/:id called - ID:', id);

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
        console.log('✅ Category deleted');
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
        return c.json(
          { error: 'Failed to assign category to account', details: String(error) },
          500,
        );
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
        return c.json(
          { error: 'Failed to remove category from account', details: String(error) },
          500,
        );
      }
    });

    app.get('/api/categories/:id/accounts', async (c) => {
      try {
        const { id } = c.req.param();
        const userId = getUserIdFromHeaders(c);
        console.log('🔍 GET /api/categories/:id/accounts - Category:', id);

        // Get category with its account (verify user ownership)
        const rows = await sql`
          SELECT c.*, a.name as account_name, a.type as account_type, a.id as account_id
          FROM "Category" c
          JOIN "Account" a ON c.account_id = a.id
          WHERE c.id = ${id} AND a.user_id = ${userId}
        `;

        if (rows.length === 0) {
          return c.json({ error: 'Category not found' }, 404);
        }

        const category = rows[0];
        return c.json([{ 
          category: serializeCategory(category), 
          account: {
            id: category.account_id.toString(),
            name: category.account_name,
            type: category.account_type,
          }
        }]);
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
        const accountId = c.req.query('accountId');
        
        console.log('🔍 GET /api/transactions - AccountId:', accountId);
        
        let transactions;
        if (accountId) {
          transactions = await sql`
            SELECT 
              t.*,
              a.name as account_name,
              c.name as category_name,
              c.emoji as category_emoji,
              c.color as category_color,
              c.transaction_type as category_transaction_type
            FROM "Transaction" t
            LEFT JOIN "Account" a ON t.account_id = a.id
            LEFT JOIN "Category" c ON t.category_id = c.id
            WHERE a.user_id = ${userId} AND a.id = ${accountId}
            ORDER BY t.date DESC, t.created_at DESC
          `;
        } else {
          transactions = await sql`
            SELECT 
              t.*,
              a.name as account_name,
              c.name as category_name,
              c.emoji as category_emoji,
              c.color as category_color,
              c.transaction_type as category_transaction_type
            FROM "Transaction" t
            LEFT JOIN "Account" a ON t.account_id = a.id
            LEFT JOIN "Category" c ON t.category_id = c.id
            WHERE a.user_id = ${userId}
            ORDER BY t.date DESC, t.created_at DESC
          `;
        }
        
        const serialized = transactions.map(serializeTransaction);
        console.log('📊 Returning transactions:', serialized.length);
        return c.json(serialized);
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
        const account =
          await sql`SELECT * FROM "Account" WHERE id = ${options.targetAccountId} AND user_id = ${userId} LIMIT 1`;
        if (account.length === 0) {
          return c.json({ error: 'Account not found or access denied' }, 404);
        }

        const result = {
          total: data.length,
          successful: 0,
          skipped: 0,
          errors: 0,
          errorDetails: [] as Array<{ row: number; data: any; error: string }>,
          createdTransactions: [] as any[],
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
          { type: 'EXPENSE', name: 'Unbekannte Ausgaben', emoji: '❓', color: '#F44336' },
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
            const categoryName =
              transactionType === 'INCOME' ? 'Unbekannte Einnahmen' : 'Unbekannte Ausgaben';

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
              error: error instanceof Error ? error.message : 'Unbekannter Fehler',
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
          SELECT 
            t.*,
            a.name as account_name,
            c.name as category_name,
            c.emoji as category_emoji,
            c.color as category_color,
            c.transaction_type as category_transaction_type
          FROM "Transaction" t
          LEFT JOIN "Account" a ON t.account_id = a.id
          LEFT JOIN "Category" c ON t.category_id = c.id
          WHERE t.id = ${id} AND a.user_id = ${userId}
          LIMIT 1
        `;
        if (rows.length === 0) {
          return c.json({ error: 'Transaction not found' }, 404);
        }
        
        const transaction = serializeTransaction(rows[0]);
        return c.json(transaction);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to fetch transaction', details: String(error) }, 500);
      }
    });

    app.post('/api/transactions', async (c) => {
      try {
        const userId = getUserIdFromHeaders(c);
        const body = await c.req.json<{
          accountId: number;
          categoryId?: number;
          amount: number;
          note?: string;
          title?: string;
          description?: string;
          date: string;
          type?: string; // Frontend sends type but it's ignored (derived from category)
        }>();
        
        console.log('📝 POST /api/transactions - Body:', body);
        
        // Use title or description as note (backend pattern)
        const note = body.note || body.title || body.description || null;

        // Verify account belongs to user
        const account =
          await sql`SELECT * FROM "Account" WHERE id = ${body.accountId} AND user_id = ${userId} LIMIT 1`;
        if (account.length === 0) {
          return c.json({ error: 'Account not found or access denied' }, 404);
        }

        // Verify category belongs to user (if provided)
        if (body.categoryId) {
          const category = await sql`
            SELECT c.* FROM "Category" c
            JOIN "Account" a ON c.account_id = a.id
            WHERE c.id = ${body.categoryId} AND a.user_id = ${userId}
            LIMIT 1
          `;
          if (category.length === 0) {
            return c.json({ error: 'Category not found or access denied' }, 404);
          }
        }

        const created = await sql`
          INSERT INTO "Transaction" (account_id, category_id, amount, note, date, created_at, updated_at) 
          VALUES (
            ${body.accountId},
            ${body.categoryId || null},
            ${body.amount},
            ${note},
            ${body.date},
            NOW(),
            NOW()
          ) 
          RETURNING *
        `;
        
        // Fetch full transaction with relations for serialization
        const full = await sql`
          SELECT 
            t.*,
            a.name as account_name,
            c.name as category_name,
            c.emoji as category_emoji,
            c.color as category_color,
            c.transaction_type as category_transaction_type
          FROM "Transaction" t
          LEFT JOIN "Account" a ON t.account_id = a.id
          LEFT JOIN "Category" c ON t.category_id = c.id
          WHERE t.id = ${created[0].id}
          LIMIT 1
        `;
        
        const transaction = serializeTransaction(full[0]);
        console.log('✅ Created transaction:', transaction);
        return c.json(transaction, 201);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to create transaction', details: String(error) }, 500);
      }
    });

    app.patch('/api/transactions/:id', async (c) => {
      try {
        const { id } = c.req.param();
        const userId = getUserIdFromHeaders(c);
        const body = await c.req.json<{ 
          amount?: number; 
          note?: string; 
          title?: string;
          description?: string;
          date?: string;
          categoryId?: number;
          accountId?: number;
        }>();
        
        console.log('✏️ PATCH /api/transactions/:id - ID:', id, 'Body:', body);
        
        // Use title or description as note (backend pattern)
        const note = body.note !== undefined ? body.note : (body.title || body.description);

        // Verify transaction belongs to user
        const check = await sql`
          SELECT t.* FROM "Transaction" t
          JOIN "Account" a ON t.account_id = a.id
          WHERE t.id = ${id} AND a.user_id = ${userId}
        `;
        if (check.length === 0) {
          return c.json({ error: 'Transaction not found or access denied' }, 404);
        }

        // Verify new category belongs to user (if provided)
        if (body.categoryId) {
          const category = await sql`
            SELECT c.* FROM "Category" c
            JOIN "Account" a ON c.account_id = a.id
            WHERE c.id = ${body.categoryId} AND a.user_id = ${userId}
            LIMIT 1
          `;
          if (category.length === 0) {
            return c.json({ error: 'Category not found or access denied' }, 404);
          }
        }

        // Verify new account belongs to user (if provided)
        if (body.accountId) {
          const account = await sql`
            SELECT * FROM "Account" WHERE id = ${body.accountId} AND user_id = ${userId} LIMIT 1
          `;
          if (account.length === 0) {
            return c.json({ error: 'Account not found or access denied' }, 404);
          }
        }

        const current = check[0];
        const updated = await sql`
          UPDATE "Transaction" 
          SET 
            amount = ${body.amount !== undefined ? body.amount : Number(current.amount)},
            note = ${note !== undefined ? note : current.note},
            date = ${body.date !== undefined ? body.date : current.date},
            category_id = ${body.categoryId !== undefined ? body.categoryId : current.category_id},
            account_id = ${body.accountId !== undefined ? body.accountId : current.account_id},
            updated_at = NOW() 
          WHERE id = ${id} 
          RETURNING *
        `;

        if (updated.length === 0) {
          return c.json({ error: 'Transaction not found' }, 404);
        }

        // Fetch full transaction with relations for serialization
        const full = await sql`
          SELECT 
            t.*,
            a.name as account_name,
            c.name as category_name,
            c.emoji as category_emoji,
            c.color as category_color,
            c.transaction_type as category_transaction_type
          FROM "Transaction" t
          LEFT JOIN "Account" a ON t.account_id = a.id
          LEFT JOIN "Category" c ON t.category_id = c.id
          WHERE t.id = ${id}
          LIMIT 1
        `;

        const transaction = serializeTransaction(full[0]);
        console.log('✅ Updated transaction:', transaction);
        return c.json(transaction);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to update transaction', details: String(error) }, 500);
      }
    });

    app.delete('/api/transactions/:id', async (c) => {
      try {
        const { id } = c.req.param();
        const userId = getUserIdFromHeaders(c);
        
        console.log('🗑️ DELETE /api/transactions/:id - ID:', id);

        // Verify transaction belongs to user and fetch it for serialization
        const check = await sql`
          SELECT 
            t.*,
            a.name as account_name,
            c.name as category_name,
            c.emoji as category_emoji,
            c.color as category_color,
            c.transaction_type as category_transaction_type
          FROM "Transaction" t
          LEFT JOIN "Account" a ON t.account_id = a.id
          LEFT JOIN "Category" c ON t.category_id = c.id
          WHERE t.id = ${id} AND a.user_id = ${userId}
        `;
        if (check.length === 0) {
          return c.json({ error: 'Transaction not found or access denied' }, 404);
        }

        await sql`DELETE FROM "Transaction" WHERE id = ${id}`;
        
        const transaction = serializeTransaction(check[0]);
        console.log('✅ Deleted transaction:', transaction.id);
        return c.json(transaction);
      } catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Failed to delete transaction', details: String(error) }, 500);
      }
    });

    return app.fetch(req, env, ctx);
  },
};

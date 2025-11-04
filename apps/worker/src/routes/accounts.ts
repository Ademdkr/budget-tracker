import type { Hono } from 'hono';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import { getUserIdFromHeaders, serializeAccount } from '../utils/helpers';

/**
 * Register account routes
 */
export function registerAccountRoutes(app: Hono<any>, sql: NeonQueryFunction<false, false>) {
  /**
   * Get all accounts for user
   */
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

  /**
   * Get account statistics
   */
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

  /**
   * Get accounts with calculated balances
   */
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

          console.log(`\n🔍 Calculating balance for account: ${account.name} (ID: ${account.id})`);
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

  /**
   * Recalculate account balances
   */
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

  /**
   * Get single account by ID
   */
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

  /**
   * Create new account
   */
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

  /**
   * Update account
   */
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

  /**
   * Delete account (soft delete if has transactions)
   */
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
}

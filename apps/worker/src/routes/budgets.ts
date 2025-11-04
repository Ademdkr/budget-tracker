import type { Hono } from 'hono';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import { getUserIdFromHeaders, serializeBudget } from '../utils/helpers';

/**
 * Register budget routes
 */
export function registerBudgetRoutes(app: Hono<any>, sql: NeonQueryFunction<false, false>) {
  /**
   * Get all budgets for user
   */
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

  /**
   * Get budgets with statistics (spending vs limits)
   */
  app.get('/api/budgets/with-stats', async (c) => {
    try {
      const userId = getUserIdFromHeaders(c);
      const year = c.req.query('year');
      const month = c.req.query('month');
      const accountId = c.req.query('accountId');

      console.log(
        '🔍 GET /api/budgets/with-stats - Year:',
        year,
        'Month:',
        month,
        'AccountId:',
        accountId,
      );

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
      const budgetsWithStats = await Promise.all(
        budgets.map(async (budget: any) => {
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

          const currentAmount = transactions.reduce(
            (sum: number, t: any) => sum + Number(t.amount),
            0,
          );
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
        }),
      );

      console.log('📊 Returning budgets with stats:', budgetsWithStats.length);
      return c.json(budgetsWithStats);
    } catch (error) {
      console.error('Database error:', error);
      return c.json({ error: 'Failed to fetch budgets with stats', details: String(error) }, 500);
    }
  });

  /**
   * Get single budget by ID
   */
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

  /**
   * Create new budget
   */
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

  /**
   * Update budget
   */
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
      const newTotalAmount =
        body.totalAmount !== undefined ? body.totalAmount : Number(current.total_amount);
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

  /**
   * Delete budget
   */
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
}

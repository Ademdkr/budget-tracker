import type { Hono } from 'hono';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import { getUserIdFromHeaders, serializeCategory } from '../utils/helpers';

/**
 * Register category routes
 */
export function registerCategoryRoutes(app: Hono<any>, sql: NeonQueryFunction<false, false>) {
  /**
   * Get all categories for user (optionally filtered by account)
   */
  app.get('/api/categories', async (c) => {
    try {
      const userId = getUserIdFromHeaders(c);
      const accountId = c.req.query('accountId');
      console.log('🔍 GET /api/categories called for user:', userId, 'accountId:', accountId);

      if (accountId) {
        // Filter by specific account - includes direct categories and categories used in transactions
        const account =
          await sql`SELECT * FROM "Account" WHERE id = ${accountId} AND user_id = ${userId} LIMIT 1`;
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
        [...directCategories, ...transactionCategories].forEach((cat) => {
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

  /**
   * Auto-assign categories based on transaction usage
   */
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

  /**
   * Get single category by ID
   */
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

  /**
   * Create new category
   */
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

  /**
   * Update category
   */
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

  /**
   * Delete category
   */
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

  /**
   * Assign category to account
   */
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

  /**
   * Remove category from account (delete category)
   */
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

  /**
   * Get accounts associated with category
   */
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
      return c.json([
        {
          category: serializeCategory(category),
          account: {
            id: category.account_id.toString(),
            name: category.account_name,
            type: category.account_type,
          },
        },
      ]);
    } catch (error) {
      console.error('Database error:', error);
      return c.json({ error: 'Failed to fetch category accounts', details: String(error) }, 500);
    }
  });
}

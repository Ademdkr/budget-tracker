import type { Hono } from 'hono';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import { getUserIdFromHeaders, serializeTransaction } from '../utils/helpers';

/**
 * Register transaction routes
 */
export function registerTransactionRoutes(app: Hono<any>, sql: NeonQueryFunction<false, false>) {
  /**
   * Get all transactions for user (optionally filtered by account)
   */
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

  /**
   * Import transactions from CSV data
   */
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

      console.log(
        '📥 POST /api/transactions/import - Data rows:',
        data.length,
        'Options:',
        options,
      );

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

      // Serialize created transactions
      const serializedTransactions = await Promise.all(
        result.createdTransactions.map(async (t) => {
          // Fetch full transaction with relations for proper serialization
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
            WHERE t.id = ${t.id}
            LIMIT 1
          `;
          return full.length > 0 ? serializeTransaction(full[0]) : t;
        }),
      );

      console.log('✅ Import completed - Successful:', result.successful, 'Errors:', result.errors);
      return c.json({
        ...result,
        createdTransactions: serializedTransactions,
      });
    } catch (error) {
      console.error('Import error:', error);
      return c.json({ error: 'Failed to import transactions', details: String(error) }, 500);
    }
  });

  /**
   * Get single transaction by ID
   */
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

  /**
   * Create new transaction
   */
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

  /**
   * Update transaction
   */
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
      const note = body.note !== undefined ? body.note : body.title || body.description;

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

  /**
   * Delete transaction
   */
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
}

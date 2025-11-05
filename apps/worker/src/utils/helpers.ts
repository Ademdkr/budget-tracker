import type { Context } from 'hono';

/**
 * Generiert einen Mock-JWT-Token für Entwicklungs-/Demo-Zwecke
 *
 * WICHTIG: Dies ist NUR für Demo-Zwecke gedacht!
 * In Produktion sollte ein echtes JWT-Signing mit Secret verwendet werden.
 *
 * @param email - Benutzer-Email
 * @param userId - Benutzer-ID
 * @returns Mock JWT-Token (Header.Payload.Signature)
 *
 * @example
 * ```typescript
 * const token = generateMockToken('user@example.com', 123);
 * // Returns: "eyJ...}.eyJ...}.mock-signature"
 * ```
 */
export function generateMockToken(email: string, userId: number): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
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

/**
 * Extrahiert User-ID aus Request-Headers
 *
 * Sucht nach 'x-user-id' Header und gibt diesen zurück.
 * Falls nicht vorhanden, wird Test-User-ID '1' zurückgegeben.
 *
 * @param c - Hono Context-Objekt
 * @returns User-ID als String
 *
 * @example
 * ```typescript
 * app.get('/api/data', (c) => {
 *   const userId = getUserIdFromHeaders(c);
 *   // Use userId for queries...
 * });
 * ```
 */
export function getUserIdFromHeaders(c: Context): string {
  const userId = c.req.header('x-user-id');
  if (!userId) {
    console.log('⚠️ No user ID in headers, using test user ID');
    return '1'; // Test User ID
  }
  return userId;
}

/**
 * Serialisiert Account-Daten von Datenbankformat zu API-Format
 *
 * Konvertiert Snake_case zu CamelCase und passt Datentypen an.
 *
 * @param account - Account-Objekt aus Datenbank
 * @returns Serialisiertes Account-Objekt für API
 *
 * @example
 * ```typescript
 * const dbAccount = await sql`SELECT * FROM "Account" WHERE id = 1`;
 * const apiAccount = serializeAccount(dbAccount[0]);
 * // Returns: { id: "1", name: "...", balance: 1000, ... }
 * ```
 */
export function serializeAccount(account: any) {
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

/**
 * Serialisiert Kategorie-Daten von Datenbankformat zu API-Format
 *
 * Konvertiert Snake_case zu CamelCase, fügt Statistiken hinzu.
 *
 * @param category - Kategorie-Objekt aus Datenbank
 * @returns Serialisiertes Kategorie-Objekt für API
 *
 * @example
 * ```typescript
 * const dbCategory = await sql`SELECT * FROM "Category" WHERE id = 1`;
 * const apiCategory = serializeCategory(dbCategory[0]);
 * // Returns: { id: "1", name: "...", transactionType: "EXPENSE", ... }
 * ```
 */
export function serializeCategory(category: any) {
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
    _count: category.transaction_count
      ? { transactions: Number(category.transaction_count) }
      : undefined,
    account: category.account_name
      ? {
          name: category.account_name,
        }
      : undefined,
  };
}

/**
 * Serialisiert Budget-Daten von Datenbankformat zu API-Format
 *
 * Konvertiert Snake_case zu CamelCase, fügt Kategorie-Informationen hinzu.
 *
 * @param budget - Budget-Objekt aus Datenbank
 * @returns Serialisiertes Budget-Objekt für API
 *
 * @example
 * ```typescript
 * const dbBudget = await sql`SELECT * FROM "Budget" WHERE id = 1`;
 * const apiBudget = serializeBudget(dbBudget[0]);
 * // Returns: { id: "1", totalAmount: 500, month: 11, year: 2025, ... }
 * ```
 */
export function serializeBudget(budget: any) {
  return {
    id: budget.id.toString(),
    categoryId: budget.category_id?.toString(),
    year: budget.year,
    month: budget.month,
    totalAmount: Number(budget.total_amount),
    createdAt: budget.created_at,
    updatedAt: budget.updated_at,
    category: budget.category_name
      ? {
          id: budget.category_id?.toString(),
          name: budget.category_name,
          emoji: budget.category_emoji,
          color: budget.category_color,
        }
      : undefined,
  };
}

/**
 * Serialisiert Transaktions-Daten von Datenbankformat zu API-Format
 *
 * Konvertiert Snake_case zu CamelCase, mappt note zu title/description,
 * fügt Kategorie- und Account-Informationen hinzu.
 *
 * @param transaction - Transaktions-Objekt aus Datenbank
 * @returns Serialisiertes Transaktions-Objekt für API
 *
 * @example
 * ```typescript
 * const dbTx = await sql`SELECT * FROM "Transaction" WHERE id = 1`;
 * const apiTx = serializeTransaction(dbTx[0]);
 * // Returns: { id: "1", amount: 50.00, date: "2025-11-05", ... }
 * ```
 */
export function serializeTransaction(transaction: any) {
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
    account: transaction.account_name
      ? {
          id: transaction.account_id?.toString(),
          name: transaction.account_name,
        }
      : undefined,
    category: transaction.category_name
      ? {
          id: transaction.category_id?.toString(),
          name: transaction.category_name,
          emoji: transaction.category_emoji,
          color: transaction.category_color,
        }
      : undefined,
  };
}

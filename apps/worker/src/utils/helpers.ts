import type { Context } from 'hono';

/**
 * Generate a mock JWT token for development/demo purposes
 * TODO: Replace with proper JWT signing in production
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
 * Extract user ID from request headers
 * Falls back to test user ID if not present
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
 * Serialize account data from database format to API format
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
 * Serialize category data from database format to API format
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
 * Serialize budget data from database format to API format
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
 * Serialize transaction data from database format to API format
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

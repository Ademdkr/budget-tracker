import type { Hono } from 'hono';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import { generateMockToken } from '../utils/helpers';

/**
 * Register auth routes
 */
export function registerAuthRoutes(app: Hono<any>, sql: NeonQueryFunction<false, false>) {
  /**
   * Login endpoint
   * TODO: Implement proper password hashing with bcrypt in production
   */
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

  /**
   * Register new user endpoint
   * TODO: Implement proper password hashing with bcrypt in production
   */
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

  /**
   * Get all users endpoint (for development/admin)
   */
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
}

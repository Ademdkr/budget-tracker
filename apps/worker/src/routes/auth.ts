import type { Hono } from 'hono';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import { generateMockToken } from '../utils/helpers';

/**
 * Registriert Authentifizierungs-Routen
 *
 * Endpoints:
 * - POST /api/auth/login: Benutzer-Login
 * - POST /api/auth/register: Benutzer-Registrierung
 * - GET /api/auth/users: Alle Benutzer abrufen (Admin/Dev)
 *
 * Features:
 * - Mock JWT-Token-Generierung (TODO: Echtes JWT in Produktion)
 * - Email-basierte Authentifizierung
 * - User-Management
 *
 * Security Notes:
 * - Aktuell OHNE Passwort-Hashing (nur Demo!)
 * - TODO: bcrypt für Passwort-Hashing implementieren
 * - TODO: Echte JWT-Signierung mit Secret
 *
 * @param app - Hono App-Instanz
 * @param sql - Neon SQL Query-Funktion
 *
 * @example
 * ```typescript
 * const app = new Hono();
 * const sql = neon(DATABASE_URL);
 * registerAuthRoutes(app, sql);
 * ```
 */
export function registerAuthRoutes(app: Hono<any>, sql: NeonQueryFunction<false, false>) {
  /**
   * Login-Endpoint
   *
   * Authentifiziert Benutzer anhand von Email.
   * TODO: Passwort-Vergleich mit bcrypt implementieren
   *
   * @route POST /api/auth/login
   * @body { email: string, password: string }
   * @returns { accessToken: string, refreshToken: string, user: User }
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
   * Registrierungs-Endpoint
   *
   * Erstellt neuen Benutzer in der Datenbank.
   * TODO: Passwort-Hashing mit bcrypt implementieren
   *
   * @route POST /api/auth/register
   * @body { email: string, password: string, name: string, surname: string }
   * @returns { accessToken: string, refreshToken: string, user: User }
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
   * Alle Benutzer abrufen (Admin/Development)
   *
   * Gibt Liste aller registrierten Benutzer zurück.
   *
   * @route GET /api/auth/users
   * @returns User[] - Array mit Benutzer-Objekten
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

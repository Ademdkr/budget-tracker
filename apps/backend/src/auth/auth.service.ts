import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

/**
 * Service für Authentifizierung und Benutzerverwaltung
 *
 * Verwaltet Login-Prozess und Token-Generierung.
 * ⚠️ WICHTIG: Aktuelle Implementierung ist NICHT produktionsreif!
 * Passwörter werden im Klartext gespeichert und verglichen.
 *
 * @todo Implementiere bcrypt für Password-Hashing
 * @todo Verwende @nestjs/jwt für echte JWT-Token
 * @todo Implementiere Refresh-Token-Rotation
 * @todo Füge Rate-Limiting hinzu
 */
@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  /**
   * Authentifiziert einen Benutzer
   *
   * ⚠️ Demo-Implementierung: Passwörter werden unverschlüsselt verglichen!
   * In Produktion sollte bcrypt.compare() verwendet werden.
   *
   * @param loginDto - Login-Credentials (email, password)
   * @returns Auth-Response mit Tokens und Benutzer-Informationen
   * @throws {Error} Wenn Benutzer nicht gefunden oder Passwort ungültig
   *
   * @example
   * ```typescript
   * const auth = await login({ email: 'user@example.com', password: 'secret' });
   * // {
   * //   accessToken: 'eyJhbG...',
   * //   refreshToken: 'refresh-token-...',
   * //   user: { id: '1', name: 'John', email: 'user@example.com' }
   * // }
   * ```
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Benutzer nicht gefunden');
    }

    // In production, you should hash passwords and compare properly
    if (user.password !== password) {
      throw new Error('Ungültiges Passwort');
    }

    // Generate tokens (simplified for demo)
    const accessToken = this.generateToken(user.id.toString(), user.email);
    const refreshToken = this.generateRefreshToken(user.id.toString());

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id.toString(),
        name: user.name,
        surname: user.surname,
        email: user.email,
      },
    };
  }

  /**
   * Ruft alle Benutzer ab (Development-Endpoint)
   *
   * ⚠️ Nur für Development! In Produktion sollte dieser Endpoint
   * durch Admin-Authentifizierung geschützt werden.
   *
   * @returns Array aller Benutzer ohne Passwort-Feld
   */
  async findAllUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        createdAt: true,
      },
    });

    // Convert BigInt to string for JSON serialization
    return users.map((user) => ({
      ...user,
      id: user.id.toString(),
    }));
  }

  /**
   * Generiert einen Access-Token (Mock-Implementierung)
   *
   * ⚠️ Demo-Implementierung: Verwendet keine echte Signatur!
   * In Produktion sollte @nestjs/jwt verwendet werden.
   *
   * @param userId - Die ID des Benutzers
   * @param email - Die E-Mail-Adresse des Benutzers
   * @returns JWT Access Token (gültig 24h)
   * @private
   */
  private generateToken(userId: string, email: string): string {
    // In production, use proper JWT library
    const header = Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    ).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        sub: userId,
        email: email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
      }),
    ).toString('base64url');
    const signature = 'mock-signature';
    return `${header}.${payload}.${signature}`;
  }

  /**
   * Generiert einen Refresh-Token (Mock-Implementierung)
   *
   * ⚠️ Demo-Implementierung: Token wird nicht in Datenbank gespeichert!
   * In Produktion sollten Refresh-Tokens persistent gespeichert und
   * mit Rotation implementiert werden.
   *
   * @param userId - Die ID des Benutzers
   * @returns Refresh Token
   * @private
   */
  private generateRefreshToken(userId: string): string {
    // In production, use proper JWT library and store in database
    return `refresh-token-${userId}-${Date.now()}`;
  }
}

import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Authentifizierungs-Modul
 *
 * Verwaltet Benutzer-Authentifizierung und JWT-Token-Verwaltung.
 *
 * Features:
 * - Benutzer-Registrierung
 * - Login mit Email/Passwort
 * - JWT Access & Refresh Tokens
 * - Token-Refresh-Mechanismus
 * - Passwort-Hashing mit bcrypt
 *
 * Endpoints:
 * - POST /api/auth/register: Neue Benutzer registrieren
 * - POST /api/auth/login: Benutzer anmelden
 * - POST /api/auth/refresh: Access-Token erneuern
 *
 * @example
 * ```typescript
 * // In anderen Modulen verwenden
 * @Module({
 *   imports: [AuthModule],
 *   // ...
 * })
 * ```
 */
@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}

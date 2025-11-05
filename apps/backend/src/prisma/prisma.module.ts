import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Prisma-Modul für Datenbank-Zugriff
 *
 * Stellt PrismaService global für alle Feature-Module bereit.
 * Der Service verwaltet die Datenbank-Verbindung und bietet
 * typsichere Queries über Prisma Client.
 *
 * Features:
 * - Automatisches Connection Management
 * - Type-safe Database Queries
 * - Export von PrismaService für andere Module
 *
 * @example
 * ```typescript
 * // In Feature-Modul importieren
 * @Module({
 *   imports: [PrismaModule],
 *   // ...
 * })
 * export class MyModule {}
 * ```
 */
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

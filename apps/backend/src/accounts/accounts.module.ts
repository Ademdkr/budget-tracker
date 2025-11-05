import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Konten-Verwaltungs-Modul
 *
 * Verwaltet Bankkonten und Zahlungsmethoden der Benutzer.
 *
 * Features:
 * - CRUD-Operationen für Konten
 * - Benutzer-spezifische Konten-Verwaltung
 * - Initialer Kontostand-Verwaltung
 * - Soft-Delete-Unterstützung
 *
 * Endpoints:
 * - GET /api/accounts: Alle Konten abrufen
 * - POST /api/accounts: Neues Konto erstellen
 * - GET /api/accounts/:id: Einzelnes Konto abrufen
 * - PATCH /api/accounts/:id: Konto aktualisieren
 * - DELETE /api/accounts/:id: Konto löschen
 *
 * @example
 * ```typescript
 * // In anderen Modulen verwenden
 * @Module({
 *   imports: [AccountsModule],
 *   // ...
 * })
 * ```
 */
@Module({
  imports: [PrismaModule],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}

import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Transaktions-Verwaltungs-Modul
 *
 * Verwaltet Einnahmen und Ausgaben-Transaktionen.
 *
 * Features:
 * - CRUD-Operationen für Transaktionen
 * - CSV-Import von Transaktionen
 * - Automatische Kategorisierung (Uncategorized)
 * - Filterung nach Account, Kategorie, Datumsbereich
 * - Bulk-Import-Unterstützung
 * - Transaktionstyp-Erkennung (INCOME/EXPENSE)
 *
 * Endpoints:
 * - GET /api/transactions: Alle Transaktionen abrufen (mit Filtern)
 * - POST /api/transactions: Neue Transaktion erstellen
 * - POST /api/transactions/import: CSV-Bulk-Import
 * - GET /api/transactions/:id: Einzelne Transaktion abrufen
 * - PATCH /api/transactions/:id: Transaktion aktualisieren
 * - DELETE /api/transactions/:id: Transaktion löschen
 *
 * @example
 * ```typescript
 * // Transaktion erstellen
 * POST /api/transactions
 * {
 *   amount: -50.00,
 *   categoryId: "cat-123",
 *   accountId: "acc-456",
 *   date: "2025-11-05",
 *   note: "Einkauf Lebensmittel"
 * }
 * ```
 */
@Module({
  imports: [PrismaModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}

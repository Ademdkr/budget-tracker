import { Module } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { BudgetsController } from './budgets.controller';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Budget-Verwaltungs-Modul
 *
 * Verwaltet monatliche Budgets pro Kategorie.
 *
 * Features:
 * - CRUD-Operationen für Budgets
 * - Monatliche Budget-Limits pro Kategorie
 * - Automatische Berechnung von Ausgaben
 * - Fortschritts-Tracking (spent vs. limit)
 * - Benutzer-spezifische Budgets
 * - Statistiken mit aktuellen Ausgaben
 *
 * Endpoints:
 * - GET /api/budgets: Alle Budgets abrufen (mit Statistiken)
 * - POST /api/budgets: Neues Budget erstellen
 * - GET /api/budgets/:id: Einzelnes Budget abrufen
 * - PATCH /api/budgets/:id: Budget aktualisieren
 * - DELETE /api/budgets/:id: Budget löschen
 *
 * @example
 * ```typescript
 * // Budget für November 2025 erstellen
 * POST /api/budgets
 * {
 *   categoryId: "cat-123",
 *   totalAmount: 500.00,
 *   month: 11,
 *   year: 2025
 * }
 * ```
 */
@Module({
  imports: [PrismaModule],
  providers: [BudgetsService],
  controllers: [BudgetsController],
})
export class BudgetsModule {}

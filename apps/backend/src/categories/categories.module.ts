import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Kategorien-Verwaltungs-Modul
 *
 * Verwaltet Einnahmen- und Ausgaben-Kategorien.
 *
 * Features:
 * - CRUD-Operationen für Kategorien
 * - Konto-spezifische Kategorien
 * - Transaktionstyp-Zuordnung (INCOME/EXPENSE)
 * - Icon/Emoji-Unterstützung
 * - Farb-Zuordnung für UI
 * - Statistiken (Transaktionsanzahl, Gesamtbetrag)
 *
 * Endpoints:
 * - GET /api/categories: Alle Kategorien abrufen (mit Statistiken)
 * - POST /api/categories: Neue Kategorie erstellen
 * - GET /api/categories/:id: Einzelne Kategorie abrufen
 * - PATCH /api/categories/:id: Kategorie aktualisieren
 * - DELETE /api/categories/:id: Kategorie löschen
 *
 * @example
 * ```typescript
 * // In anderen Modulen verwenden
 * @Module({
 *   imports: [CategoriesModule],
 *   // ...
 * })
 * ```
 */
@Module({
  imports: [PrismaModule],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}

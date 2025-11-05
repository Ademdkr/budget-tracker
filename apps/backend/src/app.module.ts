import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { BudgetsModule } from './budgets/budgets.module';
import { CategoriesModule } from './categories/categories.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AccountsModule } from './accounts/accounts.module';
import { AuthModule } from './auth/auth.module';
import * as Joi from 'joi';

/**
 * Haupt-Modul der NestJS-Anwendung
 *
 * Konfiguriert alle Feature-Module und globale Services:
 * - ConfigModule: Umgebungsvariablen mit Validation
 * - PrismaModule: Datenbank-Zugriff
 * - AuthModule: Authentifizierung und Authorization
 * - HealthModule: Health-Check Endpoints
 * - BudgetsModule: Budget-Verwaltung
 * - CategoriesModule: Kategorie-Verwaltung
 * - TransactionsModule: Transaktions-Verwaltung
 * - AccountsModule: Konto-Verwaltung
 *
 * Environment Variables (mit Joi-Validation):
 * - PORT_API: Server Port (default: 3001)
 * - DATABASE_URL: PostgreSQL Connection String (required)
 * - CORS_ORIGIN: Erlaubte CORS Origins (optional)
 *
 * @example
 * ```typescript
 * // In main.ts
 * const app = await NestFactory.create(AppModule);
 * ```
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT_API: Joi.number().default(3001),
        DATABASE_URL: Joi.string().uri().required(),
        CORS_ORIGIN: Joi.string().optional(), // z.B. "http://localhost:4201,http://localhost:4300"
      }),
    }),
    PrismaModule,
    AuthModule,
    HealthModule,
    BudgetsModule,
    CategoriesModule,
    TransactionsModule,
    AccountsModule,
  ],
})
export class AppModule {}

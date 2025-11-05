import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Health-Check-Modul
 *
 * Stellt Endpoints für Monitoring und Health-Checks bereit.
 * Überprüft Status der API und Datenbankverbindung.
 *
 * Endpoints:
 * - GET /api/health: Umfassender Health-Status
 *
 * @example
 * ```bash
 * curl http://localhost:3001/api/health
 * # Response: { status: 'ok', database: 'connected', timestamp: '...', version: '0.0.1' }
 * ```
 */
@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
})
export class HealthModule {}

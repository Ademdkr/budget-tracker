import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Health-Check-Controller
 *
 * Stellt Monitoring-Endpoints für die Überwachung bereit.
 * Prüft Status der API und Datenbankverbindung.
 *
 * Features:
 * - API-Status-Check
 * - Datenbank-Connectivity-Test
 * - Version-Informationen
 * - Swagger/OpenAPI Dokumentation
 *
 * @example
 * ```typescript
 * // Response-Format:
 * {
 *   status: 'ok',           // 'ok' oder 'degraded'
 *   timestamp: '2025-11-05T10:30:00.000Z',
 *   database: 'connected',  // 'connected' oder 'disconnected'
 *   version: '0.0.1'
 * }
 * ```
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Health-Check-Endpoint
   *
   * Prüft den Zustand der API und der Datenbankverbindung.
   * Gibt 200 OK zurück, wenn alles funktioniert, oder 200 mit 'degraded' Status
   * wenn die Datenbank nicht erreichbar ist.
   *
   * @returns Health-Status-Objekt mit Status, Timestamp, DB-Status und Version
   */
  @Get()
  @ApiOperation({
    summary: 'Health Check',
    description:
      'Gibt den Gesundheitsstatus der API und der Datenbankverbindung zurück',
  })
  @ApiOkResponse({
    description: 'API ist erreichbar',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['ok', 'degraded'],
          description: 'Gesamtstatus der API',
          example: 'ok',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          description: 'Zeitstempel der Prüfung',
          example: '2025-11-05T10:30:00.000Z',
        },
        database: {
          type: 'string',
          enum: ['connected', 'disconnected'],
          description: 'Status der Datenbankverbindung',
          example: 'connected',
        },
        version: {
          type: 'string',
          description: 'API-Version',
          example: '0.0.1',
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Service nicht verfügbar (Datenbankverbindung fehlgeschlagen)',
  })
  async get() {
    const dbStatus = await this.checkDatabase();
    return {
      status: dbStatus ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      database: dbStatus ? 'connected' : 'disconnected',
      version: process.env.npm_package_version || '0.0.1',
    };
  }

  /**
   * Prüft die Datenbankverbindung
   *
   * Führt eine einfache Query aus, um die Verbindung zu testen.
   *
   * @private
   * @returns true wenn Verbindung funktioniert, false bei Fehler
   */
  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

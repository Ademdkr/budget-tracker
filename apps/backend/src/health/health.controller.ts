import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

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

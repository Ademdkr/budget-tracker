import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * Root-Controller für Basis-Endpoints
 *
 * Stellt einen einfachen Health-Check am Root-Pfad bereit.
 * Hauptsächlich für Entwicklungszwecke und Quick-Tests.
 *
 * @example
 * ```bash
 * curl http://localhost:3001/
 * # Response: "Hello World!"
 * ```
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Root-Endpoint für schnellen Health-Check
   *
   * @returns Einfache Grußnachricht
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}

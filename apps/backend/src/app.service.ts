import { Injectable } from '@nestjs/common';

/**
 * Root-Service für Basis-Funktionalität
 *
 * Minimaler Service der vom AppController verwendet wird.
 * Kann für gemeinsame Logik erweitert werden.
 */
@Injectable()
export class AppService {
  /**
   * Gibt eine einfache Grußnachricht zurück
   *
   * @returns "Hello World!" String
   */
  getHello(): string {
    return 'Hello World!';
  }
}

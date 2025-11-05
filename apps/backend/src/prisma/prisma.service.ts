import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma Database Service
 *
 * Zentraler Service für Datenbank-Zugriff. Erweitert PrismaClient und
 * verwaltet automatisch Datenbank-Verbindungen im NestJS Lifecycle.
 *
 * Verbindet sich beim Modul-Start und trennt die Verbindung beim Shutdown,
 * um Ressourcen-Leaks zu vermeiden.
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   constructor(private prisma: PrismaService) {}
 *
 *   async findUsers() {
 *     return this.prisma.user.findMany();
 *   }
 * }
 * ```
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Verbindet mit der Datenbank beim Modul-Start
   *
   * Wird automatisch von NestJS aufgerufen, wenn das Modul initialisiert wird.
   * Stellt sicher, dass die Datenbankverbindung verfügbar ist, bevor
   * Anfragen verarbeitet werden.
   *
   * @returns Promise, das aufgelöst wird, wenn die Verbindung hergestellt ist
   */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /**
   * Trennt die Datenbankverbindung beim Modul-Shutdown
   *
   * Wird automatisch von NestJS aufgerufen, wenn die Anwendung beendet wird.
   * Stellt sicher, dass alle Datenbankverbindungen sauber geschlossen werden.
   *
   * @returns Promise, das aufgelöst wird, wenn die Verbindung getrennt ist
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

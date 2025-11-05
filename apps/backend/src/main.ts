import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Bootstrap-Funktion für NestJS Backend
 *
 * Funktionalität:
 * - Erstellt NestJS-Anwendung mit AppModule
 * - Konfiguriert CORS für Frontend-Zugriff
 * - Setzt globales API-Prefix (/api)
 * - Aktiviert globale Validation Pipes
 * - Konfiguriert Swagger/OpenAPI Dokumentation
 * - Startet Server auf konfiguriertem Port
 *
 * Features:
 * - Automatisches Whitelist von DTOs (nur erlaubte Properties)
 * - Automatisches Transform von Payloads
 * - Bearer Auth Support für JWT
 * - Multi-Origin CORS Support
 * - Swagger UI unter /api/docs
 *
 * Environment Variables:
 * - CORS_ORIGIN: Comma-separated CORS origins (default: http://localhost:4201)
 * - PORT_API: Server Port (default: 3001)
 *
 * @example
 * ```bash
 * # Startet Backend mit Default-Konfiguration
 * npm run start
 *
 * # Swagger UI verfügbar unter:
 * http://localhost:3001/api/docs
 * ```
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS-Konfiguration aus Environment Variable
  const corsOrigin = process.env.CORS_ORIGIN?.split(',').map((s) =>
    s.trim(),
  ) ?? ['http://localhost:4201'];
  app.enableCors({ origin: corsOrigin });

  // Globales API-Prefix für alle Routen
  app.setGlobalPrefix('api');

  // Globale Validation Pipe mit strengen Regeln
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Entfernt nicht-deklarierte Properties
      forbidNonWhitelisted: true, // Wirft Fehler bei unbekannten Properties
      transform: true, // Transformiert Payloads zu DTO-Instanzen
    }),
  );

  // Swagger/OpenAPI Dokumentation
  const config = new DocumentBuilder()
    .setTitle('Budget Tracker API')
    .setDescription('Budget-Tracker API-Dokumentation')
    .setVersion('1.0.0')
    .addBearerAuth() // JWT Bearer Token Support
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, doc);

  // Server starten
  const port = Number(process.env.PORT_API) || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Backend listening on http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api/docs`);
}
bootstrap();

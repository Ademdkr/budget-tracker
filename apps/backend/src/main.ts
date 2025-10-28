import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigin = process.env.CORS_ORIGIN?.split(',').map((s) =>
    s.trim(),
  ) ?? ['http://localhost:4201'];
  app.enableCors({ origin: corsOrigin });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT_API) || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Backend listening on http://localhost:${port}`);

  const config = new DocumentBuilder()
    .setTitle('Budget Tracker API')
    .setDescription('Budget-Tracker API-Dokumentation')
    .setVersion('1.0.0')
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, doc);
}
bootstrap();

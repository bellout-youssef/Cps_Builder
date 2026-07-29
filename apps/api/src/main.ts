import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const rawOrigin = process.env['CORS_ORIGIN'] ?? '';
  const allowedOrigins = rawOrigin
    ? rawOrigin.split(',').map((s) => s.trim()).filter(Boolean)
    : ['http://localhost:3000'];
  console.log('[CORS] origin configuré =', rawOrigin || 'FALLBACK localhost');

  app.enableCors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Disposition', 'Content-Type'],
  });

  const port = process.env['PORT'] ?? 3001;
  await app.listen(port);
}

bootstrap();

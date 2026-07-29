import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
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
  console.log('[CORS] origines autorisées =', allowedOrigins);

  // Middleware explicite : gère CORS + répond 204 aux preflight OPTIONS.
  // enableCors retiré pour éviter le double traitement et le 404 sur OPTIONS.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
      res.header('Access-Control-Expose-Headers', 'Content-Disposition,Content-Type');
    }
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  const port = process.env['PORT'] ?? 3001;
  await app.listen(port, '0.0.0.0');
}

bootstrap();

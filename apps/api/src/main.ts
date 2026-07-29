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
    ? rawOrigin.split(',').map((o) => o.trim()).filter(Boolean)
    : [];
  console.log('[CORS] origin configuré =', rawOrigin || 'FALLBACK localhost');

  app.enableCors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin) {
        // server-to-server or same-origin — allow
        return callback(null, true);
      }
      const isLocalhost = /^https?:\/\/localhost(:\d+)?$/.test(requestOrigin);
      const isAllowed =
        isLocalhost ||
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(requestOrigin);
      callback(isAllowed ? null : new Error(`CORS: origin not allowed — ${requestOrigin}`), isAllowed);
    },
    credentials: true,
    exposedHeaders: ['Content-Disposition', 'Content-Type'],
  });

  const port = process.env['PORT'] ?? 3001;
  await app.listen(port);
}

bootstrap();

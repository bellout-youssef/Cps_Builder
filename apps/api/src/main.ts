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

  app.enableCors({
    origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:3000',
    credentials: true,
    exposedHeaders: ['Content-Disposition', 'Content-Type'],
  });

  const port = process.env['PORT'] ?? 3001;
  await app.listen(port);
}

bootstrap();

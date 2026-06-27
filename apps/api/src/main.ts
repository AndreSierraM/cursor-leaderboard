import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';

let cached: INestApplication | null = null;

export async function createApp(): Promise<INestApplication> {
  if (cached) return cached;
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? true });
  await app.init();
  cached = app;
  return app;
}

// Local dev: `pnpm dev:api`
if (require.main === module) {
  createApp().then((app) => app.listen(process.env.PORT ?? 3001));
}

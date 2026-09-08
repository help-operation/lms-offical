import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser');

function validateEnv(): void {
  const missing: string[] = [];
  if (!process.env.DATABASE_URL) missing.push('DATABASE_URL');
  if (missing.length > 0) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('  MISSING REQUIRED ENVIRONMENT VARIABLES');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error(`  Missing: ${missing.join(', ')}`);
    console.error('');
    console.error('  Copy apps/api/.env.example to apps/api/.env and fill in');
    console.error('  the required values. See the README for setup instructions.');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('');
    process.exit(1);
  }
}

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.use(cookieParser());
  // Behind a reverse proxy (e.g. nginx / cloud load balancer) so the rate
  // limiter and logging see the real client IP via X-Forwarded-For.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  const reflector = app.get(Reflector);

  const corsOrigins = (
    process.env.CORS_ORIGINS ??
    'http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3004'
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor(reflector));

  await app.listen(process.env.PORT ?? 3000)
}
bootstrap();

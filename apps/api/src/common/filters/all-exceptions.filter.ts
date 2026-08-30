import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import type { ZodError } from 'zod';
import { captureException } from '../monitoring/monitoring';

interface FieldError {
  field: string;
  message: string;
}

// Postgres error codes — add more as your app grows
const PG_UNIQUE_VIOLATION = '23505';
const PG_FOREIGN_KEY_VIOLATION = '23503';
const PG_NOT_NULL_VIOLATION = '23502';

function isDatabaseError(err: unknown): err is Error & { code: string } {
  return (
    err instanceof Error &&
    'code' in err &&
    typeof (err as Record<string, unknown>).code === 'string'
  );
}

function normalizeDatabaseError(err: Error & { code: string }): {
  statusCode: number;
  message: string;
} {
  switch (err.code) {
    case PG_UNIQUE_VIOLATION:
      return { statusCode: HttpStatus.CONFLICT, message: 'Resource already exists' };
    case PG_FOREIGN_KEY_VIOLATION:
      return { statusCode: HttpStatus.BAD_REQUEST, message: 'Referenced resource does not exist' };
    case PG_NOT_NULL_VIOLATION:
      return { statusCode: HttpStatus.BAD_REQUEST, message: 'A required field is missing' };
    default:
      return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal server error' };
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: FieldError[] | null = null;
    let code: string | undefined;

    if (exception instanceof ZodValidationException) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Validation failed';
      const zodError = exception.getZodError() as ZodError;
      errors = zodError.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();
      message =
        typeof body === 'string'
          ? body
          : ((body as Record<string, unknown>).message as string) ?? message;
      if (typeof body === 'object' && typeof (body as Record<string, unknown>).code === 'string') {
        code = (body as Record<string, unknown>).code as string;
      }
    } else if (isDatabaseError(exception)) {
      const normalized = normalizeDatabaseError(exception);
      statusCode = normalized.statusCode;
      message = normalized.message;
      // Client-caused DB errors (4xx) are expected — debug-log without alerting.
      if (statusCode < HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.debug(`DB error [${exception.code}]: ${exception.message}`);
      }
    }

    // Forward genuine server faults (5xx) to monitoring with request context.
    // Client errors (4xx) are deliberately not reported to avoid noise.
    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      captureException(exception, {
        method: request.method,
        path: request.url,
        statusCode,
      });
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      code,
      data: null,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

import { Logger } from '@nestjs/common';

export type ErrorContext = Record<string, unknown>;

/**
 * External monitoring sink (e.g. Sentry's `captureException`). Kept optional and
 * dependency-free so the API builds and runs without any monitoring package
 * installed. Wire a real sink at bootstrap once a provider is configured:
 *
 *   import * as Sentry from '@sentry/node';
 *   Sentry.init({ dsn: process.env.SENTRY_DSN });
 *   registerErrorSink((err, ctx) => Sentry.captureException(err, { extra: ctx }));
 */
export type ErrorSink = (error: unknown, context?: ErrorContext) => void;

let sink: ErrorSink | null = null;

export function registerErrorSink(fn: ErrorSink): void {
  sink = fn;
}

const logger = new Logger('Monitoring');

/**
 * Log an unexpected/server-fault error in a structured way and forward it to an
 * external monitor if one has been registered. Never throws.
 */
export function captureException(error: unknown, context?: ErrorContext): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const suffix = context ? ` | ${safeStringify(context)}` : '';
  const causeSuffix = formatCauseChain(error);

  logger.error(`${message}${suffix}${causeSuffix}`, stack);

  if (sink) {
    try {
      sink(error, context);
    } catch {
      // A failing monitor must never break request handling.
    }
  }
}

/** Walks `error.cause` chains (e.g. DrizzleQueryError -> NeonDbError -> ConnectTimeoutError) so the real root cause isn't hidden behind a generic "Failed query" message. */
function formatCauseChain(error: unknown): string {
  const parts: string[] = [];
  let current = error instanceof Error ? error.cause : undefined;
  const seen = new Set<unknown>();

  while (current && !seen.has(current)) {
    seen.add(current);
    if (current instanceof Error) {
      parts.push(`${current.name}: ${current.message}`);
      current = current.cause;
    } else {
      parts.push(safeStringify(current));
      break;
    }
  }

  return parts.length ? ` | caused by: ${parts.join(' -> ')}` : '';
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '[unserializable context]';
  }
}

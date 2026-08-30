// Lightweight, Sentry-ready client error reporter.
//
// Dependency-free: it always logs the error, and additionally forwards it to
// Sentry if the global SDK has been loaded on the page (e.g. via a script tag
// or a future @sentry/nextjs integration). Wiring Sentry later requires no
// changes to call sites — they already call reportError().

export type ErrorContext = Record<string, unknown>;

interface SentryLike {
  captureException: (error: unknown, hint?: { extra?: ErrorContext }) => void;
}

export function reportError(error: unknown, context?: ErrorContext): void {
  // Always surface server/client-side for local debugging and log drains.
  if (context) {
    console.error("[reportError]", error, context);
  } else {
    console.error("[reportError]", error);
  }

  if (typeof window === "undefined") return;

  const sentry = (window as unknown as { Sentry?: SentryLike }).Sentry;
  if (sentry?.captureException) {
    try {
      sentry.captureException(error, context ? { extra: context } : undefined);
    } catch {
      // A failing monitor must never break the UI.
    }
  }
}

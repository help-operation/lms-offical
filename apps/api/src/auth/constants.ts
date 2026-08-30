// Secrets MUST be provided via environment variables in production.
// The fallback values are for local development only and are intentionally
// insecure — never deploy with them.
//
// These are getters (not plain values) so the secret is read from the
// environment at ACCESS time, not at import time. @nestjs/config's
// `ConfigModule.forRoot()` populates `process.env` during app bootstrap, which
// happens after this module is first imported — reading eagerly here would
// always capture the insecure fallback even when JWT_SECRET is set in `.env`.
export const jwtConstants = {
  get secret(): string {
    return (
      process.env.JWT_SECRET || 'dev-only-insecure-access-secret-change-me'
    );
  },
  get refreshSecret(): string {
    return (
      process.env.JWT_REFRESH_SECRET ||
      'dev-only-insecure-refresh-secret-change-me'
    );
  },
};

// ── Account lockout policy ────────────────────────────────────────────────────
// After MAX_FAILED_LOGIN_ATTEMPTS consecutive failures the account is locked
// for LOCK_DURATION_MS. A successful login resets the counter.
export const securityConstants = {
  MAX_FAILED_LOGIN_ATTEMPTS: Number(process.env.MAX_FAILED_LOGIN_ATTEMPTS) || 5,
  LOCK_DURATION_MS:
    (Number(process.env.LOCK_DURATION_MINUTES) || 15) * 60 * 1000,
};

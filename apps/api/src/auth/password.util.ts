import * as bcrypt from 'bcrypt';
import { createHmac } from 'crypto';

const SALT_ROUNDS = 10;

/** Hash a new password with native bcrypt — the format this app issues going forward. */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * Verify a plaintext password against any hash format we may hold:
 *
 *  - WordPress 6.8+ `$wp$2y$…` — bcrypt over `base64(hmac_sha384(pw, 'wp-sha384'))`.
 *    Mirrors WordPress's `wp_check_password()`, which verifies against `substr($hash, 3)`.
 *  - A migrated WordPress hash that lost its `$wp$` marker (bare `$2y$…`). This app
 *    never issues vanilla `$2y$` hashes (Node bcrypt emits `$2b$`), so a stored
 *    `$2y$` is always a migrated WP hash and needs the same HMAC pre-hash.
 *  - Native bcrypt `$2a$`/`$2b$` — what this app and the pgcrypto admin bootstrap produce.
 *
 * Node's `bcrypt` rejects the `$2y$` identifier, so it is remapped to `$2b$`
 * (an identical algorithm). WordPress trims the password before hashing, so the
 * HMAC step trims too, to stay byte-for-byte compatible.
 */
export async function verifyPassword(
  plain: string,
  hash: string | null | undefined,
): Promise<boolean> {
  if (!hash) return false;

  if (hash.startsWith('$wp$')) {
    return bcrypt.compare(wpPreHash(plain), normalizeBcryptId(hash.slice(3)));
  }

  // A migrated WordPress hash whose "$wp$" marker was damaged by an earlier
  // migration — either fully stripped to a valid "$2y$..." or over-stripped to a
  // malformed "2y$..." that lost the bcrypt portion's leading "$". This app never
  // issues vanilla "$2y$" hashes (Node bcrypt emits "$2b$"), so any "2y$"/"$2y$"
  // hash is a migrated WordPress one and needs the same HMAC pre-hash.
  if (hash.startsWith('2y$') || hash.startsWith('$2y$')) {
    const portion = normalizeBcryptId(hash.startsWith('$') ? hash : '$' + hash);
    return bcrypt.compare(wpPreHash(plain), portion);
  }

  return bcrypt.compare(plain, hash);
}

/**
 * True when a (already-verified) hash is a legacy WordPress format that should be
 * transparently upgraded to native bcrypt on the user's next successful login.
 */
export function isLegacyHash(hash: string | null | undefined): boolean {
  return (
    !!hash &&
    (hash.startsWith('$wp$') || hash.startsWith('$2y$') || hash.startsWith('2y$'))
  );
}

/** WordPress's pre-hash: base64( HMAC-SHA384(password, key='wp-sha384') ). */
function wpPreHash(plain: string): string {
  return createHmac('sha384', 'wp-sha384').update(plain.trim()).digest('base64');
}

/** Node bcrypt accepts $2a$/$2b$ but not $2y$ — remap the identical $2y$ algorithm. */
function normalizeBcryptId(bcryptHash: string): string {
  return bcryptHash.replace(/^\$2y\$/, '$2b$');
}

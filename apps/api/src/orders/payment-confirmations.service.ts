import { Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { paymentConfirmations } from 'src/db/schema';

// How long a freshly-minted token stays valid. The browser is redirected to the
// result page within seconds of the callback, so this only needs to cover the
// hop — kept generous to tolerate slow gateways / redirects.
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class PaymentConfirmationsService {
  constructor(@Inject(DB_TOKEN) private readonly db: DB) {}

  /**
   * Mint a one-time token carrying the result page's display params. Called by
   * the gateway callback right after it verifies a payment. Returns the token
   * to embed as `?t=<token>` in the redirect.
   */
  async mint(params: Record<string, string>): Promise<string> {
    const token = crypto.randomBytes(24).toString('hex'); // 48 chars
    await this.db.insert(paymentConfirmations).values({ token, params });
    return token;
  }

  /**
   * Atomically consume a token: returns its params on the first valid call and
   * `null` on every subsequent call (already consumed), for unknown tokens, or
   * for tokens older than the TTL. The single `UPDATE ... WHERE consumed_at IS
   * NULL RETURNING` makes the claim race-safe without an interactive
   * transaction (Neon HTTP driver has none).
   */
  async consume(token: string): Promise<Record<string, string> | null> {
    if (!token) return null;
    const cutoff = new Date(Date.now() - TOKEN_TTL_MS);
    const [claimed] = await this.db
      .update(paymentConfirmations)
      .set({ consumedAt: new Date() })
      .where(
        and(
          eq(paymentConfirmations.token, token),
          isNull(paymentConfirmations.consumedAt),
          gt(paymentConfirmations.createdAt, cutoff),
        ),
      )
      .returning({ params: paymentConfirmations.params });
    return claimed?.params ?? null;
  }
}

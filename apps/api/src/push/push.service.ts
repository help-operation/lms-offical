import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { eq } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { pushSubscriptions } from 'src/db/schema';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly ready: boolean;

  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly config: ConfigService,
  ) {
    const publicKey  = config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = config.get<string>('VAPID_PRIVATE_KEY');
    const subject    = config.get<string>('VAPID_SUBJECT') ?? 'mailto:support@skillkoro.com';

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.ready = true;
    } else {
      this.logger.warn('VAPID keys not set — push notifications disabled');
      this.ready = false;
    }
  }

  get vapidPublicKey() {
    return this.config.get<string>('VAPID_PUBLIC_KEY') ?? '';
  }

  async subscribe(userId: number, sub: { endpoint: string; p256dh: string; auth: string }) {
    // Upsert — same endpoint may re-subscribe after browser restart
    await this.db
      .insert(pushSubscriptions)
      .values({ userId, endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { userId, p256dh: sub.p256dh, auth: sub.auth },
      });
  }

  async unsubscribe(endpoint: string) {
    await this.db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));
  }

  async sendToUser(userId: number, payload: { title: string; body: string; url?: string }) {
    if (!this.ready) return;

    const subs = await this.db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        );
      } catch (err: any) {
        // 410 Gone = subscription expired; clean it up
        if (err?.statusCode === 410) {
          await this.db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
        } else {
          this.logger.warn(`Push failed for user ${userId}: ${err?.message}`);
        }
      }
    }
  }
}

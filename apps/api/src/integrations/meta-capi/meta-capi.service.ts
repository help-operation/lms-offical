import { Inject, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { trackingSettings } from 'src/db/schema';

const GRAPH_VERSION = 'v19.0';

export type MetaCapiEventName =
  | 'Purchase'
  | 'Lead'
  | 'CompleteRegistration';

export interface MetaCapiUserData {
  email?: string | null;
  phone?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  /** Browser _fbp cookie value, if available — improves match quality. */
  fbp?: string | null;
  /** Browser _fbc cookie value (click id), if available. */
  fbc?: string | null;
}

export interface SendMetaCapiEventInput {
  eventName: MetaCapiEventName;
  /**
   * Must match the event_id the browser pixel sends for the same action
   * (fbq('track', name, {}, {eventID: id})), so Meta dedupes the two events.
   */
  eventId: string;
  eventSourceUrl: string;
  user: MetaCapiUserData;
  value?: number;
  currency?: string;
}

function sha256(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

/**
 * Sends server-side conversion events to Meta (Facebook/Instagram) Conversions
 * API. Complements the browser Pixel — the same eventId on both sides lets
 * Meta deduplicate, so this does not double-count against the Pixel.
 *
 * Fails silently (logs only): tracking must never break checkout/lead flows.
 */
@Injectable()
export class MetaCapiService {
  private readonly logger = new Logger(MetaCapiService.name);

  constructor(@Inject(DB_TOKEN) private readonly db: DB) {}

  private async getConfig() {
    const [row] = await this.db.select().from(trackingSettings).limit(1);
    if (!row?.fbPixelId || !row?.fbCapiAccessToken) return null;
    return {
      pixelId: row.fbPixelId,
      accessToken: row.fbCapiAccessToken,
      testEventCode: row.fbCapiTestEventCode || undefined,
    };
  }

  async sendEvent(input: SendMetaCapiEventInput): Promise<void> {
    try {
      const config = await this.getConfig();
      if (!config) return; // CAPI not configured — no-op

      const { email, phone, clientIp, userAgent, fbp, fbc } = input.user;

      const user_data: Record<string, unknown> = {};
      if (email) user_data.em = [sha256(email)];
      if (phone) user_data.ph = [sha256(phone.replace(/[^\d]/g, ''))];
      if (clientIp) user_data.client_ip_address = clientIp;
      if (userAgent) user_data.client_user_agent = userAgent;
      if (fbp) user_data.fbp = fbp;
      if (fbc) user_data.fbc = fbc;

      const body = {
        data: [
          {
            event_name: input.eventName,
            event_time: Math.floor(Date.now() / 1000),
            event_id: input.eventId,
            event_source_url: input.eventSourceUrl,
            action_source: 'website',
            user_data,
            ...(input.value !== undefined
              ? { custom_data: { value: input.value, currency: input.currency ?? 'BDT' } }
              : {}),
          },
        ],
        ...(config.testEventCode ? { test_event_code: config.testEventCode } : {}),
      };

      const res = await fetch(
        `https://graph.facebook.com/${GRAPH_VERSION}/${config.pixelId}/events?access_token=${config.accessToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        this.logger.warn(`Meta CAPI ${input.eventName} failed: ${res.status} ${text}`);
      }
    } catch (err) {
      // Never let a tracking failure break the caller's business flow.
      this.logger.warn(`Meta CAPI ${input.eventName} threw: ${(err as Error).message}`);
    }
  }
}

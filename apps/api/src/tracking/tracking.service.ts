import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import geoip from 'geoip-lite';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { siteVisits, type visitSourceEnum, type visitDeviceEnum } from 'src/db/schema';
import type { CreateVisitInput, UpdateVisitDurationInput } from '@repo/validators';

type VisitSource = (typeof visitSourceEnum.enumValues)[number];
type VisitDevice = (typeof visitDeviceEnum.enumValues)[number];

@Injectable()
export class TrackingService {
  constructor(@Inject(DB_TOKEN) private readonly db: DB) {}

  async recordVisit(dto: CreateVisitInput, userAgent: string | undefined, ip: string | undefined) {
    const source = classifySource(dto.referrer);
    const device = classifyDevice(userAgent);
    const geo = ip ? geoip.lookup(stripIpv6Prefix(ip)) : null;

    const [row] = await this.db
      .insert(siteVisits)
      .values({
        sessionId: dto.sessionId,
        path: dto.path,
        referrer: dto.referrer ?? null,
        source,
        device,
        userAgent: userAgent ?? null,
        country: geo?.country ?? null,
        city: geo?.city ?? null,
        userId: dto.userId ?? null,
      })
      .returning({ id: siteVisits.id });

    return { id: row!.id };
  }

  async updateDuration(id: number, dto: UpdateVisitDurationInput) {
    const [updated] = await this.db
      .update(siteVisits)
      .set({ durationSeconds: dto.seconds })
      .where(eq(siteVisits.id, id))
      .returning({ id: siteVisits.id });

    if (!updated) throw new NotFoundException('Visit not found');
    return { id: updated.id };
  }
}

// ─── Server-side classification (never trust client-submitted values) ────────

/** Strips the "::ffff:" IPv4-mapped-IPv6 prefix Node sometimes reports. */
function stripIpv6Prefix(ip: string): string {
  return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
}

function classifySource(referrer: string | null | undefined): VisitSource {
  if (!referrer) return 'direct';
  let host = '';
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return 'other';
  }
  if (host.includes('facebook.com') || host.includes('fb.com') || host.includes('l.facebook.com')) return 'facebook';
  if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
  if (host.includes('linkedin.com')) return 'linkedin';
  if (host.includes('twitter.com') || host.includes('x.com') || host.includes('t.co')) return 'twitter';
  if (host.includes('instagram.com') || host.includes('l.instagram.com')) return 'instagram';
  if (host.includes('skillkoro.com')) return 'website';
  return 'other';
}

function classifyDevice(userAgent: string | undefined): VisitDevice {
  if (!userAgent) return 'unknown';
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad/.test(ua)) return 'tablet';
  if (/mobi|android|iphone|ipod/.test(ua)) return 'mobile';
  if (/windows|macintosh|linux|x11/.test(ua)) return 'desktop';
  return 'unknown';
}

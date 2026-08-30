import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, eq, gte, inArray, isNull, isNotNull, lte, ne, or } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import {
  liveClasses, liveCourseBatches, liveEnrollments,
  leads, enrollments, users, courses, orders,
} from 'src/db/schema';
import { SmsTemplatesService } from './sms-templates.service';
import { SmsGateway } from './sms.gateway';

const FRONTEND = process.env.FRONTEND_URL ?? 'http://localhost:3001';

/**
 * Time-based SMS senders. Each job is idempotent via a "sent_at" column so a
 * recipient is never messaged twice, and each is defensive (skips rows whose
 * dates can't be parsed, e.g. free-text batch start dates).
 */
@Injectable()
export class SmsSchedulerService {
  private readonly logger = new Logger(SmsSchedulerService.name);

  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly templates: SmsTemplatesService,
    private readonly gateway: SmsGateway,
  ) {}

  /** Remind enrolled students of live classes starting within the next hour. */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async liveClassReminders() {
    const now = new Date();
    const soon = new Date(now.getTime() + 60 * 60 * 1000);

    const due = await this.db
      .select()
      .from(liveClasses)
      .where(
        and(
          eq(liveClasses.status, 'scheduled'),
          isNull(liveClasses.reminderSentAt),
          gte(liveClasses.scheduledAt, now),
          lte(liveClasses.scheduledAt, soon),
        ),
      );

    const tpl = await this.templates.findByEvent('live_class_reminder');
    if (!tpl || !tpl.isEnabled) return;

    for (const cls of due) {
      try {
        if (cls.courseId) {
          const recipients = await this.db
            .select({ phone: users.phone })
            .from(enrollments)
            .innerJoin(users, eq(enrollments.userId, users.id))
            .where(and(eq(enrollments.courseId, cls.courseId), isNotNull(users.phone)));

          const phones = recipients.map((r) => r.phone!).filter(Boolean);
          if (phones.length > 0) {
            const message = this.templates.render(tpl.body, {
              title: cls.title,
              time: cls.scheduledAt.toLocaleString(),
              join_link: cls.meetingUrl ?? '',
            });
            await this.gateway.sendBulk(phones, message);
          }
        }
        await this.db
          .update(liveClasses)
          .set({ reminderSentAt: new Date() })
          .where(eq(liveClasses.id, cls.id));
      } catch (err) {
        this.logger.error(`live_class_reminder failed for class ${cls.id}`, err as Error);
      }
    }
  }

  /** Notify live-course enrollees when their batch start date is within 48h. */
  @Cron(CronExpression.EVERY_HOUR)
  async batchStartingSoon() {
    const now = Date.now();
    const horizon = now + 48 * 60 * 60 * 1000;

    const batches = await this.db
      .select()
      .from(liveCourseBatches)
      .where(
        and(
          eq(liveCourseBatches.status, 'upcoming'),
          isNull(liveCourseBatches.startingSoonSmsSentAt),
        ),
      );

    for (const batch of batches) {
      // startDate is free-text — only act if it parses to a real upcoming date.
      const ts = batch.startDate ? Date.parse(batch.startDate) : NaN;
      if (Number.isNaN(ts) || ts < now || ts > horizon) continue;

      try {
        const recipients = await this.db
          .select({ name: liveEnrollments.name, phone: liveEnrollments.phone })
          .from(liveEnrollments)
          .where(and(eq(liveEnrollments.batchId, batch.id), isNotNull(liveEnrollments.phone)));

        for (const r of recipients) {
          await this.templates.send('batch_starting_soon', r.phone, {
            name: r.name,
            batch_name: batch.batchName,
            date: batch.startDate ?? '',
          });
        }
        await this.db
          .update(liveCourseBatches)
          .set({ startingSoonSmsSentAt: new Date() })
          .where(eq(liveCourseBatches.id, batch.id));
      } catch (err) {
        this.logger.error(`batch_starting_soon failed for batch ${batch.id}`, err as Error);
      }
    }
  }

  /** Nudge guest leads who started but never completed checkout (1–25h old). */
  @Cron(CronExpression.EVERY_HOUR)
  async abandonedCheckout() {
    const now = Date.now();
    const oldest = new Date(now - 25 * 60 * 60 * 1000);
    const newest = new Date(now - 1 * 60 * 60 * 1000);

    // Paid-but-unfulfilled leads are now `pending` too (paid lives on the
    // order), so exclude any lead whose linked order is already paid — we must
    // not nag people who actually paid.
    const pending = await this.db
      .select({
        id: leads.id,
        phone: leads.phone,
        name: leads.name,
        courseIds: leads.courseIds,
      })
      .from(leads)
      .leftJoin(orders, eq(leads.orderId, orders.id))
      .where(
        and(
          eq(leads.status, 'pending'),
          isNull(leads.abandonedSmsSentAt),
          gte(leads.createdAt, oldest),
          lte(leads.createdAt, newest),
          or(isNull(leads.orderId), ne(orders.status, 'paid')),
        ),
      );

    for (const lead of pending) {
      try {
        // Resolve the first course title (best effort).
        let courseTitle = 'your course';
        const ids = Array.isArray(lead.courseIds) ? lead.courseIds : [];
        if (ids.length > 0) {
          const [c] = await this.db
            .select({ title: courses.title })
            .from(courses)
            .where(inArray(courses.id, ids))
            .limit(1);
          if (c) courseTitle = c.title;
        }

        await this.templates.send('abandoned_checkout', lead.phone, {
          name: lead.name ?? 'there',
          course_title: courseTitle,
          checkout_url: `${FRONTEND}/checkout`,
        });

        await this.db
          .update(leads)
          .set({ abandonedSmsSentAt: new Date() })
          .where(eq(leads.id, lead.id));
      } catch (err) {
        this.logger.error(`abandoned_checkout failed for lead ${lead.id}`, err as Error);
      }
    }
  }
}

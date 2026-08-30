import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, eq, lt, inArray } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { supportTickets } from 'src/db/schema';
import { AdminNotificationsService } from '../notifications/admin-notifications.service';

const SLA_HOURS = 24;

@Injectable()
export class SupportSchedulerService {
  private readonly logger = new Logger(SupportSchedulerService.name);

  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly adminNotifications: AdminNotificationsService,
  ) {}

  /**
   * Runs every hour. Finds tickets that have had no activity for SLA_HOURS hours
   * and haven't been flagged yet. Notifies all admins and escalates priority to
   * 'urgent' so the ticket surfaces at the top of the queue.
   * Sets slaBreach = true so the alert fires only once per cold spell; the reply
   * handler resets it so the clock restarts if the ticket goes cold again.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkSlaBreaches() {
    const threshold = new Date(Date.now() - SLA_HOURS * 60 * 60 * 1000);

    const breached = await this.db
      .select({
        id: supportTickets.id,
        subject: supportTickets.subject,
        priority: supportTickets.priority,
      })
      .from(supportTickets)
      .where(
        and(
          inArray(supportTickets.status, ['open', 'in_progress']),
          lt(supportTickets.updatedAt, threshold),
          eq(supportTickets.slaBreach, false),
        ),
      );

    if (breached.length === 0) return;

    this.logger.warn(`SLA breach detected on ${breached.length} ticket(s)`);

    // Escalate all breached tickets to 'urgent' and mark them flagged
    const ids = breached.map((t) => t.id);
    await this.db
      .update(supportTickets)
      .set({ slaBreach: true, priority: 'urgent' })
      .where(inArray(supportTickets.id, ids));

    // Single fan-out notification to all admins covering all tickets
    const subjects = breached
      .slice(0, 3)
      .map((t) => `#${t.id} "${t.subject}"`)
      .join(', ');
    const extra = breached.length > 3 ? ` and ${breached.length - 3} more` : '';

    await this.adminNotifications.notifyAdmins(
      'sla_breach',
      `⚠️ SLA breach — ${breached.length} ticket${breached.length > 1 ? 's' : ''} unanswered > ${SLA_HOURS}h`,
      `${subjects}${extra} — escalated to urgent`,
      '/admin/support',
    ).catch(() => { /* best-effort */ });
  }
}

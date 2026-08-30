import { Injectable, Inject, Logger } from '@nestjs/common';
import type { DB } from 'src/db';
import { eq, desc, and } from 'drizzle-orm';
import * as schema from '../db/schema';
import { DB_TOKEN } from '../db/db.module';

const { adminNotifications, adminUsers } = schema;

@Injectable()
export class AdminNotificationsService {
  private readonly logger = new Logger(AdminNotificationsService.name);

  constructor(@Inject(DB_TOKEN) private db: DB) {}

  async findAll(adminUserId: number) {
    return this.db
      .select()
      .from(adminNotifications)
      .where(eq(adminNotifications.adminUserId, adminUserId))
      .orderBy(desc(adminNotifications.createdAt))
      .limit(50);
  }

  async unreadCount(adminUserId: number) {
    const rows = await this.db
      .select({ id: adminNotifications.id })
      .from(adminNotifications)
      .where(
        and(
          eq(adminNotifications.adminUserId, adminUserId),
          eq(adminNotifications.isRead, false),
        ),
      );
    return { count: rows.length };
  }

  async markRead(adminUserId: number, id: number) {
    await this.db
      .update(adminNotifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(adminNotifications.id, id),
          eq(adminNotifications.adminUserId, adminUserId),
        ),
      );
    return { success: true };
  }

  async markAllRead(adminUserId: number) {
    await this.db
      .update(adminNotifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(adminNotifications.adminUserId, adminUserId),
          eq(adminNotifications.isRead, false),
        ),
      );
    return { success: true };
  }

  /**
   * Fan out a notification to every admin account. Best-effort — callers fire
   * this from within business flows (new ticket, lead, signup, enrollment), so
   * it must never throw back into the originating request.
   */
  async notifyAdmins(type: string, title: string, body?: string, link?: string) {
    try {
      const admins = await this.db
        .select({ id: adminUsers.id })
        .from(adminUsers);
      if (admins.length === 0) return;

      await this.db.insert(adminNotifications).values(
        admins.map((a) => ({ adminUserId: a.id, type, title, body, link })),
      );
    } catch (err) {
      this.logger.error('notifyAdmins failed', err as Error);
    }
  }
}

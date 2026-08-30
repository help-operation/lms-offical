import { Injectable, Inject } from '@nestjs/common';
import type { DB } from 'src/db';
import { eq, desc, and } from 'drizzle-orm';
import * as schema from '../db/schema';
import { DB_TOKEN } from '../db/db.module';

const { notifications } = schema;

@Injectable()
export class NotificationsService {
  constructor(@Inject(DB_TOKEN) private db: DB) {}

  async findAll(userId: number) {
    return this.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async markRead(userId: number, id: number) {
    await this.db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
    return { success: true };
  }

  async markAllRead(userId: number) {
    await this.db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return { success: true };
  }

  async create(
    userId: number,
    type: string,
    title: string,
    body?: string,
    link?: string,
  ) {
    const [row] = await this.db
      .insert(notifications)
      .values({ userId, type, title, body, link })
      .returning();
    return row;
  }

  async unreadCount(userId: number) {
    const rows = await this.db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return { count: rows.length };
  }
}

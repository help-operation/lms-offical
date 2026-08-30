import { Inject, Injectable } from '@nestjs/common';
import { desc, eq, sql } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { contactMessages } from 'src/db/schema';
import { MailService } from 'src/auth/mail.service';
import { SystemSettingsService } from 'src/system-settings/system-settings.service';
import {
  buildTableQuery,
  formatPaginatedResponse,
  type TableQueryInput,
} from 'src/common/utils/table-query.util';

export type CreateContactMessageDto = {
  name: string;
  email: string;
  subject?: string;
  message: string;
};

@Injectable()
export class ContactMessagesService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly mail: MailService,
    private readonly settings: SystemSettingsService,
  ) {}

  async create(dto: CreateContactMessageDto) {
    const [row] = await this.db
      .insert(contactMessages)
      .values({
        name:    dto.name,
        email:   dto.email,
        subject: dto.subject ?? null,
        message: dto.message,
      })
      .returning();

    // Send email notification to the contact email in General Settings
    this.sendNotification(row!).catch(() => {});

    return row;
  }

  private async sendNotification(msg: typeof contactMessages.$inferSelect) {
    const settings = await this.settings.getByKeys(['general_contact_email']);
    const to = settings['general_contact_email'];
    if (!to) return;

    await this.mail.sendContactNotification(to, {
      name:    msg.name,
      email:   msg.email,
      subject: msg.subject ?? '(no subject)',
      message: msg.message,
    });
  }

  async getAll(params: TableQueryInput = {}) {
    const q = buildTableQuery(params, {
      searchable: [
        contactMessages.name,
        contactMessages.email,
        contactMessages.subject,
        contactMessages.message,
      ],
      sortable: { createdAt: contactMessages.createdAt, name: contactMessages.name },
      // `read` param: 'read' → isRead true, 'unread' → false ('all' omits it)
      filterable: { read: (v) => eq(contactMessages.isRead, v === 'read') },
      dateColumn: contactMessages.createdAt,
      defaultSort: desc(contactMessages.createdAt),
    });

    const [rows, [countRow], [unreadRow]] = await Promise.all([
      this.db
        .select()
        .from(contactMessages)
        .where(q.where)
        .orderBy(q.orderBy)
        .limit(q.limit)
        .offset(q.offset),
      this.db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(contactMessages)
        .where(q.where),
      this.db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(contactMessages)
        .where(eq(contactMessages.isRead, false)),
    ]);

    return {
      ...formatPaginatedResponse(rows, countRow.count, q.page, q.perPage),
      unreadCount: unreadRow.count,
    };
  }

  async markRead(id: number) {
    const [row] = await this.db
      .update(contactMessages)
      .set({ isRead: true })
      .where(eq(contactMessages.id, id))
      .returning();
    return row;
  }

  async delete(id: number) {
    await this.db.delete(contactMessages).where(eq(contactMessages.id, id));
  }
}

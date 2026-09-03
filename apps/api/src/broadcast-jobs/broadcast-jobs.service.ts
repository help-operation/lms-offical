import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { and, desc, eq, ilike, isNotNull, or, sql, lte, inArray, gte, ilike as ilikeFn, type SQL } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import {
  messageBroadcastJobs,
  messageBroadcastRecipients,
  users,
  adminUsers,
  type BroadcastChannel,
} from 'src/db/schema';

@Injectable()
export class BroadcastJobsService {
  constructor(@Inject(DB_TOKEN) private readonly db: DB) {}

  async createJob(params: {
    channel: BroadcastChannel;
    subject?: string | null;
    message: string;
    total: number;
    createdByAdminId?: number;
    scheduledAt?: Date | null;
    intervalSeconds?: number | null;
  }) {
    const [job] = await this.db
      .insert(messageBroadcastJobs)
      .values({
        channel: params.channel,
        subject: params.subject ?? null,
        message: params.message,
        total: params.total,
        status: params.scheduledAt ? 'scheduled' : 'pending',
        scheduledAt: params.scheduledAt ?? null,
        intervalSeconds: params.intervalSeconds ?? null,
        createdByAdminId: params.createdByAdminId ?? null,
      })
      .returning();
    return job;
  }

  /** Inserts one pending row per recipient and returns them (with ids) for the caller to process. */
  async addRecipients(jobId: number, recipients: { studentId: number; recipient: string; renderedMessage?: string; sentByAdminId?: number }[]) {
    if (recipients.length === 0) return [];
    return this.db
      .insert(messageBroadcastRecipients)
      .values(recipients.map((r) => ({
        jobId,
        studentId: r.studentId,
        recipient: r.recipient,
        renderedMessage: r.renderedMessage ?? null,
        sentByAdminId: r.sentByAdminId ?? null,
      })))
      .returning();
  }

  async setJobStatus(jobId: number, status: 'scheduled' | 'pending' | 'running' | 'completed' | 'cancelled') {
    await this.db
      .update(messageBroadcastJobs)
      .set({
        status,
        ...(status === 'completed' ? { completedAt: new Date() } : {}),
      })
      .where(eq(messageBroadcastJobs.id, jobId));
  }

  async cancelJob(jobId: number) {
    await this.db
      .update(messageBroadcastJobs)
      .set({ status: 'cancelled', completedAt: new Date() })
      .where(eq(messageBroadcastJobs.id, jobId));

    await this.db
      .update(messageBroadcastRecipients)
      .set({ status: 'cancelled' })
      .where(
        and(
          eq(messageBroadcastRecipients.jobId, jobId),
          or(
            eq(messageBroadcastRecipients.status, 'pending'),
            eq(messageBroadcastRecipients.status, 'queued'),
          ),
        ),
      );
  }

  async markRecipientResult(jobId: number, recipientId: number, ok: boolean, error?: string) {
    await this.db
      .update(messageBroadcastRecipients)
      .set({
        status: ok ? 'sent' : 'failed',
        error: error ?? null,
        sentAt: ok ? new Date() : null,
      })
      .where(eq(messageBroadcastRecipients.id, recipientId));

    await this.db
      .update(messageBroadcastJobs)
      .set({
        sent: sql`${messageBroadcastJobs.sent} + ${ok ? 1 : 0}`,
        failed: sql`${messageBroadcastJobs.failed} + ${ok ? 0 : 1}`,
      })
      .where(eq(messageBroadcastJobs.id, jobId));
  }

  async markRecipientDelivered(recipientId: number) {
    await this.db
      .update(messageBroadcastRecipients)
      .set({ status: 'delivered', deliveredAt: new Date() })
      .where(eq(messageBroadcastRecipients.id, recipientId));
  }

  async updateJobLastSentAt(jobId: number) {
    await this.db
      .update(messageBroadcastJobs)
      .set({ lastSentAt: new Date() })
      .where(eq(messageBroadcastJobs.id, jobId));
  }

  async getJob(id: number) {
    const [job] = await this.db.select().from(messageBroadcastJobs).where(eq(messageBroadcastJobs.id, id)).limit(1);
    if (!job) throw new NotFoundException('Broadcast job not found');
    return job;
  }

  async getJobRecipients(jobId: number) {
    return this.db
      .select({
        id: messageBroadcastRecipients.id,
        studentId: messageBroadcastRecipients.studentId,
        recipient: messageBroadcastRecipients.recipient,
        renderedMessage: messageBroadcastRecipients.renderedMessage,
        status: messageBroadcastRecipients.status,
        error: messageBroadcastRecipients.error,
        sentAt: messageBroadcastRecipients.sentAt,
        deliveredAt: messageBroadcastRecipients.deliveredAt,
        sentByAdminId: messageBroadcastRecipients.sentByAdminId,
        createdAt: messageBroadcastRecipients.createdAt,
        firstName: users.firstName,
        lastName: users.lastName,
        adminFirstName: adminUsers.firstName,
        adminLastName: adminUsers.lastName,
      })
      .from(messageBroadcastRecipients)
      .innerJoin(users, eq(users.id, messageBroadcastRecipients.studentId))
      .leftJoin(adminUsers, eq(adminUsers.id, messageBroadcastRecipients.sentByAdminId))
      .where(eq(messageBroadcastRecipients.jobId, jobId))
      .orderBy(messageBroadcastRecipients.id);
  }

  async listJobs(limit = 100, status?: string) {
    const conditions: SQL<unknown>[] = [];
    if (status && status !== 'all') {
      conditions.push(eq(messageBroadcastJobs.status, status as any));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    return this.db
      .select({
        id: messageBroadcastJobs.id,
        channel: messageBroadcastJobs.channel,
        subject: messageBroadcastJobs.subject,
        message: messageBroadcastJobs.message,
        total: messageBroadcastJobs.total,
        sent: messageBroadcastJobs.sent,
        failed: messageBroadcastJobs.failed,
        status: messageBroadcastJobs.status,
        scheduledAt: messageBroadcastJobs.scheduledAt,
        intervalSeconds: messageBroadcastJobs.intervalSeconds,
        lastSentAt: messageBroadcastJobs.lastSentAt,
        createdByAdminId: messageBroadcastJobs.createdByAdminId,
        createdAt: messageBroadcastJobs.createdAt,
        completedAt: messageBroadcastJobs.completedAt,
        adminFirstName: adminUsers.firstName,
        adminLastName: adminUsers.lastName,
      })
      .from(messageBroadcastJobs)
      .leftJoin(adminUsers, eq(adminUsers.id, messageBroadcastJobs.createdByAdminId))
      .where(where)
      .orderBy(desc(messageBroadcastJobs.createdAt))
      .limit(limit);
  }

  /** Get jobs that are scheduled and due to run */
  async getDueScheduledJobs() {
    const now = new Date();
    return this.db
      .select()
      .from(messageBroadcastJobs)
      .where(
        and(
          eq(messageBroadcastJobs.status, 'scheduled'),
          isNotNull(messageBroadcastJobs.scheduledAt),
          lte(messageBroadcastJobs.scheduledAt, now),
        ),
      )
      .orderBy(messageBroadcastJobs.scheduledAt);
  }

  /** Get pending recipients for a job (for interval-based sending) */
  async getPendingRecipients(jobId: number, limit = 1) {
    return this.db
      .select({
        id: messageBroadcastRecipients.id,
        studentId: messageBroadcastRecipients.studentId,
        recipient: messageBroadcastRecipients.recipient,
        renderedMessage: messageBroadcastRecipients.renderedMessage,
      })
      .from(messageBroadcastRecipients)
      .where(
        and(
          eq(messageBroadcastRecipients.jobId, jobId),
          eq(messageBroadcastRecipients.status, 'pending'),
        ),
      )
      .orderBy(messageBroadcastRecipients.id)
      .limit(limit);
  }

  /** Count pending recipients for a job */
  async countPendingRecipients(jobId: number) {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(messageBroadcastRecipients)
      .where(
        and(
          eq(messageBroadcastRecipients.jobId, jobId),
          eq(messageBroadcastRecipients.status, 'pending'),
        ),
      );
    return result?.count ?? 0;
  }

  // ── Enhanced history queries ──────────────────────────────────────────────

  /** Full message history with status filtering, search, pagination */
  async getMessageHistory(params: {
    limit?: number;
    offset?: number;
    status?: string;
    channel?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    jobId?: number;
  }) {
    const { limit = 50, offset = 0, status, channel, search, dateFrom, dateTo, jobId } = params;

    const conditions: SQL<unknown>[] = [];

    if (status && status !== 'all') {
      conditions.push(eq(messageBroadcastRecipients.status, status as any));
    }
    if (channel && channel !== 'all') {
      conditions.push(eq(messageBroadcastJobs.channel, channel as BroadcastChannel));
    }
    if (jobId) {
      conditions.push(eq(messageBroadcastRecipients.jobId, jobId));
    }
    if (dateFrom) {
      conditions.push(gte(messageBroadcastRecipients.createdAt, new Date(dateFrom)));
    }
    if (dateTo) {
      const toEnd = new Date(dateTo + 'T23:59:59');
      conditions.push(lte(messageBroadcastRecipients.createdAt, toEnd));
    }
    if (search) {
      const q = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(users.firstName, q),
          ilike(users.lastName, q),
          ilike(messageBroadcastRecipients.recipient, q),
        )!,
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Count total
    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(messageBroadcastRecipients)
      .innerJoin(messageBroadcastJobs, eq(messageBroadcastJobs.id, messageBroadcastRecipients.jobId))
      .innerJoin(users, eq(users.id, messageBroadcastRecipients.studentId))
      .where(where);

    const total = countResult?.count ?? 0;

    // Fetch rows
    const rows = await this.db
      .select({
        id: messageBroadcastRecipients.id,
        jobId: messageBroadcastRecipients.jobId,
        studentId: messageBroadcastRecipients.studentId,
        recipient: messageBroadcastRecipients.recipient,
        renderedMessage: messageBroadcastRecipients.renderedMessage,
        status: messageBroadcastRecipients.status,
        error: messageBroadcastRecipients.error,
        sentAt: messageBroadcastRecipients.sentAt,
        deliveredAt: messageBroadcastRecipients.deliveredAt,
        sentByAdminId: messageBroadcastRecipients.sentByAdminId,
        createdAt: messageBroadcastRecipients.createdAt,
        firstName: users.firstName,
        lastName: users.lastName,
        adminFirstName: adminUsers.firstName,
        adminLastName: adminUsers.lastName,
        channel: messageBroadcastJobs.channel,
        subject: messageBroadcastJobs.subject,
        message: messageBroadcastJobs.message,
        jobStatus: messageBroadcastJobs.status,
        jobCreatedAt: messageBroadcastJobs.createdAt,
      })
      .from(messageBroadcastRecipients)
      .innerJoin(messageBroadcastJobs, eq(messageBroadcastJobs.id, messageBroadcastRecipients.jobId))
      .innerJoin(users, eq(users.id, messageBroadcastRecipients.studentId))
      .leftJoin(adminUsers, eq(adminUsers.id, messageBroadcastRecipients.sentByAdminId))
      .where(where)
      .orderBy(desc(messageBroadcastRecipients.createdAt))
      .limit(limit)
      .offset(offset);

    return { rows, total, limit, offset };
  }

  /** Get message detail (full rendered message + audit info) */
  async getMessageDetail(recipientId: number) {
    const [row] = await this.db
      .select({
        id: messageBroadcastRecipients.id,
        jobId: messageBroadcastRecipients.jobId,
        studentId: messageBroadcastRecipients.studentId,
        recipient: messageBroadcastRecipients.recipient,
        renderedMessage: messageBroadcastRecipients.renderedMessage,
        status: messageBroadcastRecipients.status,
        error: messageBroadcastRecipients.error,
        sentAt: messageBroadcastRecipients.sentAt,
        deliveredAt: messageBroadcastRecipients.deliveredAt,
        sentByAdminId: messageBroadcastRecipients.sentByAdminId,
        createdAt: messageBroadcastRecipients.createdAt,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        adminFirstName: adminUsers.firstName,
        adminLastName: adminUsers.lastName,
        channel: messageBroadcastJobs.channel,
        subject: messageBroadcastJobs.subject,
        message: messageBroadcastJobs.message,
        jobStatus: messageBroadcastJobs.status,
        jobCreatedAt: messageBroadcastJobs.createdAt,
        jobScheduledAt: messageBroadcastJobs.scheduledAt,
        jobIntervalSeconds: messageBroadcastJobs.intervalSeconds,
      })
      .from(messageBroadcastRecipients)
      .innerJoin(messageBroadcastJobs, eq(messageBroadcastJobs.id, messageBroadcastRecipients.jobId))
      .innerJoin(users, eq(users.id, messageBroadcastRecipients.studentId))
      .leftJoin(adminUsers, eq(adminUsers.id, messageBroadcastRecipients.sentByAdminId))
      .where(eq(messageBroadcastRecipients.id, recipientId))
      .limit(1);

    if (!row) throw new NotFoundException('Message not found');
    return row;
  }

  /** Resend a failed message — creates a NEW recipient record (audit trail preserved) */
  async resendMessage(recipientId: number, adminId?: number) {
    const [original] = await this.db
      .select()
      .from(messageBroadcastRecipients)
      .where(eq(messageBroadcastRecipients.id, recipientId))
      .limit(1);

    if (!original) throw new NotFoundException('Original message not found');
    if (original.status !== 'failed') throw new BadRequestException('Only failed messages can be resent');

    // Get the job for channel info
    const job = await this.getJob(original.jobId);

    // Create new recipient record (preserves audit trail)
    const [newRecipient] = await this.db
      .insert(messageBroadcastRecipients)
      .values({
        jobId: original.jobId,
        studentId: original.studentId,
        recipient: original.recipient,
        renderedMessage: original.renderedMessage,
        status: 'pending',
        sentByAdminId: adminId ?? original.sentByAdminId,
      })
      .returning();

    // Update job total
    await this.db
      .update(messageBroadcastJobs)
      .set({ total: sql`${messageBroadcastJobs.total} + 1` })
      .where(eq(messageBroadcastJobs.id, original.jobId));

    return { newRecipientId: newRecipient.id, channel: job.channel };
  }

  /** Export message history as CSV-friendly data */
  async exportMessageHistory(params: {
    channel?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    jobId?: number;
  }) {
    const result = await this.getMessageHistory({ ...params, limit: 10000, offset: 0 });
    return result.rows;
  }

  /** Finds past sends by student name or the phone/email actually used, newest first. */
  async searchRecipients(query: string, limit = 100) {
    const q = `%${query.trim()}%`;
    return this.db
      .select({
        id: messageBroadcastRecipients.id,
        jobId: messageBroadcastRecipients.jobId,
        studentId: messageBroadcastRecipients.studentId,
        recipient: messageBroadcastRecipients.recipient,
        renderedMessage: messageBroadcastRecipients.renderedMessage,
        status: messageBroadcastRecipients.status,
        error: messageBroadcastRecipients.error,
        sentAt: messageBroadcastRecipients.sentAt,
        deliveredAt: messageBroadcastRecipients.deliveredAt,
        sentByAdminId: messageBroadcastRecipients.sentByAdminId,
        firstName: users.firstName,
        lastName: users.lastName,
        adminFirstName: adminUsers.firstName,
        adminLastName: adminUsers.lastName,
        channel: messageBroadcastJobs.channel,
        subject: messageBroadcastJobs.subject,
        message: messageBroadcastJobs.message,
        createdAt: messageBroadcastJobs.createdAt,
      })
      .from(messageBroadcastRecipients)
      .innerJoin(users, eq(users.id, messageBroadcastRecipients.studentId))
      .innerJoin(messageBroadcastJobs, eq(messageBroadcastJobs.id, messageBroadcastRecipients.jobId))
      .leftJoin(adminUsers, eq(adminUsers.id, messageBroadcastRecipients.sentByAdminId))
      .where(
        or(
          ilike(users.firstName, q),
          ilike(users.lastName, q),
          ilike(messageBroadcastRecipients.recipient, q),
        ),
      )
      .orderBy(desc(messageBroadcastJobs.createdAt))
      .limit(limit);
  }

  /** Every message a specific student has been sent, newest first. */
  async getStudentHistory(studentId: number) {
    return this.db
      .select({
        id: messageBroadcastRecipients.id,
        jobId: messageBroadcastRecipients.jobId,
        recipient: messageBroadcastRecipients.recipient,
        renderedMessage: messageBroadcastRecipients.renderedMessage,
        status: messageBroadcastRecipients.status,
        error: messageBroadcastRecipients.error,
        sentAt: messageBroadcastRecipients.sentAt,
        deliveredAt: messageBroadcastRecipients.deliveredAt,
        sentByAdminId: messageBroadcastRecipients.sentByAdminId,
        channel: messageBroadcastJobs.channel,
        subject: messageBroadcastJobs.subject,
        message: messageBroadcastJobs.message,
        createdAt: messageBroadcastJobs.createdAt,
        adminFirstName: adminUsers.firstName,
        adminLastName: adminUsers.lastName,
      })
      .from(messageBroadcastRecipients)
      .innerJoin(messageBroadcastJobs, eq(messageBroadcastJobs.id, messageBroadcastRecipients.jobId))
      .leftJoin(adminUsers, eq(adminUsers.id, messageBroadcastRecipients.sentByAdminId))
      .where(eq(messageBroadcastRecipients.studentId, studentId))
      .orderBy(desc(messageBroadcastJobs.createdAt));
  }
}

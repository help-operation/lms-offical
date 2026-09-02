import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, ilike, isNotNull, or, sql, lte } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import {
  messageBroadcastJobs,
  messageBroadcastRecipients,
  users,
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
  async addRecipients(jobId: number, recipients: { studentId: number; recipient: string }[]) {
    if (recipients.length === 0) return [];
    return this.db
      .insert(messageBroadcastRecipients)
      .values(recipients.map((r) => ({ jobId, studentId: r.studentId, recipient: r.recipient })))
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
    // Cancel the job
    await this.db
      .update(messageBroadcastJobs)
      .set({ status: 'cancelled', completedAt: new Date() })
      .where(eq(messageBroadcastJobs.id, jobId));

    // Cancel all pending/queued recipients
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
        status: messageBroadcastRecipients.status,
        error: messageBroadcastRecipients.error,
        sentAt: messageBroadcastRecipients.sentAt,
        deliveredAt: messageBroadcastRecipients.deliveredAt,
        createdAt: messageBroadcastRecipients.createdAt,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(messageBroadcastRecipients)
      .innerJoin(users, eq(users.id, messageBroadcastRecipients.studentId))
      .where(eq(messageBroadcastRecipients.jobId, jobId))
      .orderBy(messageBroadcastRecipients.id);
  }

  async listJobs(limit = 100, status?: string) {
    const conditions = [];
    if (status && status !== 'all') {
      conditions.push(eq(messageBroadcastJobs.status, status as any));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    return this.db
      .select()
      .from(messageBroadcastJobs)
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

  /** Finds past sends by student name or the phone/email actually used, newest first. */
  async searchRecipients(query: string, limit = 100) {
    const q = `%${query.trim()}%`;
    return this.db
      .select({
        id: messageBroadcastRecipients.id,
        jobId: messageBroadcastRecipients.jobId,
        studentId: messageBroadcastRecipients.studentId,
        recipient: messageBroadcastRecipients.recipient,
        status: messageBroadcastRecipients.status,
        error: messageBroadcastRecipients.error,
        sentAt: messageBroadcastRecipients.sentAt,
        deliveredAt: messageBroadcastRecipients.deliveredAt,
        firstName: users.firstName,
        lastName: users.lastName,
        channel: messageBroadcastJobs.channel,
        subject: messageBroadcastJobs.subject,
        message: messageBroadcastJobs.message,
        createdAt: messageBroadcastJobs.createdAt,
      })
      .from(messageBroadcastRecipients)
      .innerJoin(users, eq(users.id, messageBroadcastRecipients.studentId))
      .innerJoin(messageBroadcastJobs, eq(messageBroadcastJobs.id, messageBroadcastRecipients.jobId))
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
        status: messageBroadcastRecipients.status,
        error: messageBroadcastRecipients.error,
        sentAt: messageBroadcastRecipients.sentAt,
        deliveredAt: messageBroadcastRecipients.deliveredAt,
        channel: messageBroadcastJobs.channel,
        subject: messageBroadcastJobs.subject,
        message: messageBroadcastJobs.message,
        createdAt: messageBroadcastJobs.createdAt,
      })
      .from(messageBroadcastRecipients)
      .innerJoin(messageBroadcastJobs, eq(messageBroadcastJobs.id, messageBroadcastRecipients.jobId))
      .where(eq(messageBroadcastRecipients.studentId, studentId))
      .orderBy(desc(messageBroadcastJobs.createdAt));
  }
}

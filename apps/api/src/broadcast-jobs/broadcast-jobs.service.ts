import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { desc, eq, ilike, or, sql } from 'drizzle-orm';
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
  }) {
    const [job] = await this.db
      .insert(messageBroadcastJobs)
      .values({
        channel: params.channel,
        subject: params.subject ?? null,
        message: params.message,
        total: params.total,
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

  async setJobStatus(jobId: number, status: 'pending' | 'running' | 'completed') {
    await this.db
      .update(messageBroadcastJobs)
      .set({ status, ...(status === 'completed' ? { completedAt: new Date() } : {}) })
      .where(eq(messageBroadcastJobs.id, jobId));
  }

  async markRecipientResult(jobId: number, recipientId: number, ok: boolean, error?: string) {
    await this.db
      .update(messageBroadcastRecipients)
      .set({ status: ok ? 'sent' : 'failed', error: error ?? null, sentAt: new Date() })
      .where(eq(messageBroadcastRecipients.id, recipientId));

    await this.db
      .update(messageBroadcastJobs)
      .set({
        sent: sql`${messageBroadcastJobs.sent} + ${ok ? 1 : 0}`,
        failed: sql`${messageBroadcastJobs.failed} + ${ok ? 0 : 1}`,
      })
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
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(messageBroadcastRecipients)
      .innerJoin(users, eq(users.id, messageBroadcastRecipients.studentId))
      .where(eq(messageBroadcastRecipients.jobId, jobId))
      .orderBy(messageBroadcastRecipients.id);
  }

  async listJobs(limit = 100) {
    return this.db
      .select()
      .from(messageBroadcastJobs)
      .orderBy(desc(messageBroadcastJobs.createdAt))
      .limit(limit);
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

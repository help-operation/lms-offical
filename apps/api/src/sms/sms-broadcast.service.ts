import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, inArray, isNotNull, ne, sql } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import {
  users,
  leads,
  liveEnrollments,
  enrollments,
  courses,
  liveCourses,
  liveCourseBatches,
} from 'src/db/schema';
import { SmsGateway } from './sms.gateway';
import { SystemSettingsService } from 'src/system-settings/system-settings.service';
import { mapWithConcurrency } from 'src/common/utils/concurrency.util';
import { BroadcastJobsService } from 'src/broadcast-jobs/broadcast-jobs.service';

// How many SMS gateway requests to have in flight at once for a manual
// broadcast — keeps a few hundred recipients from taking minutes to send
// sequentially, without hammering BulkSMSBD.
const SEND_CONCURRENCY = 10;

export const SEGMENTS = [
  'all_users',
  'students',
  'guests',
  'leads',
  'live_enrollments',
] as const;
export type Segment = (typeof SEGMENTS)[number];

@Injectable()
export class SmsBroadcastService {
  private readonly logger = new Logger(SmsBroadcastService.name);

  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly gateway: SmsGateway,
    private readonly systemSettings: SystemSettingsService,
    private readonly broadcastJobs: BroadcastJobsService,
  ) {}

  /** Phone numbers for a segment (deduped, non-empty). */
  private async collectPhones(segment: Segment): Promise<string[]> {
    let rows: { phone: string | null }[] = [];

    switch (segment) {
      case 'all_users':
        rows = await this.db
          .select({ phone: users.phone })
          .from(users)
          .where(isNotNull(users.phone));
        break;
      case 'students':
        rows = await this.db
          .select({ phone: users.phone })
          .from(users)
          .where(and(isNotNull(users.phone), eq(users.role, 'STUDENT')));
        break;
      case 'guests':
        rows = await this.db
          .select({ phone: users.phone })
          .from(users)
          .where(and(isNotNull(users.phone), eq(users.role, 'GUEST')));
        break;
      case 'leads':
        rows = await this.db
          .select({ phone: leads.phone })
          .from(leads)
          .where(ne(leads.status, 'complete'));
        break;
      case 'live_enrollments':
        rows = await this.db
          .select({ phone: liveEnrollments.phone })
          .from(liveEnrollments)
          .where(isNotNull(liveEnrollments.phone));
        break;
    }

    return Array.from(
      new Set(rows.map((r) => (r.phone ?? '').trim()).filter(Boolean)),
    );
  }

  async counts(): Promise<Record<Segment, number>> {
    const result = {} as Record<Segment, number>;
    for (const seg of SEGMENTS) {
      result[seg] = (await this.collectPhones(seg)).length;
    }
    return result;
  }

  async broadcast(segment: Segment, message: string) {
    if (!SEGMENTS.includes(segment)) {
      throw new BadRequestException('Invalid recipient segment');
    }
    const text = message?.trim();
    if (!text) throw new BadRequestException('Message is required');

    const phones = await this.collectPhones(segment);
    if (phones.length === 0) {
      return { total: 0, sent: 0, failed: 0 };
    }

    const { sent, failed } = await this.gateway.sendBulk(phones, text);
    return { total: phones.length, sent, failed };
  }

  /**
   * Kicks off a personalized SMS send to an ad-hoc list of student (user) ids
   * — used by the Student Filters page. Creates a broadcast job + one pending
   * recipient row per student, then sends in the background (not awaited) so
   * the caller gets a jobId back immediately and can poll progress via
   * BroadcastJobsService instead of blocking on the whole batch. Unlike
   * `broadcast()`, this renders {{student_name}}, {{course_name}},
   * {{batch_name}} per-recipient from their own most-recent enrollment
   * (recorded or live). {{due_amount}}, {{payment_link}}, {{class_date}},
   * {{class_time}} have no real backend source yet, so they're left as
   * literal text if present in the template.
   */
  async startBroadcastToStudents(studentIds: number[], template: string, createdByAdminId?: number) {
    const text = template?.trim();
    if (!text) throw new BadRequestException('Message is required');
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      throw new BadRequestException('At least one student is required');
    }

    const [studentRows, recorded, live] = await Promise.all([
      this.db
        .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, phone: users.phone })
        .from(users)
        .where(inArray(users.id, studentIds)),
      this.db
        .select({
          userId: enrollments.userId,
          courseName: courses.title,
          at: enrollments.enrolledAt,
        })
        .from(enrollments)
        .innerJoin(courses, eq(courses.id, enrollments.courseId))
        .where(inArray(enrollments.userId, studentIds)),
      this.db
        .select({
          userId: liveEnrollments.userId,
          courseName: liveCourses.title,
          batchName: liveCourseBatches.batchName,
          at: sql<Date>`COALESCE(${liveEnrollments.paidAt}, ${liveEnrollments.createdAt})`,
        })
        .from(liveEnrollments)
        .innerJoin(liveCourses, eq(liveCourses.id, liveEnrollments.liveCourseId))
        .leftJoin(liveCourseBatches, eq(liveCourseBatches.id, liveEnrollments.batchId))
        .where(and(inArray(liveEnrollments.userId, studentIds), sql`${liveEnrollments.userId} IS NOT NULL`)),
    ]);

    type Enrollment = { courseName: string; batchName: string | null; at: Date | null };
    const latestByUser = new Map<number, Enrollment>();
    const consider = (userId: number | null, row: Enrollment) => {
      if (userId == null) return;
      const existing = latestByUser.get(userId);
      const rowTime = row.at ? new Date(row.at).getTime() : 0;
      const existingTime = existing?.at ? new Date(existing.at).getTime() : -1;
      if (!existing || rowTime > existingTime) latestByUser.set(userId, row);
    };
    for (const r of recorded) consider(r.userId, { courseName: r.courseName, batchName: null, at: r.at });
    for (const r of live) consider(r.userId, { courseName: r.courseName, batchName: r.batchName, at: r.at });

    const { general_site_name } = await this.systemSettings.getByKeys(['general_site_name']);
    const siteName = general_site_name || 'Skillkoro';

    const recipients = studentRows
      .map((student) => ({ student, phone: (student.phone ?? '').trim() }))
      .filter((r) => r.phone);

    const job = await this.broadcastJobs.createJob({
      channel: 'sms',
      message: text,
      total: recipients.length,
      createdByAdminId,
    });

    if (recipients.length === 0) {
      await this.broadcastJobs.setJobStatus(job.id, 'completed');
      return { jobId: job.id, total: 0 };
    }

    const recipientRows = await this.broadcastJobs.addRecipients(
      job.id,
      recipients.map((r) => ({ studentId: r.student.id, recipient: r.phone })),
    );
    const rowByStudentId = new Map(recipientRows.map((r) => [r.studentId, r]));

    // Fire-and-forget: the controller responds with the jobId right away,
    // the frontend polls GET /broadcast-jobs/:id for live progress.
    void this.runBroadcast(job.id, text, recipients, latestByUser, siteName, rowByStudentId);

    return { jobId: job.id, total: recipients.length };
  }

  private async runBroadcast(
    jobId: number,
    text: string,
    recipients: { student: { id: number; firstName: string; lastName: string }; phone: string }[],
    latestByUser: Map<number, { courseName: string; batchName: string | null; at: Date | null }>,
    siteName: string,
    rowByStudentId: Map<number, { id: number }>,
  ) {
    await this.broadcastJobs.setJobStatus(jobId, 'running');

    try {
      await mapWithConcurrency(recipients, SEND_CONCURRENCY, async ({ student, phone }) => {
        const row = rowByStudentId.get(student.id);
        if (!row) return;

        const enrollment = latestByUser.get(student.id);
        const name = `${student.firstName} ${student.lastName}`.trim();
        // Real SMS templates use {{name}}/{{course_title}}; the manual composer
        // uses {{student_name}}/{{course_name}} — both alias the same real data.
        const rendered = text
          .split('{{student_name}}')
          .join(name)
          .split('{{name}}')
          .join(name)
          .split('{{course_name}}')
          .join(enrollment?.courseName ?? '')
          .split('{{course_title}}')
          .join(enrollment?.courseName ?? '')
          .split('{{batch_name}}')
          .join(enrollment?.batchName ?? '')
          .split('{{site_name}}')
          .join(siteName);

        const ok = await this.gateway.send(phone, rendered);
        this.logger.log(`SMS to ${phone} result: ${ok}`);
        await this.broadcastJobs.markRecipientResult(jobId, row.id, ok, ok ? undefined : 'SMS gateway rejected');
      });
    } catch (err) {
      this.logger.error(`Broadcast job ${jobId} failed unexpectedly`, err as Error);
    } finally {
      await this.broadcastJobs.setJobStatus(jobId, 'completed');
    }
  }
}

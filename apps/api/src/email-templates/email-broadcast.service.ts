import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, inArray, sql } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import {
  users,
  liveEnrollments,
  enrollments,
  courses,
  liveCourses,
  liveCourseBatches,
} from 'src/db/schema';
import { EmailTemplatesService } from './email-templates.service';
import { SystemSettingsService } from 'src/system-settings/system-settings.service';
import { mapWithConcurrency } from 'src/common/utils/concurrency.util';
import { BroadcastJobsService } from 'src/broadcast-jobs/broadcast-jobs.service';

// SMTP connections to have in flight at once for a manual broadcast — keeps
// a few hundred recipients from taking minutes to send one-by-one, without
// overwhelming the mail provider's connection limits.
const SEND_CONCURRENCY = 5;

type Enrollment = { courseName: string; batchName: string | null; at: Date | null };
type StudentRow = { id: number; firstName: string; lastName: string; email: string | null };

@Injectable()
export class EmailBroadcastService {
  private readonly logger = new Logger(EmailBroadcastService.name);

  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly emailTemplates: EmailTemplatesService,
    private readonly systemSettings: SystemSettingsService,
    private readonly broadcastJobs: BroadcastJobsService,
  ) {}

  /**
   * Kicks off a personalized email send to an ad-hoc list of student (user)
   * ids — used by the Student Filters page. Mirrors
   * SmsBroadcastService#startBroadcastToStudents: creates a broadcast job +
   * one pending recipient row per student, then sends in the background (not
   * awaited) so the caller gets a jobId back immediately and can poll
   * progress via BroadcastJobsService.
   */
  async startBroadcastToStudents(
    studentIds: number[],
    subject: string,
    message: string,
    createdByAdminId?: number,
  ) {
    const subjectText = subject?.trim();
    const bodyText = message?.trim();
    if (!subjectText) throw new BadRequestException('Subject is required');
    if (!bodyText) throw new BadRequestException('Message is required');
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      throw new BadRequestException('At least one student is required');
    }

    const [studentRows, recorded, live] = await Promise.all([
      this.db
        .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
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
      .map((student) => ({ student, email: (student.email ?? '').trim() }))
      .filter((r) => r.email);

    const job = await this.broadcastJobs.createJob({
      channel: 'email',
      subject: subjectText,
      message: bodyText,
      total: recipients.length,
      createdByAdminId,
    });

    if (recipients.length === 0) {
      await this.broadcastJobs.setJobStatus(job.id, 'completed');
      return { jobId: job.id, total: 0 };
    }

    const recipientRows = await this.broadcastJobs.addRecipients(
      job.id,
      recipients.map((r) => ({ studentId: r.student.id, recipient: r.email })),
    );
    const rowByStudentId = new Map(recipientRows.map((r) => [r.studentId, r]));

    void this.runBroadcast(job.id, subjectText, bodyText, recipients, latestByUser, siteName, rowByStudentId);

    return { jobId: job.id, total: recipients.length };
  }

  private async runBroadcast(
    jobId: number,
    subjectText: string,
    bodyText: string,
    recipients: { student: StudentRow; email: string }[],
    latestByUser: Map<number, Enrollment>,
    siteName: string,
    rowByStudentId: Map<number, { id: number }>,
  ) {
    await this.broadcastJobs.setJobStatus(jobId, 'running');

    const mailer = await this.emailTemplates.createBulkMailer();
    if (!mailer) {
      this.logger.warn('EMAIL_USER/PASS not set — skipping bulk email send');
      for (const { student } of recipients) {
        const row = rowByStudentId.get(student.id);
        if (row) await this.broadcastJobs.markRecipientResult(jobId, row.id, false, 'Email is not configured');
      }
      await this.broadcastJobs.setJobStatus(jobId, 'completed');
      return;
    }

    try {
      await mapWithConcurrency(recipients, SEND_CONCURRENCY, async ({ student, email }) => {
        const row = rowByStudentId.get(student.id);
        if (!row) return;

        const enrollment = latestByUser.get(student.id);
        const name = `${student.firstName} ${student.lastName}`.trim();
        const render = (text: string) =>
          text
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

        const renderedSubject = render(subjectText);
        const renderedBody = render(bodyText).replace(/\n/g, '<br/>');

        try {
          await mailer.transporter.sendMail({
            from: mailer.from,
            to: email,
            subject: renderedSubject,
            html: renderedBody,
          });
          await this.broadcastJobs.markRecipientResult(jobId, row.id, true);
        } catch (err) {
          this.logger.error(`Failed to send manual email to ${email}`, err as Error);
          await this.broadcastJobs.markRecipientResult(jobId, row.id, false, (err as Error).message);
        }
      });
    } catch (err) {
      this.logger.error(`Broadcast job ${jobId} failed unexpectedly`, err as Error);
    } finally {
      mailer.transporter.close();
      await this.broadcastJobs.setJobStatus(jobId, 'completed');
    }
  }
}

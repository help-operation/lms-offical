import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import {
  liveCourses,
  liveCourseBatches,
  liveEnrollments,
  liveSessions,
  liveSessionAttendance,
  liveCourseResources,
  liveCourseLessons,
  liveAssignments,
  liveAssignmentSubmissions,
  liveSubscriptions,
  users,
} from 'src/db/schema';

@Injectable()
export class LiveBatchService {
  constructor(@Inject(DB_TOKEN) private readonly db: DB) {}

  // ── Enrollment resolution (student) ───────────────────────────────────────
  // Returns the student's completed enrollment for a course, auto-linking the
  // userId by email if the purchase was made before login. Null if not enrolled.

  /** Returns null if not enrolled/suspended/expired; use resolveEnrollmentOrThrow for the distinguishable-reason variant. */
  private async resolveEnrollment(liveCourseId: number, userId: number) {
    const [byUser] = await this.db
      .select()
      .from(liveEnrollments)
      .where(
        and(
          eq(liveEnrollments.liveCourseId, liveCourseId),
          eq(liveEnrollments.userId, userId),
        ),
      )
      .limit(1);
    if (byUser && await this.isAccessible(byUser)) return byUser;

    const [userRow] = await this.db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!userRow?.email) return null;

    const [byEmail] = await this.db
      .select()
      .from(liveEnrollments)
      .where(
        and(
          eq(liveEnrollments.liveCourseId, liveCourseId),
          eq(liveEnrollments.email, userRow.email),
        ),
      )
      .limit(1);
    if (!byEmail || !await this.isAccessible(byEmail)) return null;

    await this.db
      .update(liveEnrollments)
      .set({ userId })
      .where(eq(liveEnrollments.id, byEmail.id));

    return { ...byEmail, userId };
  }

  private async isAccessible(row: { id: number; status: string; expiresAt: Date | null; paymentMode?: string }): Promise<boolean> {
    if (row.status !== 'completed') return false;
    if (row.expiresAt && row.expiresAt <= new Date()) return false;

    // Subscription-specific checks
    if (row.paymentMode === 'subscription') {
      const [subscription] = await this.db
        .select()
        .from(liveSubscriptions)
        .where(eq(liveSubscriptions.enrollmentId, row.id))
        .orderBy(sql`${liveSubscriptions.createdAt} DESC`)
        .limit(1);

      if (subscription) {
        if (subscription.status === 'expired') return false;
        if (subscription.status === 'cancelled' && subscription.nextBillingAt <= new Date()) return false;
        if (subscription.status === 'past_due') {
          const graceEnd = new Date(subscription.nextBillingAt);
          graceEnd.setDate(graceEnd.getDate() + 3);
          if (new Date() > graceEnd) return false;
        }
        if (subscription.status === 'paused') return false;
      }
    }

    return true;
  }

  // ── Student: full batch dashboard ─────────────────────────────────────────

  async getStudentDashboard(liveCourseId: number, userId: number) {
    const enrollment = await this.resolveEnrollment(liveCourseId, userId);
    if (!enrollment) throw new ForbiddenException('Not enrolled in this course');

    const [course] = await this.db
      .select()
      .from(liveCourses)
      .where(eq(liveCourses.id, liveCourseId))
      .limit(1);
    if (!course) throw new NotFoundException('Live course not found');

    const batch = enrollment.batchId
      ? (await this.db
          .select()
          .from(liveCourseBatches)
          .where(eq(liveCourseBatches.id, enrollment.batchId))
          .limit(1))[0] ?? null
      : null;

    // Sessions for the batch (or for the course if no batch linked)
    const sessions = batch
      ? await this.db
          .select()
          .from(liveSessions)
          .where(eq(liveSessions.batchId, batch.id))
          .orderBy(asc(liveSessions.scheduledAt))
      : [];

    // Attendance for this user
    const sessionIds = sessions.map((s) => s.id);
    const attendedRows = sessionIds.length
      ? await this.db
          .select({ sessionId: liveSessionAttendance.sessionId })
          .from(liveSessionAttendance)
          .where(
            and(
              eq(liveSessionAttendance.userId, userId),
              inArray(liveSessionAttendance.sessionId, sessionIds),
            ),
          )
      : [];
    const attendedSet = new Set(attendedRows.map((r) => r.sessionId));

    // Resources (course-wide OR batch-specific)
    const resources = await this.db
      .select()
      .from(liveCourseResources)
      .where(eq(liveCourseResources.liveCourseId, liveCourseId))
      .orderBy(asc(liveCourseResources.order));
    const visibleResources = resources.filter(
      (r) => r.batchId === null || (batch && r.batchId === batch.id),
    );

    // Assignments for the batch + this student's submission
    const assignments = batch
      ? await this.db
          .select()
          .from(liveAssignments)
          .where(eq(liveAssignments.batchId, batch.id))
          .orderBy(asc(liveAssignments.dueDate))
      : [];
    const assignmentIds = assignments.map((a) => a.id);
    const mySubs = assignmentIds.length
      ? await this.db
          .select()
          .from(liveAssignmentSubmissions)
          .where(
            and(
              eq(liveAssignmentSubmissions.userId, userId),
              inArray(liveAssignmentSubmissions.assignmentId, assignmentIds),
            ),
          )
      : [];
    const subByAssignment = new Map(mySubs.map((s) => [s.assignmentId, s]));

    // Whether the course has any published curriculum lessons — drives the
    // "Course Content" button on the student dashboard.
    const [lessonCount] = await this.db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(liveCourseLessons)
      .where(eq(liveCourseLessons.liveCourseId, liveCourseId));

    return {
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        paidAt: enrollment.paidAt,
        amount: enrollment.amount,
        batchId: enrollment.batchId,
      },
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        instructors: course.instructors ?? [],
        certificate: course.certificate ?? {},
        supportWhatsapp: course.urgencyCta?.whatsapp ?? null,
        hasContent: (lessonCount?.count ?? 0) > 0,
      },
      batch,
      sessions: sessions.map((s) => ({ ...s, attended: attendedSet.has(s.id) })),
      resources: visibleResources,
      assignments: assignments.map((a) => ({
        ...a,
        mySubmission: subByAssignment.get(a.id) ?? null,
      })),
      attendanceCount: attendedSet.size,
    };
  }

  // ── Student: join a session (records attendance, returns meeting URL) ──────

  async joinSession(sessionId: number, userId: number) {
    const [session] = await this.db
      .select()
      .from(liveSessions)
      .where(eq(liveSessions.id, sessionId))
      .limit(1);
    if (!session) throw new NotFoundException('Session not found');

    const enrollment = await this.resolveEnrollment(session.liveCourseId, userId);
    if (!enrollment) throw new ForbiddenException('Not enrolled in this course');

    // Record attendance once (ignore duplicates).
    await this.db
      .insert(liveSessionAttendance)
      .values({ sessionId, userId })
      .onConflictDoNothing();

    if (!session.meetingUrl) {
      throw new NotFoundException('No meeting link is set for this session yet');
    }
    return { meetingUrl: session.meetingUrl };
  }

  // ── Student: submit / resubmit an assignment ──────────────────────────────

  async submitAssignment(
    assignmentId: number,
    userId: number,
    dto: { submissionUrl?: string; submissionText?: string },
  ) {
    const [assignment] = await this.db
      .select()
      .from(liveAssignments)
      .where(eq(liveAssignments.id, assignmentId))
      .limit(1);
    if (!assignment) throw new NotFoundException('Assignment not found');

    const enrollment = await this.resolveEnrollment(assignment.liveCourseId, userId);
    if (!enrollment) throw new ForbiddenException('Not enrolled in this course');

    if (!dto.submissionUrl && !dto.submissionText) {
      throw new ForbiddenException('Provide a submission link or text');
    }

    const [existing] = await this.db
      .select({ id: liveAssignmentSubmissions.id })
      .from(liveAssignmentSubmissions)
      .where(
        and(
          eq(liveAssignmentSubmissions.assignmentId, assignmentId),
          eq(liveAssignmentSubmissions.userId, userId),
        ),
      )
      .limit(1);

    if (existing) {
      const [updated] = await this.db
        .update(liveAssignmentSubmissions)
        .set({
          submissionUrl: dto.submissionUrl ?? null,
          submissionText: dto.submissionText ?? null,
          // Reset grading on resubmission.
          status: 'submitted',
          score: null,
          feedback: null,
          submittedAt: new Date(),
          gradedAt: null,
        })
        .where(eq(liveAssignmentSubmissions.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await this.db
      .insert(liveAssignmentSubmissions)
      .values({
        assignmentId,
        userId,
        submissionUrl: dto.submissionUrl ?? null,
        submissionText: dto.submissionText ?? null,
      })
      .returning();
    return created;
  }

  // ════════════════════════════ ADMIN: sessions ════════════════════════════

  private async assertBatch(batchId: number) {
    const [b] = await this.db
      .select()
      .from(liveCourseBatches)
      .where(eq(liveCourseBatches.id, batchId))
      .limit(1);
    if (!b) throw new NotFoundException('Batch not found');
    return b;
  }

  async listSessions(batchId: number) {
    return this.db
      .select()
      .from(liveSessions)
      .where(eq(liveSessions.batchId, batchId))
      .orderBy(asc(liveSessions.scheduledAt));
  }

  async createSession(
    batchId: number,
    dto: {
      title: string;
      description?: string;
      scheduledAt: string;
      durationMinutes?: number;
      meetingUrl?: string;
      status?: 'scheduled' | 'live' | 'completed' | 'cancelled';
      recordingUrl?: string;
    },
  ) {
    const batch = await this.assertBatch(batchId);
    const existing = await this.db
      .select({ id: liveSessions.id })
      .from(liveSessions)
      .where(eq(liveSessions.batchId, batchId));

    const [created] = await this.db
      .insert(liveSessions)
      .values({
        liveCourseId: batch.liveCourseId,
        batchId,
        title: dto.title,
        description: dto.description ?? null,
        scheduledAt: new Date(dto.scheduledAt),
        durationMinutes: dto.durationMinutes ?? 60,
        meetingUrl: dto.meetingUrl ?? null,
        status: dto.status ?? 'scheduled',
        recordingUrl: dto.recordingUrl ?? null,
        order: existing.length,
      })
      .returning();
    return created;
  }

  async updateSession(
    sessionId: number,
    dto: {
      title?: string;
      description?: string | null;
      scheduledAt?: string;
      durationMinutes?: number;
      meetingUrl?: string | null;
      status?: 'scheduled' | 'live' | 'completed' | 'cancelled';
      recordingUrl?: string | null;
    },
  ) {
    const updates: Partial<typeof liveSessions.$inferInsert> = { updatedAt: new Date() };
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.scheduledAt !== undefined) updates.scheduledAt = new Date(dto.scheduledAt);
    if (dto.durationMinutes !== undefined) updates.durationMinutes = dto.durationMinutes;
    if (dto.meetingUrl !== undefined) updates.meetingUrl = dto.meetingUrl;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.recordingUrl !== undefined) updates.recordingUrl = dto.recordingUrl;

    const [updated] = await this.db
      .update(liveSessions)
      .set(updates)
      .where(eq(liveSessions.id, sessionId))
      .returning();
    if (!updated) throw new NotFoundException('Session not found');
    return updated;
  }

  async deleteSession(sessionId: number) {
    await this.db.delete(liveSessions).where(eq(liveSessions.id, sessionId));
    return { deleted: true };
  }

  // ════════════════════════════ ADMIN: resources ═══════════════════════════

  async listResources(liveCourseId: number) {
    return this.db
      .select()
      .from(liveCourseResources)
      .where(eq(liveCourseResources.liveCourseId, liveCourseId))
      .orderBy(asc(liveCourseResources.order));
  }

  async createResource(
    liveCourseId: number,
    dto: { title: string; fileUrl: string; fileType?: string; batchId?: number | null },
  ) {
    const existing = await this.db
      .select({ id: liveCourseResources.id })
      .from(liveCourseResources)
      .where(eq(liveCourseResources.liveCourseId, liveCourseId));

    const [created] = await this.db
      .insert(liveCourseResources)
      .values({
        liveCourseId,
        batchId: dto.batchId ?? null,
        title: dto.title,
        fileUrl: dto.fileUrl,
        fileType: dto.fileType ?? null,
        order: existing.length,
      })
      .returning();
    return created;
  }

  async updateResource(
    resourceId: number,
    dto: { title?: string; fileUrl?: string; fileType?: string | null; batchId?: number | null },
  ) {
    const [updated] = await this.db
      .update(liveCourseResources)
      .set({ ...dto })
      .where(eq(liveCourseResources.id, resourceId))
      .returning();
    if (!updated) throw new NotFoundException('Resource not found');
    return updated;
  }

  async deleteResource(resourceId: number) {
    await this.db.delete(liveCourseResources).where(eq(liveCourseResources.id, resourceId));
    return { deleted: true };
  }

  // ════════════════════════════ ADMIN: assignments ═════════════════════════

  async listAssignments(batchId: number) {
    return this.db
      .select()
      .from(liveAssignments)
      .where(eq(liveAssignments.batchId, batchId))
      .orderBy(asc(liveAssignments.dueDate));
  }

  async createAssignment(
    batchId: number,
    dto: {
      title: string;
      description?: string;
      instructionsUrl?: string;
      dueDate?: string;
      maxScore?: number;
    },
  ) {
    const batch = await this.assertBatch(batchId);
    const [created] = await this.db
      .insert(liveAssignments)
      .values({
        liveCourseId: batch.liveCourseId,
        batchId,
        title: dto.title,
        description: dto.description ?? null,
        instructionsUrl: dto.instructionsUrl ?? null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        maxScore: dto.maxScore ?? 100,
      })
      .returning();
    return created;
  }

  async updateAssignment(
    assignmentId: number,
    dto: {
      title?: string;
      description?: string | null;
      instructionsUrl?: string | null;
      dueDate?: string | null;
      maxScore?: number;
    },
  ) {
    const updates: Partial<typeof liveAssignments.$inferInsert> = { updatedAt: new Date() };
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.instructionsUrl !== undefined) updates.instructionsUrl = dto.instructionsUrl;
    if (dto.dueDate !== undefined) updates.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.maxScore !== undefined) updates.maxScore = dto.maxScore;

    const [updated] = await this.db
      .update(liveAssignments)
      .set(updates)
      .where(eq(liveAssignments.id, assignmentId))
      .returning();
    if (!updated) throw new NotFoundException('Assignment not found');
    return updated;
  }

  async deleteAssignment(assignmentId: number) {
    await this.db.delete(liveAssignments).where(eq(liveAssignments.id, assignmentId));
    return { deleted: true };
  }

  // ── Admin: submissions list + grading ─────────────────────────────────────

  async listSubmissions(assignmentId: number) {
    return this.db
      .select({
        id: liveAssignmentSubmissions.id,
        userId: liveAssignmentSubmissions.userId,
        submissionUrl: liveAssignmentSubmissions.submissionUrl,
        submissionText: liveAssignmentSubmissions.submissionText,
        status: liveAssignmentSubmissions.status,
        score: liveAssignmentSubmissions.score,
        feedback: liveAssignmentSubmissions.feedback,
        submittedAt: liveAssignmentSubmissions.submittedAt,
        gradedAt: liveAssignmentSubmissions.gradedAt,
        studentFirstName: users.firstName,
        studentLastName: users.lastName,
        studentEmail: users.email,
      })
      .from(liveAssignmentSubmissions)
      .innerJoin(users, eq(liveAssignmentSubmissions.userId, users.id))
      .where(eq(liveAssignmentSubmissions.assignmentId, assignmentId))
      .orderBy(desc(liveAssignmentSubmissions.submittedAt));
  }

  async gradeSubmission(submissionId: number, dto: { score: number; feedback?: string }) {
    const [updated] = await this.db
      .update(liveAssignmentSubmissions)
      .set({
        score: dto.score,
        feedback: dto.feedback ?? null,
        status: 'graded',
        gradedAt: new Date(),
      })
      .where(eq(liveAssignmentSubmissions.id, submissionId))
      .returning();
    if (!updated) throw new NotFoundException('Submission not found');
    return updated;
  }
}

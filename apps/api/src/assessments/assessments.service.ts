import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import {
  assignments,
  assignmentSubmissions,
  courseModules,
  courses,
  enrollments,
  lessons,
  lessonResources,
  quizzes,
  quizQuestions,
  quizAnswers,
  quizAttempts,
  users,
} from 'src/db/schema';
import type {
  UpsertQuizDto,
  UpsertQuestionDto,
  SubmitQuizDto,
  UpsertAssignmentDto,
  SubmitAssignmentDto,
  GradeSubmissionDto,
  UpsertResourceDto,
} from './dto/assessment.dto';

@Injectable()
export class AssessmentsService {
  constructor(@Inject(DB_TOKEN) private readonly db: DB) {}

  // ── Shared guards ────────────────────────────────────────────────────────────

  private async getLessonCourse(lessonId: number) {
    const [row] = await this.db
      .select({
        lessonId: lessons.id,
        isFree: lessons.isFree,
        courseId: courseModules.courseId,
        instructorId: courses.instructorId,
      })
      .from(lessons)
      .innerJoin(courseModules, eq(lessons.moduleId, courseModules.id))
      .innerJoin(courses, eq(courseModules.courseId, courses.id))
      .where(eq(lessons.id, lessonId))
      .limit(1);
    if (!row) throw new NotFoundException('Lesson not found');
    return row;
  }

  private async assertLessonOwner(lessonId: number, instructorId: number, isAdmin: boolean) {
    const row = await this.getLessonCourse(lessonId);
    if (!isAdmin && row.instructorId !== instructorId) {
      throw new ForbiddenException('Access denied');
    }
    return row;
  }

  private async assertEnrolledForLesson(lessonId: number, userId: number) {
    const row = await this.getLessonCourse(lessonId);
    if (row.isFree) return row;
    // Matches EnrollmentsService.getEnrollmentInfo: 'active' or 'completed'
    // both count as enrolled, so students who finished the course don't lose
    // access to resources/quizzes/assignments.
    const [enr] = await this.db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.userId, userId),
          eq(enrollments.courseId, row.courseId),
          inArray(enrollments.status, ['active', 'completed']),
        ),
      )
      .limit(1);
    if (!enr) throw new ForbiddenException('You must be enrolled to access this');
    return row;
  }

  private async getQuizOwnerCtx(quizId: number) {
    const [quiz] = await this.db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, quizId))
      .limit(1);
    if (!quiz) throw new NotFoundException('Quiz not found');
    return quiz;
  }

  // ── Quiz — instructor authoring ──────────────────────────────────────────────

  async getQuizForEdit(lessonId: number, instructorId: number, isAdmin: boolean) {
    await this.assertLessonOwner(lessonId, instructorId, isAdmin);
    return this.loadQuiz(lessonId, true);
  }

  private async loadQuiz(lessonId: number, includeCorrect: boolean) {
    const [quiz] = await this.db
      .select()
      .from(quizzes)
      .where(eq(quizzes.lessonId, lessonId))
      .limit(1);
    if (!quiz) return null;

    const questions = await this.db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quiz.id))
      .orderBy(asc(quizQuestions.order));

    const qIds = questions.map((q) => q.id);
    const answers = qIds.length
      ? await this.db
          .select()
          .from(quizAnswers)
          .where(inArray(quizAnswers.questionId, qIds))
      : [];

    return {
      ...quiz,
      questions: questions.map((q) => ({
        ...q,
        answers: answers
          .filter((a) => a.questionId === q.id)
          .map((a) =>
            includeCorrect ? a : { id: a.id, questionId: a.questionId, answer: a.answer },
          ),
      })),
    };
  }

  async upsertQuiz(
    lessonId: number,
    instructorId: number,
    isAdmin: boolean,
    dto: UpsertQuizDto,
  ) {
    const ctx = await this.assertLessonOwner(lessonId, instructorId, isAdmin);
    const [existing] = await this.db
      .select()
      .from(quizzes)
      .where(eq(quizzes.lessonId, lessonId))
      .limit(1);

    if (existing) {
      const [updated] = await this.db
        .update(quizzes)
        .set({ title: dto.title, passingScore: dto.passingScore, updatedAt: new Date() })
        .where(eq(quizzes.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await this.db
      .insert(quizzes)
      .values({
        lessonId,
        courseId: ctx.courseId,
        title: dto.title,
        passingScore: dto.passingScore,
      })
      .returning();
    return created;
  }

  async deleteQuiz(lessonId: number, instructorId: number, isAdmin: boolean) {
    await this.assertLessonOwner(lessonId, instructorId, isAdmin);
    await this.db.delete(quizzes).where(eq(quizzes.lessonId, lessonId));
    return { deleted: true };
  }

  async addQuestion(
    quizId: number,
    instructorId: number,
    isAdmin: boolean,
    dto: UpsertQuestionDto,
  ) {
    const quiz = await this.getQuizOwnerCtx(quizId);
    if (quiz.lessonId) await this.assertLessonOwner(quiz.lessonId, instructorId, isAdmin);

    const existingQuestions = await this.db
      .select({ id: quizQuestions.id })
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId));

    const [question] = await this.db
      .insert(quizQuestions)
      .values({
        quizId,
        question: dto.question,
        type: dto.type,
        order: dto.order ?? existingQuestions.length,
      })
      .returning();

    await this.db.insert(quizAnswers).values(
      dto.answers.map((a) => ({
        questionId: question.id,
        answer: a.answer,
        isCorrect: a.isCorrect,
      })),
    );

    return this.loadQuiz(quiz.lessonId!, true);
  }

  async updateQuestion(
    questionId: number,
    instructorId: number,
    isAdmin: boolean,
    dto: UpsertQuestionDto,
  ) {
    const [q] = await this.db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.id, questionId))
      .limit(1);
    if (!q) throw new NotFoundException('Question not found');
    const quiz = await this.getQuizOwnerCtx(q.quizId);
    if (quiz.lessonId) await this.assertLessonOwner(quiz.lessonId, instructorId, isAdmin);

    await this.db
      .update(quizQuestions)
      .set({ question: dto.question, type: dto.type })
      .where(eq(quizQuestions.id, questionId));

    await this.db.delete(quizAnswers).where(eq(quizAnswers.questionId, questionId));
    await this.db.insert(quizAnswers).values(
      dto.answers.map((a) => ({
        questionId,
        answer: a.answer,
        isCorrect: a.isCorrect,
      })),
    );

    return this.loadQuiz(quiz.lessonId!, true);
  }

  async deleteQuestion(questionId: number, instructorId: number, isAdmin: boolean) {
    const [q] = await this.db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.id, questionId))
      .limit(1);
    if (!q) throw new NotFoundException('Question not found');
    const quiz = await this.getQuizOwnerCtx(q.quizId);
    if (quiz.lessonId) await this.assertLessonOwner(quiz.lessonId, instructorId, isAdmin);
    await this.db.delete(quizQuestions).where(eq(quizQuestions.id, questionId));
    return { deleted: true };
  }

  // ── Quiz — student ───────────────────────────────────────────────────────────

  async getQuizForTake(lessonId: number, userId: number) {
    await this.assertEnrolledForLesson(lessonId, userId);
    const quiz = await this.loadQuiz(lessonId, false);
    if (!quiz) return null;

    const [lastAttempt] = await this.db
      .select()
      .from(quizAttempts)
      .where(and(eq(quizAttempts.quizId, quiz.id), eq(quizAttempts.userId, userId)))
      .orderBy(desc(quizAttempts.completedAt))
      .limit(1);

    return { ...quiz, lastAttempt: lastAttempt ?? null };
  }

  async submitQuiz(quizId: number, userId: number, dto: SubmitQuizDto) {
    const quiz = await this.getQuizOwnerCtx(quizId);
    if (quiz.lessonId) await this.assertEnrolledForLesson(quiz.lessonId, userId);

    const questions = await this.db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId));
    if (questions.length === 0) {
      throw new NotFoundException('Quiz has no questions');
    }

    const qIds = questions.map((q) => q.id);
    const answers = await this.db
      .select()
      .from(quizAnswers)
      .where(inArray(quizAnswers.questionId, qIds));

    const submittedByQ = new Map<number, Set<number>>();
    for (const a of dto.answers) {
      submittedByQ.set(a.questionId, new Set(a.answerIds));
    }

    let correct = 0;
    for (const q of questions) {
      const correctIds = new Set(
        answers.filter((a) => a.questionId === q.id && a.isCorrect).map((a) => a.id),
      );
      const picked = submittedByQ.get(q.id) ?? new Set<number>();
      const isRight =
        correctIds.size === picked.size &&
        [...correctIds].every((id) => picked.has(id));
      if (isRight) correct += 1;
    }

    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= quiz.passingScore;

    const [attempt] = await this.db
      .insert(quizAttempts)
      .values({ userId, quizId, score: String(score), passed })
      .returning();

    return {
      attemptId: attempt.id,
      score,
      passed,
      correctCount: correct,
      totalQuestions: questions.length,
      passingScore: quiz.passingScore,
    };
  }

  // ── Assignment — instructor authoring ────────────────────────────────────────

  async getAssignmentForEdit(lessonId: number, instructorId: number, isAdmin: boolean) {
    await this.assertLessonOwner(lessonId, instructorId, isAdmin);
    const [assignment] = await this.db
      .select()
      .from(assignments)
      .where(eq(assignments.lessonId, lessonId))
      .limit(1);
    return assignment ?? null;
  }

  async upsertAssignment(
    lessonId: number,
    instructorId: number,
    isAdmin: boolean,
    dto: UpsertAssignmentDto,
  ) {
    const ctx = await this.assertLessonOwner(lessonId, instructorId, isAdmin);
    const [existing] = await this.db
      .select()
      .from(assignments)
      .where(eq(assignments.lessonId, lessonId))
      .limit(1);

    const values = {
      title: dto.title,
      description: dto.description ?? null,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      maxFiles: dto.maxFiles,
      filesRequired: dto.filesRequired,
    };

    if (existing) {
      const [updated] = await this.db
        .update(assignments)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(assignments.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await this.db
      .insert(assignments)
      .values({ lessonId, courseId: ctx.courseId, ...values })
      .returning();
    return created;
  }

  async deleteAssignment(lessonId: number, instructorId: number, isAdmin: boolean) {
    await this.assertLessonOwner(lessonId, instructorId, isAdmin);
    await this.db.delete(assignments).where(eq(assignments.lessonId, lessonId));
    return { deleted: true };
  }

  async listSubmissions(assignmentId: number, instructorId: number, isAdmin: boolean) {
    const [assignment] = await this.db
      .select()
      .from(assignments)
      .where(eq(assignments.id, assignmentId))
      .limit(1);
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.lessonId) {
      await this.assertLessonOwner(assignment.lessonId, instructorId, isAdmin);
    }

    return this.db
      .select({
        id: assignmentSubmissions.id,
        content: assignmentSubmissions.content,
        fileUrls: assignmentSubmissions.fileUrls,
        status: assignmentSubmissions.status,
        grade: assignmentSubmissions.grade,
        feedback: assignmentSubmissions.feedback,
        submittedAt: assignmentSubmissions.submittedAt,
        gradedAt: assignmentSubmissions.gradedAt,
        userId: assignmentSubmissions.userId,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(assignmentSubmissions)
      .innerJoin(users, eq(assignmentSubmissions.userId, users.id))
      .where(eq(assignmentSubmissions.assignmentId, assignmentId))
      .orderBy(desc(assignmentSubmissions.submittedAt));
  }

  async gradeSubmission(
    submissionId: number,
    instructorId: number,
    isAdmin: boolean,
    dto: GradeSubmissionDto,
  ) {
    const [sub] = await this.db
      .select()
      .from(assignmentSubmissions)
      .where(eq(assignmentSubmissions.id, submissionId))
      .limit(1);
    if (!sub) throw new NotFoundException('Submission not found');

    const [assignment] = await this.db
      .select()
      .from(assignments)
      .where(eq(assignments.id, sub.assignmentId))
      .limit(1);
    if (assignment?.lessonId) {
      await this.assertLessonOwner(assignment.lessonId, instructorId, isAdmin);
    }

    const [updated] = await this.db
      .update(assignmentSubmissions)
      .set({
        grade: String(dto.grade),
        feedback: dto.feedback ?? null,
        status: 'graded',
        gradedAt: new Date(),
      })
      .where(eq(assignmentSubmissions.id, submissionId))
      .returning();
    return updated;
  }

  // ── Assignment — student ─────────────────────────────────────────────────────

  async getAssignmentForView(lessonId: number, userId: number) {
    await this.assertEnrolledForLesson(lessonId, userId);
    const [assignment] = await this.db
      .select()
      .from(assignments)
      .where(eq(assignments.lessonId, lessonId))
      .limit(1);
    if (!assignment) return null;

    const [submission] = await this.db
      .select()
      .from(assignmentSubmissions)
      .where(
        and(
          eq(assignmentSubmissions.assignmentId, assignment.id),
          eq(assignmentSubmissions.userId, userId),
        ),
      )
      .limit(1);

    return { ...assignment, submission: submission ?? null };
  }

  async submitAssignment(
    assignmentId: number,
    userId: number,
    dto: SubmitAssignmentDto,
  ) {
    const [assignment] = await this.db
      .select()
      .from(assignments)
      .where(eq(assignments.id, assignmentId))
      .limit(1);
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.lessonId) {
      await this.assertEnrolledForLesson(assignment.lessonId, userId);
    }

    const fileUrls = dto.fileUrls ?? [];
    if (fileUrls.length > assignment.maxFiles) {
      throw new BadRequestException(
        `This assignment allows at most ${assignment.maxFiles} file${assignment.maxFiles === 1 ? '' : 's'}`,
      );
    }
    if (assignment.filesRequired && fileUrls.length === 0) {
      throw new BadRequestException('This assignment requires at least one file');
    }

    const [existing] = await this.db
      .select()
      .from(assignmentSubmissions)
      .where(
        and(
          eq(assignmentSubmissions.assignmentId, assignmentId),
          eq(assignmentSubmissions.userId, userId),
        ),
      )
      .limit(1);

    if (existing) {
      const [updated] = await this.db
        .update(assignmentSubmissions)
        .set({
          content: dto.content ?? null,
          fileUrls,
          status: 'submitted',
          grade: null,
          feedback: null,
          gradedAt: null,
          submittedAt: new Date(),
        })
        .where(eq(assignmentSubmissions.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await this.db
      .insert(assignmentSubmissions)
      .values({
        userId,
        assignmentId,
        content: dto.content ?? null,
        fileUrls,
      })
      .returning();
    return created;
  }

  // ── Lesson resources ─────────────────────────────────────────────────────────

  async listResourcesForEdit(lessonId: number, instructorId: number, isAdmin: boolean) {
    await this.assertLessonOwner(lessonId, instructorId, isAdmin);
    return this.db
      .select()
      .from(lessonResources)
      .where(eq(lessonResources.lessonId, lessonId))
      .orderBy(asc(lessonResources.id));
  }

  async addResource(
    lessonId: number,
    instructorId: number,
    isAdmin: boolean,
    dto: UpsertResourceDto,
  ) {
    await this.assertLessonOwner(lessonId, instructorId, isAdmin);
    const [created] = await this.db
      .insert(lessonResources)
      .values({ lessonId, title: dto.title, type: dto.type, url: dto.url ?? null, content: dto.content ?? null })
      .returning();
    return created;
  }

  async deleteResource(resourceId: number, instructorId: number, isAdmin: boolean) {
    const [resource] = await this.db
      .select()
      .from(lessonResources)
      .where(eq(lessonResources.id, resourceId))
      .limit(1);
    if (!resource) throw new NotFoundException('Resource not found');
    await this.assertLessonOwner(resource.lessonId, instructorId, isAdmin);
    await this.db.delete(lessonResources).where(eq(lessonResources.id, resourceId));
    return { deleted: true };
  }

  async listResourcesForStudent(lessonId: number, userId: number) {
    await this.assertEnrolledForLesson(lessonId, userId);
    return this.db
      .select()
      .from(lessonResources)
      .where(eq(lessonResources.lessonId, lessonId))
      .orderBy(asc(lessonResources.id));
  }
}

import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import {
  liveCourseLessons,
  liveLessonQuizzes,
  liveLessonQuizQuestions,
  liveLessonQuizAnswers,
  liveLessonQuizAttempts,
  liveLessonAssignments,
  liveLessonAssignmentSubmissions,
  users,
} from 'src/db/schema';
import type {
  UpsertQuizDto,
  UpsertQuestionDto,
  SubmitQuizDto,
  UpsertAssignmentDto,
  SubmitAssignmentDto,
  GradeSubmissionDto,
} from 'src/assessments/dto/assessment.dto';
import { LiveCourseCurriculumService } from './live-course-curriculum.service';

/**
 * Live-course lesson assessments (quizzes & assignments). Mirrors the recorded
 * AssessmentsService but on the parallel live_lesson_* tables. Live courses are
 * admin-managed (no per-instructor ownership), so access is gated purely by the
 * controller's `update_live` / enrollment guards.
 */
@Injectable()
export class LiveLessonAssessmentsService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly curriculum: LiveCourseCurriculumService,
  ) {}

  private async getLessonCtx(lessonId: number) {
    const [row] = await this.db
      .select({ id: liveCourseLessons.id, liveCourseId: liveCourseLessons.liveCourseId, isFree: liveCourseLessons.isFree })
      .from(liveCourseLessons)
      .where(eq(liveCourseLessons.id, lessonId))
      .limit(1);
    if (!row) throw new NotFoundException('Lesson not found');
    return row;
  }

  private async loadQuiz(lessonId: number, includeCorrect: boolean) {
    const [quiz] = await this.db
      .select()
      .from(liveLessonQuizzes)
      .where(eq(liveLessonQuizzes.lessonId, lessonId))
      .limit(1);
    if (!quiz) return null;

    const questions = await this.db
      .select()
      .from(liveLessonQuizQuestions)
      .where(eq(liveLessonQuizQuestions.quizId, quiz.id))
      .orderBy(asc(liveLessonQuizQuestions.order));

    const qIds = questions.map((q) => q.id);
    const answers = qIds.length
      ? await this.db
          .select()
          .from(liveLessonQuizAnswers)
          .where(inArray(liveLessonQuizAnswers.questionId, qIds))
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

  // ── Quiz authoring ───────────────────────────────────────────────────────────

  async getQuizForEdit(lessonId: number) {
    await this.getLessonCtx(lessonId);
    return this.loadQuiz(lessonId, true);
  }

  async upsertQuiz(lessonId: number, dto: UpsertQuizDto) {
    const ctx = await this.getLessonCtx(lessonId);
    const [existing] = await this.db
      .select()
      .from(liveLessonQuizzes)
      .where(eq(liveLessonQuizzes.lessonId, lessonId))
      .limit(1);

    if (existing) {
      const [updated] = await this.db
        .update(liveLessonQuizzes)
        .set({ title: dto.title, passingScore: dto.passingScore, updatedAt: new Date() })
        .where(eq(liveLessonQuizzes.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await this.db
      .insert(liveLessonQuizzes)
      .values({
        lessonId,
        liveCourseId: ctx.liveCourseId,
        title: dto.title,
        passingScore: dto.passingScore,
      })
      .returning();
    return created;
  }

  async deleteQuiz(lessonId: number) {
    await this.getLessonCtx(lessonId);
    await this.db.delete(liveLessonQuizzes).where(eq(liveLessonQuizzes.lessonId, lessonId));
    return { deleted: true };
  }

  private async getQuiz(quizId: number) {
    const [quiz] = await this.db
      .select()
      .from(liveLessonQuizzes)
      .where(eq(liveLessonQuizzes.id, quizId))
      .limit(1);
    if (!quiz) throw new NotFoundException('Quiz not found');
    return quiz;
  }

  async addQuestion(quizId: number, dto: UpsertQuestionDto) {
    const quiz = await this.getQuiz(quizId);

    const existing = await this.db
      .select({ id: liveLessonQuizQuestions.id })
      .from(liveLessonQuizQuestions)
      .where(eq(liveLessonQuizQuestions.quizId, quizId));

    const [question] = await this.db
      .insert(liveLessonQuizQuestions)
      .values({
        quizId,
        question: dto.question,
        type: dto.type,
        order: dto.order ?? existing.length,
      })
      .returning();

    await this.db.insert(liveLessonQuizAnswers).values(
      dto.answers.map((a) => ({
        questionId: question.id,
        answer: a.answer,
        isCorrect: a.isCorrect,
      })),
    );

    return this.loadQuiz(quiz.lessonId!, true);
  }

  async updateQuestion(questionId: number, dto: UpsertQuestionDto) {
    const [q] = await this.db
      .select()
      .from(liveLessonQuizQuestions)
      .where(eq(liveLessonQuizQuestions.id, questionId))
      .limit(1);
    if (!q) throw new NotFoundException('Question not found');
    const quiz = await this.getQuiz(q.quizId);

    await this.db
      .update(liveLessonQuizQuestions)
      .set({ question: dto.question, type: dto.type })
      .where(eq(liveLessonQuizQuestions.id, questionId));

    await this.db.delete(liveLessonQuizAnswers).where(eq(liveLessonQuizAnswers.questionId, questionId));
    await this.db.insert(liveLessonQuizAnswers).values(
      dto.answers.map((a) => ({ questionId, answer: a.answer, isCorrect: a.isCorrect })),
    );

    return this.loadQuiz(quiz.lessonId!, true);
  }

  async deleteQuestion(questionId: number) {
    const [q] = await this.db
      .select()
      .from(liveLessonQuizQuestions)
      .where(eq(liveLessonQuizQuestions.id, questionId))
      .limit(1);
    if (!q) throw new NotFoundException('Question not found');
    await this.db.delete(liveLessonQuizQuestions).where(eq(liveLessonQuizQuestions.id, questionId));
    return { deleted: true };
  }

  // ── Assignment authoring + grading ───────────────────────────────────────────

  async getAssignmentForEdit(lessonId: number) {
    await this.getLessonCtx(lessonId);
    const [assignment] = await this.db
      .select()
      .from(liveLessonAssignments)
      .where(eq(liveLessonAssignments.lessonId, lessonId))
      .limit(1);
    return assignment ?? null;
  }

  async upsertAssignment(lessonId: number, dto: UpsertAssignmentDto) {
    const ctx = await this.getLessonCtx(lessonId);
    const [existing] = await this.db
      .select()
      .from(liveLessonAssignments)
      .where(eq(liveLessonAssignments.lessonId, lessonId))
      .limit(1);

    const values = {
      title: dto.title,
      description: dto.description ?? null,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
    };

    if (existing) {
      const [updated] = await this.db
        .update(liveLessonAssignments)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(liveLessonAssignments.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await this.db
      .insert(liveLessonAssignments)
      .values({ lessonId, liveCourseId: ctx.liveCourseId, ...values })
      .returning();
    return created;
  }

  async deleteAssignment(lessonId: number) {
    await this.getLessonCtx(lessonId);
    await this.db.delete(liveLessonAssignments).where(eq(liveLessonAssignments.lessonId, lessonId));
    return { deleted: true };
  }

  async listSubmissions(assignmentId: number) {
    const [assignment] = await this.db
      .select()
      .from(liveLessonAssignments)
      .where(eq(liveLessonAssignments.id, assignmentId))
      .limit(1);
    if (!assignment) throw new NotFoundException('Assignment not found');

    return this.db
      .select({
        id: liveLessonAssignmentSubmissions.id,
        content: liveLessonAssignmentSubmissions.content,
        fileUrl: liveLessonAssignmentSubmissions.fileUrl,
        status: liveLessonAssignmentSubmissions.status,
        grade: liveLessonAssignmentSubmissions.grade,
        feedback: liveLessonAssignmentSubmissions.feedback,
        submittedAt: liveLessonAssignmentSubmissions.submittedAt,
        gradedAt: liveLessonAssignmentSubmissions.gradedAt,
        userId: liveLessonAssignmentSubmissions.userId,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(liveLessonAssignmentSubmissions)
      .innerJoin(users, eq(liveLessonAssignmentSubmissions.userId, users.id))
      .where(eq(liveLessonAssignmentSubmissions.assignmentId, assignmentId))
      .orderBy(desc(liveLessonAssignmentSubmissions.submittedAt));
  }

  async gradeSubmission(submissionId: number, dto: GradeSubmissionDto) {
    const [sub] = await this.db
      .select()
      .from(liveLessonAssignmentSubmissions)
      .where(eq(liveLessonAssignmentSubmissions.id, submissionId))
      .limit(1);
    if (!sub) throw new NotFoundException('Submission not found');

    const [updated] = await this.db
      .update(liveLessonAssignmentSubmissions)
      .set({
        grade: String(dto.grade),
        feedback: dto.feedback ?? null,
        status: 'graded',
        gradedAt: new Date(),
      })
      .where(eq(liveLessonAssignmentSubmissions.id, submissionId))
      .returning();
    return updated;
  }

  // ── Student take/submit (used by the learn area) ─────────────────────────────

  async getQuizForTake(lessonId: number, userId: number) {
    const ctx = await this.getLessonCtx(lessonId);
    await this.curriculum.ensureEnrolled(ctx.liveCourseId, userId);
    const quiz = await this.loadQuiz(lessonId, false);
    if (!quiz) return null;
    const [lastAttempt] = await this.db
      .select()
      .from(liveLessonQuizAttempts)
      .where(and(eq(liveLessonQuizAttempts.quizId, quiz.id), eq(liveLessonQuizAttempts.userId, userId)))
      .orderBy(desc(liveLessonQuizAttempts.completedAt))
      .limit(1);
    return { ...quiz, lastAttempt: lastAttempt ?? null };
  }

  async submitQuiz(quizId: number, userId: number, dto: SubmitQuizDto) {
    const quiz = await this.getQuiz(quizId);
    await this.curriculum.ensureEnrolled(quiz.liveCourseId, userId);
    const questions = await this.db
      .select()
      .from(liveLessonQuizQuestions)
      .where(eq(liveLessonQuizQuestions.quizId, quizId));
    if (questions.length === 0) throw new NotFoundException('Quiz has no questions');

    const qIds = questions.map((q) => q.id);
    const answers = await this.db
      .select()
      .from(liveLessonQuizAnswers)
      .where(inArray(liveLessonQuizAnswers.questionId, qIds));

    const submittedByQ = new Map<number, Set<number>>();
    for (const a of dto.answers) submittedByQ.set(a.questionId, new Set(a.answerIds));

    let correct = 0;
    for (const q of questions) {
      const correctIds = new Set(
        answers.filter((a) => a.questionId === q.id && a.isCorrect).map((a) => a.id),
      );
      const picked = submittedByQ.get(q.id) ?? new Set<number>();
      const isRight =
        correctIds.size === picked.size && [...correctIds].every((id) => picked.has(id));
      if (isRight) correct += 1;
    }

    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= quiz.passingScore;

    const [attempt] = await this.db
      .insert(liveLessonQuizAttempts)
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

  async getAssignmentForView(lessonId: number, userId: number) {
    const ctx = await this.getLessonCtx(lessonId);
    await this.curriculum.ensureEnrolled(ctx.liveCourseId, userId);
    const [assignment] = await this.db
      .select()
      .from(liveLessonAssignments)
      .where(eq(liveLessonAssignments.lessonId, lessonId))
      .limit(1);
    if (!assignment) return null;

    const [submission] = await this.db
      .select()
      .from(liveLessonAssignmentSubmissions)
      .where(
        and(
          eq(liveLessonAssignmentSubmissions.assignmentId, assignment.id),
          eq(liveLessonAssignmentSubmissions.userId, userId),
        ),
      )
      .limit(1);

    return { ...assignment, submission: submission ?? null };
  }

  async submitAssignment(assignmentId: number, userId: number, dto: SubmitAssignmentDto) {
    const [assignment] = await this.db
      .select()
      .from(liveLessonAssignments)
      .where(eq(liveLessonAssignments.id, assignmentId))
      .limit(1);
    if (!assignment) throw new NotFoundException('Assignment not found');
    await this.curriculum.ensureEnrolled(assignment.liveCourseId, userId);

    const [existing] = await this.db
      .select()
      .from(liveLessonAssignmentSubmissions)
      .where(
        and(
          eq(liveLessonAssignmentSubmissions.assignmentId, assignmentId),
          eq(liveLessonAssignmentSubmissions.userId, userId),
        ),
      )
      .limit(1);

    if (existing) {
      const [updated] = await this.db
        .update(liveLessonAssignmentSubmissions)
        .set({
          content: dto.content ?? null,
          fileUrl: dto.fileUrls?.[0] ?? null,
          status: 'submitted',
          grade: null,
          feedback: null,
          gradedAt: null,
          submittedAt: new Date(),
        })
        .where(eq(liveLessonAssignmentSubmissions.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await this.db
      .insert(liveLessonAssignmentSubmissions)
      .values({
        userId,
        assignmentId,
        content: dto.content ?? null,
        fileUrl: dto.fileUrls?.[0] ?? null,
      })
      .returning();
    return created;
  }
}

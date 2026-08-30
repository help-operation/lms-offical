import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { Message } from 'src/common/decorators/message.decorator';
import { CurrentUser, type RequestUser } from 'src/common/decorators/current-user.decorator';
import { LiveLessonAssessmentsService } from './live-lesson-assessments.service';
import {
  UpsertQuizDto,
  UpsertQuestionDto,
  UpsertAssignmentDto,
  GradeSubmissionDto,
  SubmitQuizDto,
  SubmitAssignmentDto,
} from 'src/assessments/dto/assessment.dto';

// ── Admin authoring + grading for live-course lesson assessments ──────────────

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('update_live')
@Controller('admin/live-courses')
export class AdminLiveLessonAssessmentsController {
  constructor(private readonly svc: LiveLessonAssessmentsService) {}

  // Quiz
  @Get('lessons/:lessonId/quiz')
  @RequirePermissions('view_live')
  @Message('Quiz fetched')
  getQuiz(@Param('lessonId', ParseIntPipe) lessonId: number) {
    return this.svc.getQuizForEdit(lessonId);
  }

  @Put('lessons/:lessonId/quiz')
  @Message('Quiz saved')
  upsertQuiz(@Param('lessonId', ParseIntPipe) lessonId: number, @Body() dto: UpsertQuizDto) {
    return this.svc.upsertQuiz(lessonId, dto);
  }

  @Delete('lessons/:lessonId/quiz')
  @Message('Quiz deleted')
  deleteQuiz(@Param('lessonId', ParseIntPipe) lessonId: number) {
    return this.svc.deleteQuiz(lessonId);
  }

  @Post('quizzes/:quizId/questions')
  @Message('Question added')
  addQuestion(@Param('quizId', ParseIntPipe) quizId: number, @Body() dto: UpsertQuestionDto) {
    return this.svc.addQuestion(quizId, dto);
  }

  @Put('questions/:questionId')
  @Message('Question updated')
  updateQuestion(@Param('questionId', ParseIntPipe) questionId: number, @Body() dto: UpsertQuestionDto) {
    return this.svc.updateQuestion(questionId, dto);
  }

  @Delete('questions/:questionId')
  @Message('Question deleted')
  deleteQuestion(@Param('questionId', ParseIntPipe) questionId: number) {
    return this.svc.deleteQuestion(questionId);
  }

  // Assignment
  @Get('lessons/:lessonId/assignment')
  @RequirePermissions('view_live')
  @Message('Assignment fetched')
  getAssignment(@Param('lessonId', ParseIntPipe) lessonId: number) {
    return this.svc.getAssignmentForEdit(lessonId);
  }

  @Put('lessons/:lessonId/assignment')
  @Message('Assignment saved')
  upsertAssignment(@Param('lessonId', ParseIntPipe) lessonId: number, @Body() dto: UpsertAssignmentDto) {
    return this.svc.upsertAssignment(lessonId, dto);
  }

  @Delete('lessons/:lessonId/assignment')
  @Message('Assignment deleted')
  deleteAssignment(@Param('lessonId', ParseIntPipe) lessonId: number) {
    return this.svc.deleteAssignment(lessonId);
  }

  @Get('assignments/:assignmentId/submissions')
  @RequirePermissions('view_live')
  @Message('Submissions fetched')
  listSubmissions(@Param('assignmentId', ParseIntPipe) assignmentId: number) {
    return this.svc.listSubmissions(assignmentId);
  }

  @Put('submissions/:submissionId/grade')
  @Message('Submission graded')
  gradeSubmission(
    @Param('submissionId', ParseIntPipe) submissionId: number,
    @Body() dto: GradeSubmissionDto,
  ) {
    return this.svc.gradeSubmission(submissionId, dto);
  }
}

// ── Student take/submit (enrollment-gated, distinct `live-lessons` prefix) ────

@UseGuards(JwtAuthGuard)
@Controller('live-lessons')
export class StudentLiveLessonAssessmentsController {
  constructor(private readonly svc: LiveLessonAssessmentsService) {}

  @Get(':lessonId/quiz/take')
  @Message('Quiz fetched')
  getQuiz(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.getQuizForTake(lessonId, user.userId);
  }

  @Get(':lessonId/assignment/view')
  @Message('Assignment fetched')
  getAssignment(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.getAssignmentForView(lessonId, user.userId);
  }
}

@UseGuards(JwtAuthGuard)
@Controller()
export class StudentLiveAssessmentActionsController {
  constructor(private readonly svc: LiveLessonAssessmentsService) {}

  @Post('live-quizzes/:quizId/attempt')
  @Message('Quiz submitted')
  submitQuiz(
    @Param('quizId', ParseIntPipe) quizId: number,
    @CurrentUser() user: RequestUser,
    @Body() dto: SubmitQuizDto,
  ) {
    return this.svc.submitQuiz(quizId, user.userId, dto);
  }

  @Post('live-assignments/:assignmentId/submit')
  @Message('Assignment submitted')
  submitAssignment(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @CurrentUser() user: RequestUser,
    @Body() dto: SubmitAssignmentDto,
  ) {
    return this.svc.submitAssignment(assignmentId, user.userId, dto);
  }
}

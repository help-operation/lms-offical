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
import {
  CurrentUser,
  type RequestUser,
} from 'src/common/decorators/current-user.decorator';
import { AssessmentsService } from './assessments.service';
import {
  UpsertQuizDto,
  UpsertQuestionDto,
  SubmitQuizDto,
  UpsertAssignmentDto,
  SubmitAssignmentDto,
  GradeSubmissionDto,
  UpsertResourceDto,
} from './dto/assessment.dto';

const isAdmin = (user: RequestUser) => user.role === 'SUPER_ADMIN';

// ── Instructor / Admin authoring ─────────────────────────────────────────────

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('update_courses')
@Controller('course-builder')
export class AssessmentsAuthorController {
  constructor(private readonly svc: AssessmentsService) {}

  @Get('lessons/:lessonId/quiz')
  @Message('Quiz fetched')
  getQuiz(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.getQuizForEdit(lessonId, user.userId, isAdmin(user));
  }

  @Put('lessons/:lessonId/quiz')
  @Message('Quiz saved')
  upsertQuiz(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpsertQuizDto,
  ) {
    return this.svc.upsertQuiz(lessonId, user.userId, isAdmin(user), dto);
  }

  @Delete('lessons/:lessonId/quiz')
  @Message('Quiz deleted')
  deleteQuiz(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.deleteQuiz(lessonId, user.userId, isAdmin(user));
  }

  @Post('quizzes/:quizId/questions')
  @Message('Question added')
  addQuestion(
    @Param('quizId', ParseIntPipe) quizId: number,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpsertQuestionDto,
  ) {
    return this.svc.addQuestion(quizId, user.userId, isAdmin(user), dto);
  }

  @Put('questions/:questionId')
  @Message('Question updated')
  updateQuestion(
    @Param('questionId', ParseIntPipe) questionId: number,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpsertQuestionDto,
  ) {
    return this.svc.updateQuestion(questionId, user.userId, isAdmin(user), dto);
  }

  @Delete('questions/:questionId')
  @Message('Question deleted')
  deleteQuestion(
    @Param('questionId', ParseIntPipe) questionId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.deleteQuestion(questionId, user.userId, isAdmin(user));
  }

  @Get('lessons/:lessonId/assignment')
  @Message('Assignment fetched')
  getAssignment(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.getAssignmentForEdit(lessonId, user.userId, isAdmin(user));
  }

  @Put('lessons/:lessonId/assignment')
  @Message('Assignment saved')
  upsertAssignment(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpsertAssignmentDto,
  ) {
    return this.svc.upsertAssignment(lessonId, user.userId, isAdmin(user), dto);
  }

  @Delete('lessons/:lessonId/assignment')
  @Message('Assignment deleted')
  deleteAssignment(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.deleteAssignment(lessonId, user.userId, isAdmin(user));
  }

  @Get('assignments/:assignmentId/submissions')
  @Message('Submissions fetched')
  listSubmissions(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.listSubmissions(assignmentId, user.userId, isAdmin(user));
  }

  @Put('submissions/:submissionId/grade')
  @Message('Submission graded')
  gradeSubmission(
    @Param('submissionId', ParseIntPipe) submissionId: number,
    @CurrentUser() user: RequestUser,
    @Body() dto: GradeSubmissionDto,
  ) {
    return this.svc.gradeSubmission(submissionId, user.userId, isAdmin(user), dto);
  }

  @Get('lessons/:lessonId/resources')
  @Message('Resources fetched')
  listResources(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.listResourcesForEdit(lessonId, user.userId, isAdmin(user));
  }

  @Post('lessons/:lessonId/resources')
  @Message('Resource added')
  addResource(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpsertResourceDto,
  ) {
    return this.svc.addResource(lessonId, user.userId, isAdmin(user), dto);
  }

  @Delete('resources/:resourceId')
  @Message('Resource deleted')
  deleteResource(
    @Param('resourceId', ParseIntPipe) resourceId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.deleteResource(resourceId, user.userId, isAdmin(user));
  }
}

// ── Student ──────────────────────────────────────────────────────────────────

@UseGuards(JwtAuthGuard)
@Controller()
export class AssessmentsStudentController {
  constructor(private readonly svc: AssessmentsService) {}

  @Get('lessons/:lessonId/quiz/take')
  @Message('Quiz fetched')
  getQuiz(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.getQuizForTake(lessonId, user.userId);
  }

  @Post('quizzes/:quizId/attempt')
  @Message('Quiz submitted')
  submitQuiz(
    @Param('quizId', ParseIntPipe) quizId: number,
    @CurrentUser() user: RequestUser,
    @Body() dto: SubmitQuizDto,
  ) {
    return this.svc.submitQuiz(quizId, user.userId, dto);
  }

  @Get('lessons/:lessonId/assignment/view')
  @Message('Assignment fetched')
  getAssignment(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.getAssignmentForView(lessonId, user.userId);
  }

  @Post('assignments/:assignmentId/submit')
  @Message('Assignment submitted')
  submitAssignment(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @CurrentUser() user: RequestUser,
    @Body() dto: SubmitAssignmentDto,
  ) {
    return this.svc.submitAssignment(assignmentId, user.userId, dto);
  }

  @Get('lessons/:lessonId/resources/view')
  @Message('Resources fetched')
  getResources(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.listResourcesForStudent(lessonId, user.userId);
  }
}

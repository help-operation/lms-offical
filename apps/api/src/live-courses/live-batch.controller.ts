import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { Message } from 'src/common/decorators/message.decorator';
import { CurrentUser, type RequestUser } from 'src/common/decorators/current-user.decorator';
import { LiveBatchService } from './live-batch.service';

// ─── Admin: manage sessions / resources / assignments / grading ──────────────

@Controller('admin/live-batch')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('update_live')
export class AdminLiveBatchController {
  constructor(private readonly svc: LiveBatchService) {}

  // Sessions (per batch)
  @Get('batches/:batchId/sessions')
  @RequirePermissions('view_live')
  @Message('Sessions fetched')
  listSessions(@Param('batchId', ParseIntPipe) batchId: number) {
    return this.svc.listSessions(batchId);
  }

  @Post('batches/:batchId/sessions')
  @Message('Session created')
  createSession(
    @Param('batchId', ParseIntPipe) batchId: number,
    @Body() body: any,
  ) {
    return this.svc.createSession(batchId, body);
  }

  @Patch('sessions/:sessionId')
  @Message('Session updated')
  updateSession(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() body: any,
  ) {
    return this.svc.updateSession(sessionId, body);
  }

  @Delete('sessions/:sessionId')
  @Message('Session deleted')
  deleteSession(@Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.svc.deleteSession(sessionId);
  }

  // Resources (per course)
  @Get('courses/:courseId/resources')
  @RequirePermissions('view_live')
  @Message('Resources fetched')
  listResources(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.svc.listResources(courseId);
  }

  @Post('courses/:courseId/resources')
  @Message('Resource created')
  createResource(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: any,
  ) {
    return this.svc.createResource(courseId, body);
  }

  @Patch('resources/:resourceId')
  @Message('Resource updated')
  updateResource(
    @Param('resourceId', ParseIntPipe) resourceId: number,
    @Body() body: any,
  ) {
    return this.svc.updateResource(resourceId, body);
  }

  @Delete('resources/:resourceId')
  @Message('Resource deleted')
  deleteResource(@Param('resourceId', ParseIntPipe) resourceId: number) {
    return this.svc.deleteResource(resourceId);
  }

  // Assignments (per batch)
  @Get('batches/:batchId/assignments')
  @RequirePermissions('view_live')
  @Message('Assignments fetched')
  listAssignments(@Param('batchId', ParseIntPipe) batchId: number) {
    return this.svc.listAssignments(batchId);
  }

  @Post('batches/:batchId/assignments')
  @Message('Assignment created')
  createAssignment(
    @Param('batchId', ParseIntPipe) batchId: number,
    @Body() body: any,
  ) {
    return this.svc.createAssignment(batchId, body);
  }

  @Patch('assignments/:assignmentId')
  @Message('Assignment updated')
  updateAssignment(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Body() body: any,
  ) {
    return this.svc.updateAssignment(assignmentId, body);
  }

  @Delete('assignments/:assignmentId')
  @Message('Assignment deleted')
  deleteAssignment(@Param('assignmentId', ParseIntPipe) assignmentId: number) {
    return this.svc.deleteAssignment(assignmentId);
  }

  // Submissions
  @Get('assignments/:assignmentId/submissions')
  @RequirePermissions('view_live')
  @Message('Submissions fetched')
  listSubmissions(@Param('assignmentId', ParseIntPipe) assignmentId: number) {
    return this.svc.listSubmissions(assignmentId);
  }

  @Patch('submissions/:submissionId/grade')
  @RequirePermissions('grade_live')
  @Message('Submission graded')
  gradeSubmission(
    @Param('submissionId', ParseIntPipe) submissionId: number,
    @Body() body: { score: number; feedback?: string },
  ) {
    return this.svc.gradeSubmission(submissionId, body);
  }
}

// ─── Student: batch dashboard + actions (enrollment-gated in service) ────────

@Controller('live-batch')
@UseGuards(JwtAuthGuard)
export class StudentLiveBatchController {
  constructor(private readonly svc: LiveBatchService) {}

  @Get('courses/:courseId/dashboard')
  @Message('Batch dashboard fetched')
  dashboard(
    @Param('courseId', ParseIntPipe) courseId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.getStudentDashboard(courseId, user.userId);
  }

  @Post('sessions/:sessionId/join')
  @Message('Joined session')
  joinSession(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.joinSession(sessionId, user.userId);
  }

  @Post('assignments/:assignmentId/submit')
  @Message('Assignment submitted')
  submitAssignment(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @CurrentUser() user: RequestUser,
    @Body() body: { submissionUrl?: string; submissionText?: string },
  ) {
    return this.svc.submitAssignment(assignmentId, user.userId, body);
  }
}

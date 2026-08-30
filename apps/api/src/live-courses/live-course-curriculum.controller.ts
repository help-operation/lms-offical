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
import { LiveCourseCurriculumService } from './live-course-curriculum.service';

const isAdmin = (user: RequestUser) => user.role === 'SUPER_ADMIN';

// ─── Admin: curriculum management ────────────────────────────────────────────

@Controller('admin/live-courses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('update_live')
export class AdminLiveCourseCurriculumController {
  constructor(private readonly svc: LiveCourseCurriculumService) {}

  // Modules
  @Get(':courseId/modules')
  @RequirePermissions('view_live')
  @Message('Modules fetched')
  getModules(
    @Param('courseId', ParseIntPipe) courseId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.findModulesByCourse(courseId, user.userId, isAdmin(user));
  }

  @Post(':courseId/modules')
  @Message('Module created')
  createModule(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: { title: string },
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.createModule(courseId, body.title, user.userId, isAdmin(user));
  }

  @Patch('modules/:moduleId')
  @Message('Module updated')
  updateModule(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Body() body: { title: string },
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.updateModule(moduleId, body.title, user.userId, isAdmin(user));
  }

  @Delete('modules/:moduleId')
  @Message('Module deleted')
  deleteModule(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.deleteModule(moduleId, user.userId, isAdmin(user));
  }

  @Patch(':courseId/modules/reorder')
  @Message('Modules reordered')
  reorderModules(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: { order: { id: number; order: number }[] },
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.reorderModules(courseId, body.order, user.userId, isAdmin(user));
  }

  // Lessons
  @Post('modules/:moduleId/lessons')
  @Message('Lesson created')
  createLesson(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Body() body: { title: string; type?: 'video' | 'text' | 'quiz' | 'assignment'; content?: string; isFree?: boolean },
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.createLesson(moduleId, body, user.userId, isAdmin(user));
  }

  @Patch('lessons/:lessonId')
  @Message('Lesson updated')
  updateLesson(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Body() body: any,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.updateLesson(lessonId, body, user.userId, isAdmin(user));
  }

  @Delete('lessons/:lessonId')
  @Message('Lesson deleted')
  deleteLesson(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.deleteLesson(lessonId, user.userId, isAdmin(user));
  }

  @Patch('modules/:moduleId/lessons/reorder')
  @Message('Lessons reordered')
  reorderLessons(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Body() body: { order: { id: number; order: number }[] },
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.reorderLessons(moduleId, body.order, user.userId, isAdmin(user));
  }

  @Post('lessons/:lessonId/bunny-credentials')
  @Message('Upload credentials generated')
  getBunnyCredentials(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.getBunnyUploadCredentials(lessonId, user.userId, isAdmin(user));
  }

  @Post('lessons/:lessonId/external-url')
  @Message('External URL set')
  setExternalUrl(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Body() body: { url: string; duration?: number },
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.setExternalUrl(lessonId, body.url, body.duration, user.userId, isAdmin(user));
  }

  @Get('lessons/:lessonId/status')
  @RequirePermissions('view_live')
  @Message('Lesson status fetched')
  getLessonStatus(@Param('lessonId', ParseIntPipe) lessonId: number) {
    return this.svc.getLessonBunnyStatus(lessonId);
  }

  @Get('lessons/:lessonId/playback')
  @RequirePermissions('view_live')
  @Message('Playback resolved')
  getLessonPlayback(@Param('lessonId', ParseIntPipe) lessonId: number) {
    return this.svc.getLessonPlayback(lessonId);
  }
}

// ─── Student: enrollment-gated curriculum + playback ─────────────────────────

@Controller('live-courses')
@UseGuards(JwtAuthGuard)
export class StudentLiveCourseCurriculumController {
  constructor(private readonly svc: LiveCourseCurriculumService) {}

  // Two-segment static path so it never collides with the public `:id` / `:slug`
  // single-segment routes on the live-courses controller.
  @Get('enrolled/mine')
  @Message('My live enrollments fetched')
  myEnrollments(@CurrentUser() user: RequestUser) {
    return this.svc.getMyEnrolledCourseIds(user.userId);
  }

  @Get(':courseId/enrollment-status')
  @Message('Enrollment status fetched')
  enrollmentStatus(
    @Param('courseId', ParseIntPipe) courseId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.getEnrollmentStatus(courseId, user.userId);
  }

  @Get(':courseId/curriculum')
  @Message('Curriculum fetched')
  getCurriculum(
    @Param('courseId', ParseIntPipe) courseId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.getCurriculum(courseId, user.userId);
  }
}

// ─── Lesson playback (separate prefix, auth required) ────────────────────────

@Controller('live-lessons')
@UseGuards(JwtAuthGuard)
export class LiveLessonPlaybackController {
  constructor(private readonly svc: LiveCourseCurriculumService) {}

  @Get(':lessonId/playback')
  @Message('Playback info fetched')
  getPlayback(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.getPlaybackInfo(lessonId, user.userId);
  }

  @Post(':lessonId/complete')
  @Message('Lesson marked complete')
  markComplete(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.markLessonComplete(lessonId, user.userId);
  }

  @Get(':lessonId/notes')
  @Message('Notes fetched')
  listNotes(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.listNotes(user.userId, lessonId);
  }

  @Post(':lessonId/notes')
  @Message('Note created')
  createNote(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @CurrentUser() user: RequestUser,
    @Body() body: { content: string; videoTimestamp?: number },
  ) {
    return this.svc.createNote(user.userId, lessonId, body.content, body.videoTimestamp ?? 0);
  }

  @Patch(':lessonId/notes/:noteId')
  @Message('Note updated')
  updateNote(
    @Param('noteId', ParseIntPipe) noteId: number,
    @CurrentUser() user: RequestUser,
    @Body() body: { content: string },
  ) {
    return this.svc.updateNote(user.userId, noteId, body.content);
  }

  @Delete(':lessonId/notes/:noteId')
  @Message('Note deleted')
  removeNote(
    @Param('noteId', ParseIntPipe) noteId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.removeNote(user.userId, noteId);
  }
}

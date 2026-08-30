import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from 'src/auth/optional-jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { CurrentUser, type RequestUser } from 'src/common/decorators/current-user.decorator';
import { Message } from 'src/common/decorators/message.decorator';
import { LiveCoursesService } from './live-courses.service';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';

// ─── Admin endpoints (auth required) ─────────────────────────────────────────

@Controller('admin/live-courses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('view_live')
export class AdminLiveCoursesController {
  constructor(
    private readonly service: LiveCoursesService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  @Get()
  @Message('Live courses fetched')
  findAll(@CurrentUser() user: RequestUser, @Query('status') status?: string) {
    return this.service.findAll(user.userId, user.role === 'SUPER_ADMIN', status);
  }

  @Get('teachers')
  @Message('Teachers fetched')
  listTeachers() {
    return this.service.listTeachers();
  }

  @Get('recorded-courses')
  @Message('Recorded courses fetched')
  listRecordedCourses() {
    return this.service.listPublishedRecordedCourses();
  }

  @Get('check-slug')
  @Message('Slug checked')
  checkSlug(@Query('slug') slug: string, @Query('excludeId') excludeId?: string) {
    return this.service.checkSlug(slug, excludeId ? Number(excludeId) : undefined);
  }

  @Get(':id')
  @Message('Live course fetched')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Post()
  @RequirePermissions('create_live')
  @Message('Live course created')
  async create(
    @Body() body: any,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.service.create(body);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'live_course_created', entity: 'live_course', entityId: (result as any)?.id, meta: { title: body.title } });
    return result;
  }

  @Patch(':id')
  @RequirePermissions('update_live')
  @Message('Live course updated')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.service.update(id, body, actor.userId, actor.role === 'SUPER_ADMIN');
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'live_course_updated', entity: 'live_course', entityId: id });
    return result;
  }

  @Patch(':id/toggle-publish')
  @RequirePermissions('publish_live')
  @Message('Live course status updated')
  async togglePublish(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.service.togglePublish(id);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'live_course_publish_toggled', entity: 'live_course', entityId: id });
    return result;
  }

  @Post(':id/duplicate')
  @RequirePermissions('create_live')
  @Message('Live course duplicated')
  async duplicate(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { includeCurriculum?: boolean },
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.service.duplicate(id, body.includeCurriculum ?? false);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'live_course_created', entity: 'live_course', entityId: (result as any)?.id, meta: { duplicatedFrom: id } });
    return result;
  }

  @Delete(':id')
  @RequirePermissions('delete_live')
  @Message('Live course moved to Trash')
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.service.delete(id);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'live_course_trashed', entity: 'live_course', entityId: id });
    return result;
  }

  @Post(':id/restore')
  @RequirePermissions('delete_live')
  @Message('Live course restored')
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.service.restore(id);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'live_course_restored', entity: 'live_course', entityId: id });
    return result;
  }

  @Delete(':id/purge')
  @RequirePermissions('delete_live')
  @Message('Live course permanently deleted')
  async purge(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.service.purge(id);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'live_course_purged', entity: 'live_course', entityId: id });
    return result;
  }

  @Post(':id/schedule')
  @RequirePermissions('publish_live')
  @Message('Live course scheduled')
  async schedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { publishAt: string },
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.service.schedulePublish(id, new Date(body.publishAt));
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'live_course_scheduled', entity: 'live_course', entityId: id, meta: { publishAt: body.publishAt } });
    return result;
  }

  @Post(':id/unschedule')
  @RequirePermissions('publish_live')
  @Message('Live course unscheduled')
  async unschedule(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.service.unschedule(id);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'live_course_unscheduled', entity: 'live_course', entityId: id });
    return result;
  }
}

// ─── Public endpoints (no auth) ───────────────────────────────────────────────

@Controller('live-courses')
export class PublicLiveCoursesController {
  constructor(private readonly service: LiveCoursesService) {}

  @Get()
  @Message('Live courses fetched')
  findAllPublished() {
    return this.service.findAllPublished();
  }

  // Query-param lookup so multi-segment custom paths (e.g. "course1/bac") resolve
  // safely without relying on encoded slashes in the URL path.
  @Get('by-path')
  @Message('Live course fetched')
  findByPath(@Query('path') path: string) {
    return this.service.findBySlug(path ?? '');
  }

  @Get('by-id/:id')
  @Message('Live course fetched')
  findByIdPublic(@Param('id', ParseIntPipe) id: number) {
    return this.service.findByIdPublic(id);
  }

  @Get(':slug')
  @Message('Live course fetched')
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  @Post(':id/interest')
  @UseGuards(JwtAuthGuard)
  @Message('Interest tracked')
  async trackInterest(
    @Param('id', ParseIntPipe) liveCourseId: number,
    @CurrentUser() user: RequestUser,
  ) {
    await this.service.trackLiveCourseInterest(user.userId, liveCourseId);
    return { tracked: true };
  }

  @Post(':id/initiate-payment')
  @UseGuards(OptionalJwtAuthGuard)
  @Message('Payment initiated')
  initiatePayment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser | undefined,
    @Body() body: { name: string; phone: string; email: string; callbackUrl: string; batchId?: number },
  ) {
    // Link the enrollment to the account only for logged-in students (not
    // admins). Guests have no user → enrollment stays a standalone lead.
    const userId = user?.userType === 'user' ? user.userId : undefined;
    return this.service.initiatePayment(id, { ...body, userId });
  }

  @Post(':id/enroll-free')
  @UseGuards(OptionalJwtAuthGuard)
  @Message('Enrolled successfully')
  enrollFree(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser | undefined,
    @Body() body: { name: string; phone: string; email: string; batchId?: number },
  ) {
    const userId = user?.userType === 'user' ? user.userId : undefined;
    return this.service.enrollFree(id, { ...body, userId });
  }
}

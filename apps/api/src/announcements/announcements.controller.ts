import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { Message } from 'src/common/decorators/message.decorator';
import { CurrentUser, type RequestUser } from 'src/common/decorators/current-user.decorator';
import { AnnouncementsService } from './announcements.service';
import type { CreateAnnouncementDto, UpdateAnnouncementDto } from './announcements.service';
import type { TableQueryInput } from 'src/common/utils/table-query.util';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';

@Controller()
export class AnnouncementsController {
  constructor(
    private readonly announcementsService: AnnouncementsService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  // ─── Public / Student ─────────────────────────────────────────────────────

  @Get('announcements/active')
  @Message('Active announcements fetched')
  listActive() {
    return this.announcementsService.listActive();
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  @Get('admin/announcements')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('view_announcements')
  @Message('Announcements fetched')
  listAll(@Query() query: TableQueryInput) {
    return this.announcementsService.listAll(query);
  }

  @Post('admin/announcements')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('create_announcements')
  @Message('Announcement created')
  async create(
    @Body() dto: CreateAnnouncementDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.announcementsService.create(dto);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'announcement_created', entity: 'announcement', entityId: (result as any)?.id });
    return result;
  }

  @Put('admin/announcements/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('update_announcements')
  @Message('Announcement updated')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAnnouncementDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.announcementsService.update(id, dto);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'announcement_updated', entity: 'announcement', entityId: id });
    return result;
  }

  @Post('admin/announcements/:id/toggle')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('update_announcements')
  @Message('Announcement toggled')
  async toggle(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.announcementsService.toggle(id);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'announcement_toggled', entity: 'announcement', entityId: id });
    return result;
  }

  @Delete('admin/announcements/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('delete_announcements')
  @Message('Announcement deleted')
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.announcementsService.delete(id);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'announcement_deleted', entity: 'announcement', entityId: id });
    return result;
  }
}

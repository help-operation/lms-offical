import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Message } from 'src/common/decorators/message.decorator';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { CurrentUser, type RequestUser } from 'src/common/decorators/current-user.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { LessonsService } from './lessons.service';
import {
  CreateLessonDto,
  UpdateLessonDto,
  ReorderLessonsDto,
} from './dto/lesson.dto';

// ── Instructor routes (INSTRUCTOR / SUPER_ADMIN) ─────────────────────────────

const isAdmin = (user: RequestUser) => user.role === 'SUPER_ADMIN';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('update_courses')
@Controller('course-builder')
export class LessonsController {
  constructor(private readonly svc: LessonsService) {}

  @Post('modules/:moduleId/lessons')
  @Message('Lesson created successfully')
  create(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateLessonDto,
  ) {
    return this.svc.create(moduleId, user.userId, dto, isAdmin(user));
  }

  @Put('lessons/:id')
  @Message('Lesson updated successfully')
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.svc.update(id, user.userId, dto, isAdmin(user));
  }

  @Delete('lessons/:id')
  @Message('Lesson deleted successfully')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: RequestUser) {
    return this.svc.remove(id, user.userId, isAdmin(user));
  }

  @Patch('modules/:moduleId/lessons/reorder')
  @Message('Lessons reordered successfully')
  reorder(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @CurrentUser() user: RequestUser,
    @Body() dto: ReorderLessonsDto,
  ) {
    return this.svc.reorder(moduleId, user.userId, dto, isAdmin(user));
  }

  // Returns TUS upload credentials so the browser can upload directly to Bunny
  @Post('lessons/:id/bunny-credentials')
  @Message('Bunny upload credentials generated')
  getBunnyCredentials(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.getBunnyUploadCredentials(id, user.userId, isAdmin(user));
  }

  // Preview lesson video — no enrollment check (admin/instructor only)
  @Get('lessons/:id/playback')
  @Message('Playback info retrieved')
  getPlayback(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getAdminPlayback(id);
  }

  // Save an external video URL (YouTube, MP4, etc.)
  @Post('lessons/:id/external-url')
  @Message('External video URL saved')
  setExternalUrl(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
    @Body('url') url: string,
    @Body('duration') duration?: number,
  ) {
    return this.svc.setExternalUrl(id, user.userId, url, isAdmin(user), duration);
  }
}

// ── Student / enrolled-user routes ───────────────────────────────────────────

@UseGuards(JwtAuthGuard)
@Controller('lessons')
export class LessonsPlaybackController {
  constructor(private readonly svc: LessonsService) {}

  @Get(':id/playback')
  @Message('Playback info retrieved')
  getPlayback(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.getPlaybackInfo(id, user.userId);
  }
}

// ── Public free-preview route (no auth; free lessons only) ────────────────────

@Controller('lessons')
export class PublicLessonsController {
  constructor(private readonly svc: LessonsService) {}

  @Get(':id/preview')
  @Message('Free preview retrieved')
  getPreview(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getFreePreview(id);
  }
}

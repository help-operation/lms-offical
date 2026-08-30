import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser, type RequestUser } from 'src/common/decorators/current-user.decorator';
import { Message } from 'src/common/decorators/message.decorator';
import { ProgressService } from './progress.service';

@Controller('student')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT', 'GUEST')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post('lessons/:lessonId/complete')
  @Message('Lesson marked as complete')
  markComplete(
    @CurrentUser() user: RequestUser,
    @Param('lessonId', ParseIntPipe) lessonId: number,
  ) {
    return this.progressService.markComplete(user.userId, lessonId);
  }

  @Post('lessons/:lessonId/progress')
  @Message('Progress updated')
  updateProgress(
    @CurrentUser() user: RequestUser,
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Body() body: { watchedSeconds: number },
  ) {
    return this.progressService.updateWatchedSeconds(
      user.userId,
      lessonId,
      body.watchedSeconds,
    );
  }

  @Get('courses/:courseId/progress')
  @Message('Progress fetched')
  getCourseProgress(
    @CurrentUser() user: RequestUser,
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.progressService.getCourseProgress(user.userId, courseId);
  }
}

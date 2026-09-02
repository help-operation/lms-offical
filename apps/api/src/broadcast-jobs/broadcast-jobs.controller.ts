import { Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { BroadcastJobsService } from './broadcast-jobs.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { CurrentUser, type RequestUser } from 'src/common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('broadcast-jobs')
export class BroadcastJobsController {
  constructor(private readonly svc: BroadcastJobsService) {}

  // Must come before ':id' so "student"/"search" aren't parsed as a job id.
  @Get('student/:studentId')
  @RequirePermissions('view_broadcast_jobs')
  studentHistory(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.svc.getStudentHistory(studentId);
  }

  @Get('search')
  @RequirePermissions('view_broadcast_jobs')
  search(@Query('query') query?: string) {
    if (!query || query.trim().length < 2) return [];
    return this.svc.searchRecipients(query);
  }

  @Get('scheduled')
  @RequirePermissions('view_broadcast_jobs')
  scheduled() {
    return this.svc.getDueScheduledJobs();
  }

  @Get('history')
  @RequirePermissions('view_broadcast_jobs')
  messageHistory(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('status') status?: string,
    @Query('channel') channel?: string,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('jobId') jobId?: string,
  ) {
    return this.svc.getMessageHistory({
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
      status,
      channel,
      search,
      dateFrom,
      dateTo,
      jobId: jobId ? parseInt(jobId, 10) : undefined,
    });
  }

  @Get('export')
  @RequirePermissions('view_broadcast_jobs')
  exportHistory(
    @Query('channel') channel?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('jobId') jobId?: string,
  ) {
    return this.svc.exportMessageHistory({
      channel,
      status,
      dateFrom,
      dateTo,
      jobId: jobId ? parseInt(jobId, 10) : undefined,
    });
  }

  @Get()
  @RequirePermissions('view_broadcast_jobs')
  list(@Query('limit') limit?: string, @Query('status') status?: string) {
    return this.svc.listJobs(limit ? parseInt(limit, 10) : 100, status);
  }

  @Get(':id')
  @RequirePermissions('view_broadcast_jobs')
  getJob(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getJob(id);
  }

  @Get(':id/recipients')
  @RequirePermissions('view_broadcast_jobs')
  getRecipients(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getJobRecipients(id);
  }

  @Get('detail/:recipientId')
  @RequirePermissions('view_broadcast_jobs')
  getMessageDetail(@Param('recipientId', ParseIntPipe) recipientId: number) {
    return this.svc.getMessageDetail(recipientId);
  }

  @Post(':id/cancel')
  @RequirePermissions('view_broadcast_jobs')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.svc.cancelJob(id);
  }

  @Post('resend/:recipientId')
  @RequirePermissions('send_manual_sms')
  resend(
    @Param('recipientId', ParseIntPipe) recipientId: number,
    @CurrentUser() user: RequestUser,
  ) {
    const adminId = user.userType === 'admin' ? user.userId : undefined;
    return this.svc.resendMessage(recipientId, adminId);
  }
}

import { Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { BroadcastJobsService } from './broadcast-jobs.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';

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

  @Post(':id/cancel')
  @RequirePermissions('view_broadcast_jobs')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.svc.cancelJob(id);
  }
}

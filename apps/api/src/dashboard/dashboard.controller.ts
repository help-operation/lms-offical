import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { Message } from 'src/common/decorators/message.decorator';
import { DashboardService } from './dashboard.service';
import type { DashboardQueryInput } from './dto/dashboard-query.dto';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('view_dashboard')
export class DashboardController {
  constructor(private readonly svc: DashboardService) {}

  @Get('overview')
  @Message('Dashboard overview fetched')
  getOverview(@Query() query: DashboardQueryInput) {
    return this.svc.getOverview(query);
  }

  @Get('per-course-students')
  @Message('Per-course student list fetched')
  getPerCourseStudents() {
    return this.svc.getPerCourseStudents();
  }

  @Get('system-health')
  @Message('System health fetched')
  getSystemHealth() {
    return this.svc.getSystemHealth();
  }

  @Get('filters')
  @Message('Dashboard filters fetched')
  getFilters() {
    return this.svc.getFilters();
  }

  @Get('enrollment-trend')
  @Message('Enrollment trend fetched')
  getEnrollmentTrend(@Query() query: DashboardQueryInput) {
    return this.svc.getEnrollmentTrend(query);
  }

  @Get('revenue-by-course')
  @Message('Revenue by course fetched')
  getRevenueByCourse(@Query() query: DashboardQueryInput) {
    return this.svc.getRevenueByCourse(query);
  }

  @Get('student-growth')
  @Message('Student growth fetched')
  getStudentGrowth(@Query() query: DashboardQueryInput) {
    return this.svc.getStudentGrowth(query);
  }

  @Get('revenue-time-series')
  @Message('Revenue time series fetched')
  getRevenueTimeSeries(@Query() query: DashboardQueryInput) {
    return this.svc.getRevenueTimeSeries(query);
  }

  @Get('communication')
  @Message('Communication overview fetched')
  getCommunicationOverview() {
    return this.svc.getCommunicationOverview();
  }
}

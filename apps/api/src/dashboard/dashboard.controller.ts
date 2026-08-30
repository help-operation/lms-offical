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
}
